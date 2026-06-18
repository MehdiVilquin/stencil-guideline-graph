import { useState } from "react";
import type { Edge } from "@/lib/domain/types";
import type { GraphNode } from "../RuleGraphSVG";
import { CONSTRAINT_LABEL } from "@/lib/ui/labels";
import { EDGE_STYLE } from "./edgeStyle";
import { STATUS_STYLE } from "./statusStyle";
import { Check, ChevronDown, ChevronRight, HalfCircle, Shield } from "../icons";

/**
 * "Détail par sujet" — only subjects that have a RELATION become cards;
 * solo rules collapse into a compact list (subtraction, not 20 cards).
 * Colour = STATUS everywhere (see statusStyle).
 */
const STATUS_ORDER: Record<string, number> = { suppressed: 0, flagged: 1, neutral: 2, active: 3 };

export default function ClusterCards({
  nodes,
  edges,
  onRule,
}: {
  nodes: GraphNode[];
  edges: Edge[];
  onRule?: (localId: string) => void;
}) {
  if (nodes.length === 0) return null;

  const touched = new Set<string>();
  for (const e of edges) {
    touched.add(e.from);
    touched.add(e.to);
  }

  const bySubject = new Map<string, GraphNode[]>();
  for (const n of nodes) {
    const arr = bySubject.get(n.rule.subject) ?? [];
    arr.push(n);
    bySubject.set(n.rule.subject, arr);
  }
  const clusters = [...bySubject.entries()].map(([subject, members]) => ({ subject, members }));

  const related = clusters.filter((c) => c.members.length >= 2 || c.members.some((m) => touched.has(m.rule.localId)));
  const solo = clusters
    .filter((c) => !related.includes(c))
    .flatMap((c) => c.members)
    .sort((a, b) => STATUS_ORDER[b.status] - STATUS_ORDER[a.status]);

  return (
    <div className="flex flex-col gap-3">
      {related.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {related.map((c) => (
            <ClusterCard key={c.subject} subject={c.subject} members={c.members} edges={edges} onRule={onRule} />
          ))}
        </div>
      )}
      {solo.length > 0 && <SoloList rules={solo} onRule={onRule} />}
    </div>
  );
}

function ClusterCard({
  subject,
  members,
  edges,
  onRule,
}: {
  subject: string;
  members: GraphNode[];
  edges: Edge[];
  onRule?: (localId: string) => void;
}) {
  const ids = new Set(members.map((m) => m.rule.localId));
  const sorted = [...members].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  const category = CONSTRAINT_LABEL[members[0].rule.constraintType].label;
  const placed = new Set<Edge>();
  const intraBetween = (a: string, b: string) =>
    edges.find((e) => (e.from === a && e.to === b) || (e.from === b && e.to === a));

  return (
    <section className="rounded-[14px] border border-[var(--border)] bg-[var(--card)] p-3">
      <div className="mb-1.5 flex items-baseline gap-1.5">
        <span className="text-[12px] font-semibold text-[var(--foreground)]">{subject}</span>
        <span className="text-[11px] text-[var(--muted-foreground)]">· {category}</span>
      </div>

      <div className="flex flex-col">
        {sorted.map((m, i) => {
          const next = sorted[i + 1];
          const between = next ? intraBetween(m.rule.localId, next.rule.localId) : undefined;
          const cross = edges.filter((e) => e.from === m.rule.localId && !ids.has(e.to));
          if (between) placed.add(between);
          return (
            <div key={m.rule.localId} className="flex flex-col">
              <RuleRow node={m} onRule={onRule} />
              {cross.map((e, k) => (
                <EdgeChip key={`c${k}`} edge={e} showTarget />
              ))}
              {between && <EdgeChip edge={between} />}
            </div>
          );
        })}
        {edges
          .filter((e) => ids.has(e.from) && ids.has(e.to) && !placed.has(e))
          .map((e, k) => (
            <EdgeChip key={`r${k}`} edge={e} showPair />
          ))}
      </div>
    </section>
  );
}

