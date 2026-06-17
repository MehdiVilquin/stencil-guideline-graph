import type { Rule, Strength } from "@/lib/domain/types";
import { ruleSpecificity } from "@/lib/domain/scope";
import { CONSTRAINT_LABEL } from "@/lib/ui/labels";
import { Shield } from "../icons";

/** Precedence ladder: rules grouped by strength (vertical), specificity (horizontal), invariants floored. */
const TIERS: { key: Strength; label: string }[] = [
  { key: "forbidden", label: "FORBIDDEN" },
  { key: "hard-rule", label: "HARD-RULE" },
  { key: "conditional", label: "CONDITIONAL" },
  { key: "soft-preference", label: "SOFT-PREF" },
];

export default function WeightLadder({ active, relations }: { active: Rule[]; relations: Map<string, string[]> }) {
  const socle = active.filter((r) => !r.overridable);
  const tierRules = (key: Strength) =>
    active.filter((r) => r.overridable && r.strength === key).sort((a, b) => ruleSpecificity(b) - ruleSpecificity(a));

  return (
    <div>
      <div className="rounded-[14px] border border-[var(--border)] bg-[var(--card)]">
        {TIERS.map((t) => (
          <Tier key={t.key} label={t.label} rules={tierRules(t.key)} relations={relations} />
        ))}
        {socle.length > 0 && <Tier label="SOCLE" rules={socle} relations={relations} socle />}
      </div>
      <Legend />
    </div>
  );
}

function Tier({
  label,
  rules,
  relations,
  socle = false,
}: {
  label: string;
  rules: Rule[];
  relations: Map<string, string[]>;
  socle?: boolean;
}) {
  return (
    <div className={`flex gap-3 border-b border-[var(--border)] px-3.5 py-2.5 last:border-0 ${socle ? "bg-[var(--primary)]/[0.04]" : ""}`}>
      <div className="flex w-[88px] shrink-0 items-center gap-1 pt-1">
        {socle && <Shield className="h-3.5 w-3.5 text-[var(--primary)]" />}
        <span className={`text-[10px] font-semibold tracking-wide ${socle ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"}`}>{label}</span>
      </div>
      <div className="flex flex-1 flex-wrap gap-1.5">
        {rules.length === 0 ? (
          <span className="pt-1 text-[12px] text-[var(--border)]">—</span>
        ) : (
          rules.map((r) => <Chip key={r.localId} rule={r} related={relations.get(r.localId) ?? []} socle={socle} />)
        )}
      </div>
    </div>
  );
}

function Chip({ rule, related, socle }: { rule: Rule; related: string[]; socle: boolean }) {
  const cat = CONSTRAINT_LABEL[rule.constraintType];
  const spec = ruleSpecificity(rule);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[10px] border bg-[var(--card)] py-1 pl-2 pr-1.5 ${
        socle ? "border-[var(--primary)]" : "border-[var(--border)]"
      }`}
      title={rule.name}
    >
      {socle ? (
        <Shield className="h-3 w-3 text-[var(--primary)]" />
      ) : (
        <span className="h-[7px] w-[7px] rounded-full" style={{ backgroundColor: cat.color }} />
      )}
      <span className={`font-mono text-[11px] ${socle ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"}`}>#{rule.localId}</span>
      <span className="max-w-[120px] truncate text-[11px] font-medium text-[var(--foreground)]">{rule.name}</span>
      <span
        className="rounded-[5px] bg-[var(--muted)] px-1 py-0.5 text-[9px] font-medium text-[var(--muted-foreground)]"
        title={`Spécificité : ${spec} dimension(s) de scope fixée(s)`}
      >
        S{spec}
      </span>
      {related.length > 0 ? (
        <span className="font-mono text-[10px] text-[var(--muted-foreground)]" title={`Reliée à ${related.map((i) => "#" + i).join(", ")}`}>
          ↔ {related.map((i) => `#${i}`).join(" ")}
        </span>
      ) : (
        <span className="text-[10px] text-[var(--muted-foreground)]" title="Solo — aucune relation">
          ○
        </span>
      )}
    </span>
  );
}

function Legend() {
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 px-1 text-[10px] text-[var(--muted-foreground)]">
      <span className="inline-flex items-center gap-1">
        <Shield className="h-3 w-3 text-[var(--primary)]" /> socle (invariant)
      </span>
      <span>
        <b className="font-semibold text-[var(--foreground)]">S</b> = spécificité — nb de dimensions de scope fixées
      </span>
      <span>↔ #x = reliée à la règle #x · ○ = solo (aucune relation)</span>
    </div>
  );
}
