"use client";

// A dependency-free node-link graph of the rule precedence relations.
// Layout is DETERMINISTIC and on-message: x = scope specificity (general → specific),
// so `overrides` edges visibly flow toward the more specific rule — the thesis,
// drawn. Reused by the Graph tab (context-scoped) and Doctrine/graph (full corpus).
//
// The SVG fills its container and is driven by a viewBox: it auto-centers/fits
// (preserveAspectRatio), zooms to the cursor on wheel, and pans on drag.

import { useEffect, useMemo, useRef, useState } from "react";
import { ruleSpecificity } from "@/lib/domain/scope";
import type { Edge, Rule } from "@/lib/domain/types";

export type GraphStatus = "active" | "suppressed" | "flagged" | "neutral";
export interface GraphNode {
  rule: Rule;
  status: GraphStatus;
}

const COL_GAP = 168;
const ROW_GAP = 58;
const PAD = 44;
const NODE_W = 116;
const NODE_H = 30;
const MARGIN = 48; // world padding around the node bounding box

const EDGE_STYLE: Record<Edge["type"], { stroke: string; dash?: string; arrow: boolean; width: number; label: string }> = {
  overrides: { stroke: "var(--primary)", arrow: true, width: 1.5, label: "overrides" },
  "conflicts-with": { stroke: "var(--destructive)", dash: "4 3", arrow: false, width: 1.25, label: "conflict" },
  reinforces: { stroke: "var(--muted-foreground)", arrow: false, width: 1, label: "reinforces" },
  "justified-by": { stroke: "var(--judged)", dash: "1 3", arrow: false, width: 1, label: "justified by" },
};