/** One status marker (icon/dot) — never colour + border + check triple-encoding. */
function StatusMark({ node }: { node: GraphNode }) {
  if (!node.rule.overridable) return <Shield className="h-3.5 w-3.5 text-[var(--primary)]" />;
  if (node.status === "active") return <Check className="h-3.5 w-3.5 text-[var(--ok)]" />;
  if (node.status === "flagged") return <HalfCircle className="h-3.5 w-3.5 text-[var(--judged)]" />;
  return <span className="block h-2.5 w-2.5 rounded-full border-[1.5px] border-[var(--muted-foreground)]" />;
}

function RuleRow({ node, onRule }: { node: GraphNode; onRule?: (localId: string) => void }) {
  const r = node.rule;
  const suppressed = node.status === "suppressed";
  return (
    <button
      type="button"
      onClick={onRule ? () => onRule(r.localId) : undefined}
      title={onRule ? `View #${r.localId} in doctrine` : undefined}
      className="flex w-full items-center gap-2 rounded-[6px] py-1 text-left transition hover:bg-[var(--muted)]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/40"
    >
      <span className="flex h-4 w-4 shrink-0 items-center justify-center">
        <StatusMark node={node} />
      </span>
      <span className="font-mono text-[10px] text-[var(--muted-foreground)]">#{r.localId}</span>
      <span className="min-w-0 flex-1 text-[12px] font-medium leading-snug" style={{ color: suppressed ? "var(--muted-foreground)" : "var(--foreground)" }}>
        {r.name}
      </span>
      <span className="shrink-0 text-[10px] text-[var(--muted-foreground)]">{r.strength}</span>
    </button>
  );
}

function SoloList({ rules, onRule }: { rules: GraphNode[]; onRule?: (localId: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-[12px] border border-[var(--border)] bg-[var(--card)]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-1.5 px-3.5 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/40"
      >
        {open ? <ChevronDown className="h-3.5 w-3.5 text-[var(--muted-foreground)]" /> : <ChevronRight className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />}
        <span className="text-[12px] font-medium text-[var(--foreground)]">Solo rules</span>
        <span className="text-[12px] text-[var(--muted-foreground)]">· no relations</span>
        <span className="ml-auto text-[12px] tabular-nums text-[var(--muted-foreground)]">{rules.length}</span>
      </button>
      {open && (
        <div className="flex flex-wrap gap-1.5 border-t border-[var(--border)] p-3">
          {rules.map((n) => (
            <SoloChip key={n.rule.localId} node={n} onRule={onRule} />
          ))}
        </div>
      )}
    </section>
  );
}

function SoloChip({ node, onRule }: { node: GraphNode; onRule?: (localId: string) => void }) {
  const r = node.rule;
  return (
    <button
      type="button"
      onClick={onRule ? () => onRule(r.localId) : undefined}
      title={onRule ? `Voir #${r.localId} dans la doctrine` : `${r.name} · ${r.strength}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] py-1 pl-2 pr-2.5 transition hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/40"
    >
      {!r.overridable ? (
        <Shield className="h-3 w-3 text-[var(--primary)]" />
      ) : (
        <span className="h-[7px] w-[7px] rounded-full" style={{ backgroundColor: STATUS_STYLE[node.status].color }} />
      )}
      <span className="font-mono text-[10px] text-[var(--muted-foreground)]">#{r.localId}</span>
      <span className="max-w-[150px] truncate text-[11px] font-medium text-[var(--foreground)]">{r.name}</span>
    </button>
  );
}

function EdgeChip({ edge, showTarget, showPair }: { edge: Edge; showTarget?: boolean; showPair?: boolean }) {
  const s = EDGE_STYLE[edge.type];
  const head = showPair ? `#${edge.from} ${s.glyph} #${edge.to}` : `${s.glyph} ${s.label}${showTarget ? ` #${edge.to}` : ""}`;
  // keep only the "why" — drop the redundant "→ X prime sur Y" tail that repeats the head
  const reason = edge.reason ? edge.reason.split("→")[0].trim() : "";
  return (
    <span
      className="my-0.5 ml-6 block w-fit max-w-full rounded-[7px] px-2 py-0.5 text-[10px] font-medium leading-snug"
      style={{ color: s.color, backgroundColor: `color-mix(in oklch, ${s.color} 12%, white)` }}
    >
      {head}
      {reason ? ` · ${reason}` : ""}
    </span>
  );
}
