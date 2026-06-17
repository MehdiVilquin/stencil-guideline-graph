import type { Rule, Strength } from "@/lib/domain/types";
import { ruleSpecificity } from "@/lib/domain/scope";
import { CONSTRAINT_LABEL } from "@/lib/ui/labels";

/**
 * Strata — compliance sunburst. Rings = strength (core = invariant socle),
 * one arc per active rule, arc width ∝ (1 + specificity), colour by category.
 * Pure browser SVG (the `A` arc command is fully supported here).
 */
const SIZE = 384;
const C = SIZE / 2;
const BANDS: { key: Strength | "socle"; label: string; inner: number; outer: number }[] = [
  { key: "socle", label: "socle", inner: 34, outer: 62 },
  { key: "forbidden", label: "forbidden", inner: 64, outer: 94 },
  { key: "hard-rule", label: "hard", inner: 96, outer: 126 },
  { key: "conditional", label: "conditional", inner: 128, outer: 158 },
  { key: "soft-preference", label: "soft", inner: 160, outer: 190 },
];

const polar = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) };
};

function donut(inner: number, outer: number, a0: number, a1: number) {
  const p0o = polar(outer, a0);
  const p1o = polar(outer, a1);
  const p1i = polar(inner, a1);
  const p0i = polar(inner, a0);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${p0o.x} ${p0o.y} A ${outer} ${outer} 0 ${large} 1 ${p1o.x} ${p1o.y} L ${p1i.x} ${p1i.y} A ${inner} ${inner} 0 ${large} 0 ${p0i.x} ${p0i.y} Z`;
}

export default function Strata({ active }: { active: Rule[] }) {
  if (active.length === 0) {
    return <p className="text-[13px] text-[var(--muted-foreground)]">Aucune règle active pour ce contexte.</p>;
  }

  const bandRules = (key: Strength | "socle") =>
    key === "socle"
      ? active.filter((r) => !r.overridable)
      : active.filter((r) => r.overridable && r.strength === key);

  const GAP = 2.5;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[380px]" role="img" aria-label="Sunburst de conformité — règles actives par force">
        {BANDS.map((band) => {
          const rules = bandRules(band.key);
          if (rules.length === 0) {
            // faint empty ring so absence is legible
            return (
              <path
                key={band.key}
                d={donut(band.inner, band.outer, -90, 268)}
                fill="none"
                stroke="var(--border)"
                strokeWidth={1}
                strokeDasharray="2 4"
              />
            );
          }
          const weights = rules.map((r) => 1 + ruleSpecificity(r));
          const total = weights.reduce((s, w) => s + w, 0);
          const avail = 360 - GAP * rules.length;
          let ang = -90;
          return (
            <g key={band.key}>
              {rules.map((r, i) => {
                const span = (avail * weights[i]) / total;
                const a0 = ang;
                const a1 = ang + span;
                ang = a1 + GAP;
                const cat = CONSTRAINT_LABEL[r.constraintType];
                const mid = polar((band.inner + band.outer) / 2, (a0 + a1) / 2);
                return (
                  <g key={r.localId}>
                    <path d={donut(band.inner, band.outer, a0, a1)} fill={cat.color} fillOpacity={0.16} stroke={cat.color} strokeWidth={1}>
                      <title>{`#${r.localId} · ${r.name} · ${band.label} · spéc ${ruleSpecificity(r)}`}</title>
                    </path>
                    {span > 16 && (
                      <text x={mid.x} y={mid.y} textAnchor="middle" dominantBaseline="middle" className="fill-[var(--foreground)] text-[10px] font-medium">
                        #{r.localId}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
        {/* core */}
        <circle cx={C} cy={C} r={32} fill="var(--primary)" opacity={0.06} stroke="var(--primary)" strokeWidth={1.5} />
        <text x={C} y={C - 4} textAnchor="middle" className="fill-[var(--foreground)] text-[14px] font-semibold">
          {active.length}
        </text>
        <text x={C} y={C + 11} textAnchor="middle" className="fill-[var(--muted-foreground)] text-[10px]">
          actives
        </text>
      </svg>

      <div className="flex flex-col items-center gap-1.5 text-[10px] text-[var(--muted-foreground)]">
        <span>anneaux : socle · forbidden · hard · conditional · soft — largeur d’arc = spécificité</span>
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
          {(["lexical-forbidden", "lexical-required", "format-pattern", "length-bound", "structure", "register-tone"] as const).map((c) => (
            <span key={c} className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CONSTRAINT_LABEL[c].color }} />
              {CONSTRAINT_LABEL[c].label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
