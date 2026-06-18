import type { Edge, Strength } from "@/lib/domain/types";
import type { GraphNode } from "../RuleGraphSVG";
import { ruleSpecificity } from "@/lib/domain/scope";
import { CONSTRAINT_LABEL } from "@/lib/ui/labels";
import { EDGE_STYLE } from "./edgeStyle";
import { LEGEND_STATUSES, STATUS_STYLE } from "./statusStyle";

/**
 * Node-link laid out in force tiers. ONE colour system: colour = STATUS.
 * Y = strength · radius = weight (specificity) · blue ring = socle · line = relation.
 */
const VIEW_W = 560;
const PAD = 12;
const LABEL_W = 78;
const BAND_H = 72;

const BANDS: { key: Strength | "socle"; label: string }[] = [
  { key: "forbidden", label: "Forbidden" },
  { key: "hard-rule", label: "Hard-rule" },
  { key: "conditional", label: "Conditional" },
  { key: "soft-preference", label: "Soft-pref" },
  { key: "socle", label: "Socle" },
];

const radius = (n: GraphNode) => 4.5 + ruleSpecificity(n.rule) * 1.4;

function paint(status: GraphNode["status"]) {
  const c = STATUS_STYLE[status].color;
  switch (status) {
    case "active":
      return { fill: c, fillOpacity: 0.85, dash: undefined };
    case "flagged":
      return { fill: c, fillOpacity: 0.55, dash: undefined };
    case "suppressed":
      return { fill: c, fillOpacity: 0.25, dash: "2 2" };
    default:
      return { fill: c, fillOpacity: 0.4, dash: undefined };
  }
}

type Pos = { x: number; y: number };

export default function ForceGraph({
  nodes,
  edges,
  onRule,
}: {
  nodes: GraphNode[];
  edges: Edge[];
  onRule?: (localId: string) => void;
}) {
  if (nodes.length === 0) return null;

  const bandOf = (n: GraphNode): Strength | "socle" => (!n.rule.overridable ? "socle" : n.rule.strength);
  const plotL = LABEL_W;
  const plotW = VIEW_W - PAD - plotL;
  const center = new Map<string, Pos>();

  BANDS.forEach((band, bi) => {
    const members = nodes
      .filter((n) => bandOf(n) === band.key)
      .sort((a, b) => (a.rule.subject < b.rule.subject ? -1 : a.rule.subject > b.rule.subject ? 1 : ruleSpecificity(b.rule) - ruleSpecificity(a.rule)));
    const y = PAD + bi * BAND_H + BAND_H / 2;
    members.forEach((n, k) => {
      const x = plotL + ((k + 0.5) / members.length) * plotW;
      center.set(n.rule.localId, { x, y });
    });
  });

  const totalH = PAD * 2 + BANDS.length * BAND_H;
  const present = edges.filter((e) => center.has(e.from) && center.has(e.to));

  return (
    <div className="rounded-[14px] border border-[var(--border)] bg-[var(--card)] p-2">
      <svg viewBox={`0 0 ${VIEW_W} ${totalH}`} className="w-full" role="img" aria-label="Active rules graph — by strength">
        <defs>
          <marker id="fg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" fill="var(--primary)" />
          </marker>
        </defs>

        {/* force bands */}
        {BANDS.map((band, bi) => {
          const yTop = PAD + bi * BAND_H;
          return (
            <g key={band.key}>
              {bi > 0 && <line x1={PAD} y1={yTop} x2={VIEW_W - PAD} y2={yTop} stroke="var(--border)" strokeWidth={1} strokeOpacity={0.5} />}
              <text x={PAD} y={yTop + BAND_H / 2} dominantBaseline="central" className="fill-[var(--muted-foreground)] text-[9px] font-semibold uppercase">
                {band.label}
              </text>
            </g>
          );
        })}

        {/* edges */}
        {present.map((e, i) => {
          const a = center.get(e.from)!;
          const b = center.get(e.to)!;
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.hypot(dx, dy) || 1;
          const curve = Math.min(30, len * 0.18);
          const cx = mx - (dy / len) * curve;
          const cy = my + (dx / len) * curve;
          const s = EDGE_STYLE[e.type];
          return (
            <path
              key={i}
              d={`M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`}
              fill="none"
              stroke={s.color}
              strokeWidth={1.2}
              strokeDasharray={s.dash}
              markerEnd={s.arrow ? "url(#fg-arrow)" : undefined}
              opacity={0.75}
            >
              <title>{s.label}</title>
            </path>
          );
        })}

        {/* nodes — colour = status */}
        {nodes.map((n) => {
          const p = center.get(n.rule.localId);
          if (!p) return null;
          const r = radius(n);
          const pa = paint(n.status);
          const inv = !n.rule.overridable;
          const cat = CONSTRAINT_LABEL[n.rule.constraintType];
          return (
            <g
              key={n.rule.localId}
              onClick={onRule ? () => onRule(n.rule.localId) : undefined}
              style={onRule ? { cursor: "pointer" } : undefined}
            >
              {inv && <circle cx={p.x} cy={p.y} r={r + 3} fill="none" stroke="var(--primary)" strokeWidth={1.2} />}
              <circle cx={p.x} cy={p.y} r={r} fill={pa.fill} fillOpacity={pa.fillOpacity} stroke={pa.fill} strokeWidth={1.4} strokeDasharray={pa.dash}>
                <title>{`#${n.rule.localId} · ${n.rule.name} · ${n.rule.strength} · ${cat.label} · poids ${ruleSpecificity(n.rule)} · ${STATUS_STYLE[n.status].label}`}</title>
              </circle>
              <text x={p.x} y={p.y + r + 8} textAnchor="middle" className="fill-[var(--muted-foreground)] text-[8px] font-medium">
                #{n.rule.localId}
              </text>
            </g>
          );
        })}
      </svg>

      <Legend />
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-1 flex flex-col gap-1 px-1 text-[9px] text-[var(--muted-foreground)]">
      <span>position verticale = force · taille = poids · 🛡 socle · trait = relation</span>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {LEGEND_STATUSES.map((s) => (
          <span key={s} className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_STYLE[s].color }} />
            {STATUS_STYLE[s].label}
          </span>
        ))}
      </div>
    </div>
  );
}