function nodeFill(status: GraphStatus) {
  if (status === "active") return "var(--primary)";
  if (status === "flagged") return "var(--judged)";
  return "var(--card)";
}
function nodeText(status: GraphStatus) {
  return status === "active" || status === "flagged" ? "var(--primary-foreground)" : "var(--muted-foreground)";
}
function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function RuleGraphSVG({ nodes, edges }: { nodes: GraphNode[]; edges: Edge[] }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);

  // ── deterministic layout: columns by specificity ────────────────────────
  const layout = useMemo(() => {
    const specs = [...new Set(nodes.map((n) => ruleSpecificity(n.rule)))].sort((a, b) => a - b);
    const cols = specs.map((s) =>
      nodes
        .filter((n) => ruleSpecificity(n.rule) === s)
        .sort(
          (a, b) =>
            a.rule.subject.localeCompare(b.rule.subject) || Number(a.rule.localId) - Number(b.rule.localId),
        ),
    );
    const maxRows = Math.max(1, ...cols.map((c) => c.length));
    const pos = new Map<string, { x: number; y: number }>();
    cols.forEach((col, ci) => {
      const yOffset = ((maxRows - col.length) * ROW_GAP) / 2;
      col.forEach((n, ri) => {
        pos.set(n.rule.localId, { x: PAD + ci * COL_GAP, y: PAD + yOffset + ri * ROW_GAP });
      });
    });
    const xs = [...pos.values()].map((p) => p.x);
    const ys = [...pos.values()].map((p) => p.y);
    const world: Box = {
      x: Math.min(...xs) - NODE_W / 2 - MARGIN,
      y: Math.min(...ys) - NODE_H / 2 - MARGIN,
      w: Math.max(...xs) - Math.min(...xs) + NODE_W + MARGIN * 2,
      h: Math.max(...ys) - Math.min(...ys) + NODE_H + MARGIN * 2,
    };
    return { pos, world };
  }, [nodes]);

  const { pos, world } = layout;
  const [view, setView] = useState<Box>(world);

  // reset view whenever the node set changes (signature on ids + statuses)
  const sig = useMemo(() => nodes.map((n) => n.rule.localId + n.status).join(","), [nodes]);
  useEffect(() => {
    setView(world);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  // ── screen → world via the live CTM (accounts for letterboxing) ──────────
  const toWorld = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return null;
    const pt = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
    return { x: pt.x, y: pt.y };
  };

  const zoomAround = (wx: number, wy: number, factor: number) => {
    setView((v) => {
      const minW = world.w * 0.25;
      const maxW = world.w * 4;
      let nw = v.w * factor;
      if (nw < minW) nw = minW;
      if (nw > maxW) nw = maxW;
      const k = nw / v.w;
      const nh = v.h * k;
      return { x: wx - (wx - v.x) * k, y: wy - (wy - v.y) * k, w: nw, h: nh };
    });
  };

  // wheel zoom — native non-passive listener so we can preventDefault
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const w = toWorld(e.clientX, e.clientY);
      if (!w) return;
      zoomAround(w.x, w.y, e.deltaY < 0 ? 1 / 1.12 : 1.12);
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world]);

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const a = toWorld(drag.current.x, drag.current.y);
    const b = toWorld(e.clientX, e.clientY);
    drag.current = { x: e.clientX, y: e.clientY };
    if (!a || !b) return;
    setView((v) => ({ ...v, x: v.x - (b.x - a.x), y: v.y - (b.y - a.y) }));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    drag.current = null;
    (e.currentTarget as SVGSVGElement).releasePointerCapture?.(e.pointerId);
  };

  const center = () => ({ wx: view.x + view.w / 2, wy: view.y + view.h / 2 });

  if (nodes.length === 0) {
    return (
      <div className="flex h-[58vh] min-h-[380px] items-center justify-center rounded-[12px] border border-[var(--border)] bg-[var(--surface-feed)] text-sm text-[var(--muted-foreground)]">
        No rules to display for this context.
      </div>
    );
  }

  const present = (id: string) => pos.has(id);
  const liveEdges = edges.filter((e) => present(e.from) && present(e.to));
  const isDim = (id: string) =>
    hover !== null &&
    hover !== id &&
    !liveEdges.some((e) => (e.from === hover && e.to === id) || (e.to === hover && e.from === id));
  const edgeLit = (e: Edge) => hover === null || e.from === hover || e.to === hover;

  return (
    <div>
      {/* legend */}
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] text-[var(--muted-foreground)]">
        {(Object.keys(EDGE_STYLE) as Edge["type"][]).map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5">
            <svg width="20" height="8" aria-hidden>
              <defs>
                <marker id={`lgd-${t}`} markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
                  <path d="M0,0 L5,2.5 L0,5 z" fill={EDGE_STYLE[t].stroke} />
                </marker>
              </defs>
              <line
                x1="0"
                y1="4"
                x2="20"
                y2="4"
                stroke={EDGE_STYLE[t].stroke}
                strokeWidth={EDGE_STYLE[t].width + 0.5}
                strokeDasharray={EDGE_STYLE[t].dash}
                markerEnd={EDGE_STYLE[t].arrow ? `url(#lgd-${t})` : undefined}
              />
            </svg>
            {EDGE_STYLE[t].label}
          </span>
        ))}
        <span className="ml-auto">scroll: zoom · drag: pan</span>
      </div>

      {/* canvas */}
      <div className="relative h-[58vh] min-h-[380px] overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--surface-feed)]">
        {/* zoom controls */}
        <div className="absolute right-2 top-2 z-10 flex flex-col gap-1">
          <CtrlBtn label="Zoom in" onClick={() => { const c = center(); zoomAround(c.wx, c.wy, 1 / 1.25); }}>+</CtrlBtn>
          <CtrlBtn label="Zoom out" onClick={() => { const c = center(); zoomAround(c.wx, c.wy, 1.25); }}>−</CtrlBtn>
          <CtrlBtn label="Fit" onClick={() => setView(world)}>⤢</CtrlBtn>
        </div>

        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Rule precedence graph"
          className="touch-none select-none"
          style={{ cursor: drag.current ? "grabbing" : "grab" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <defs>
            <marker id="g-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L7,3 L0,6 z" fill="var(--primary)" />
            </marker>
          </defs>

          {/* edges (behind nodes) */}
          {liveEdges.map((e, i) => {
            const a = pos.get(e.from)!;
            const b = pos.get(e.to)!;
            const st = EDGE_STYLE[e.type];
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2 - 26;
            return (
              <path
                key={i}
                d={`M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`}
                fill="none"
                stroke={st.stroke}
                strokeWidth={st.width}
                strokeDasharray={st.dash}
                markerEnd={st.arrow ? "url(#g-arrow)" : undefined}
                opacity={edgeLit(e) ? 0.75 : 0.12}
              />
            );
          })}

          {/* nodes */}
          {nodes.map((n) => {
            const p = pos.get(n.rule.localId)!;
            const dim = isDim(n.rule.localId);
            return (
              <g
                key={n.rule.localId}
                transform={`translate(${p.x - NODE_W / 2} ${p.y - NODE_H / 2})`}
                opacity={dim ? 0.25 : 1}
                onMouseEnter={() => setHover(n.rule.localId)}
                onMouseLeave={() => setHover(null)}
              >
                <title>
                  #{n.rule.localId} {n.rule.name} — {n.rule.strength} · {n.rule.subject}
                </title>
                <rect
                  width={NODE_W}
                  height={NODE_H}
                  rx={NODE_H / 2}
                  fill={nodeFill(n.status)}
                  stroke={
                    !n.rule.overridable
                      ? "var(--destructive)"
                      : n.status === "active"
                        ? "var(--primary)"
                        : "var(--border)"
                  }
                  strokeWidth={!n.rule.overridable ? 1.5 : 1}
                  strokeDasharray={n.status === "suppressed" ? "3 2" : undefined}
                />
                <text
                  x={NODE_W / 2}
                  y={NODE_H / 2 + 3.5}
                  textAnchor="middle"
                  fontSize="11"
                  fontFamily="var(--font-mono)"
                  fill={nodeText(n.status)}
                >
                  #{n.rule.localId} · {truncate(n.rule.subject, 9)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function CtrlBtn({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-[var(--border)] bg-[var(--card)] text-[14px] text-[var(--muted-foreground)] shadow-[var(--shadow-sm)] transition hover:text-[var(--foreground)]"
    >
      {children}
    </button>
  );
}
