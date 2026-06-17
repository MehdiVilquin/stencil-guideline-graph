import type { Rule, Strength } from "@/lib/domain/types";
import { SCOPE_DIMENSIONS, STRENGTH_RANK, WILDCARD } from "@/lib/domain/types";
import { ruleSpecificity } from "@/lib/domain/scope";
import { Shield } from "../icons";

/** Pin Board — scope-coverage matrix, sorted by weight. Surfaces every active rule (incl. solo). */
const DIM_ABBR: Record<string, string> = {
  brand: "Br",
  locale: "Lo",
  contentType: "Ct",
  productCategory: "Pc",
  productType: "Pt",
  field: "Fl",
};

const STR: Record<Strength, { label: string; shade: string }> = {
  forbidden: { label: "forbidden", shade: "oklch(0.50 0.20 257)" },
  "hard-rule": { label: "hard", shade: "oklch(0.60 0.16 257)" },
  conditional: { label: "cond", shade: "oklch(0.72 0.10 257)" },
  "soft-preference": { label: "soft", shade: "oklch(0.82 0.06 257)" },
};

export default function PinBoard({ active, relations }: { active: Rule[]; relations: Map<string, string[]> }) {
  const rows = [...active].sort((a, b) => {
    if (a.overridable !== b.overridable) return a.overridable ? 1 : -1; // invariants floored to top
    const sa = ruleSpecificity(a);
    const sb = ruleSpecificity(b);
    if (sa !== sb) return sb - sa;
    return STRENGTH_RANK[b.strength] - STRENGTH_RANK[a.strength];
  });

  return (
    <div>
      <div className="overflow-x-auto rounded-[14px] border border-[var(--border)] bg-[var(--card)]">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="text-[9px] uppercase tracking-wide text-[var(--muted-foreground)]">
              <th className="py-2 pl-3 pr-2 font-medium">Règle</th>
              {SCOPE_DIMENSIONS.map((d) => (
                <th key={d} className="px-1 text-center font-medium">
                  {DIM_ABBR[d]}
                </th>
              ))}
              <th className="px-2 font-medium">Force</th>
              <th className="px-2 font-medium">Poids</th>
              <th className="px-2 font-medium">Liée</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const spec = ruleSpecificity(r);
              const str = STR[r.strength];
              const rel = relations.get(r.localId) ?? [];
              return (
                <tr
                  key={r.localId}
                  className="border-t border-[var(--border)]"
                  style={!r.overridable ? { backgroundColor: "color-mix(in oklch, var(--primary) 5%, transparent)" } : undefined}
                >
                  <td className="py-2 pl-3 pr-2">
                    <div className="flex items-center gap-1.5">
                      {!r.overridable && <Shield className="h-3 w-3 shrink-0 text-[var(--primary)]" />}
                      <span className={`font-mono text-[10px] ${r.overridable ? "text-[var(--muted-foreground)]" : "text-[var(--primary)]"}`}>#{r.localId}</span>
                      <span className="max-w-[150px] truncate text-[12px] font-medium text-[var(--foreground)]">{r.name}</span>
                    </div>
                  </td>
                  {SCOPE_DIMENSIONS.map((d) => {
                    const on = r.scope[d] !== WILDCARD;
                    return (
                      <td key={d} className="px-1 text-center" title={`${d} : ${r.scope[d]}`}>
                        <span className={on ? "text-[10px] text-[var(--foreground)]" : "text-[12px] text-[var(--border)]"}>{on ? "●" : "·"}</span>
                      </td>
                    );
                  })}
                  <td className="px-2">
                    <span className="text-[10px]" style={{ color: r.strength === "forbidden" ? "var(--destructive)" : "var(--muted-foreground)" }}>
                      {str.label}
                    </span>
                  </td>
                  <td className="px-2">
                    <span className="flex gap-0.5" title={`Poids : ${spec} dimension(s) fixée(s) · ${str.label}`}>
                      {Array.from({ length: 6 }, (_, i) => (
                        <span key={i} className="h-2 w-[7px] rounded-[2px]" style={{ backgroundColor: i < spec ? str.shade : "var(--muted)" }} />
                      ))}
                    </span>
                  </td>
                  <td className="px-2 font-mono text-[10px] text-[var(--muted-foreground)]" title={rel.length ? `Reliée à ${rel.map((i) => "#" + i).join(", ")}` : "Solo"}>
                    {rel.length ? `↔ ${rel.map((i) => `#${i}`).join(" ")}` : "○"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 px-1 text-[10px] text-[var(--muted-foreground)]">
        <span className="inline-flex items-center gap-1">
          <Shield className="h-3 w-3 text-[var(--primary)]" /> socle (invariant)
        </span>
        <span>● dimension de scope fixée · · wildcard</span>
        <span>barre <b className="font-semibold text-[var(--foreground)]">Poids</b> = nb de dimensions fixées (spécificité)</span>
        <span>↔ #x = reliée à #x · ○ = solo</span>
      </div>
    </div>
  );
}
