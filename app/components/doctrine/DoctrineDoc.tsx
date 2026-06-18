"use client";

import { useEffect, useMemo, useState } from "react";
import type { Rule, RuleGraph, Strength } from "@/lib/domain/types";
import {
  buildDoctrineModel,
  constraintTypeLabel,
  type DoctrineConflictItem,
  type DoctrineRuleEntry,
} from "@/lib/domain/doctrine";
import { describeScope } from "@/lib/domain/scope";
import { CONSTRAINT_LABEL } from "@/lib/ui/labels";

const STRENGTH_LABEL: Record<Strength, string> = {
  forbidden: "forbidden",
  "hard-rule": "hard rule",
  conditional: "conditional",
  "soft-preference": "preference",
};

/**
 * The doctrine rendered as real, readable HTML (not raw markdown). Renders from
 * the structured `DoctrineModel`, so it stays consistent with the .md export.
 * `target` scrolls to + briefly highlights a rule (used by click-to-doctrine nav).
 */
export default function DoctrineDoc({
  graph,
  target,
}: {
  graph: RuleGraph;
  target: { id: string; key: number } | null;
}) {
  const model = useMemo(() => buildDoctrineModel(graph), [graph]);
  const [hl, setHl] = useState<string | null>(null);

  useEffect(() => {
    if (!target) return;
    const el = document.getElementById(`doctrine-rule-${target.id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHl(target.id);
    const t = setTimeout(() => setHl(null), 1600);
    return () => clearTimeout(t);
  }, [target]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-[18px] font-semibold tracking-tight text-[var(--foreground)]">
          Brand doctrine
        </h1>
        <p className="text-[12px] text-[var(--muted-foreground)]">
          Deterministic compilation of the typed graph — the explicit, editable, enforceable law.
        </p>
        <p className="text-[11px] tabular-nums text-[var(--muted-foreground)]">
          {model.meta.ruleCount} rules · {model.meta.edgeCount} relations ·{" "}
          {model.meta.flaggedCount} to clarify · brands: {model.meta.brands.join(", ") || "—"}
        </p>
      </header>

      {model.invariants.length > 0 && (
        <Section
          title="Invariants — non-negotiable guardrails"
          sub="Compliance floor, outside the precedence cascade (legal / medical / safety)."
        >
          {model.invariants.map((r) => (
            <RuleItem key={r.localId} rule={r} hl={hl} />
          ))}
        </Section>
      )}

      <Section title="Rules by constraint type">
        <div className="flex flex-col gap-5">
          {model.groups.map((g) => (
            <div key={g.constraintType} className="flex flex-col gap-2">
              <h3 className="flex items-baseline gap-1.5 text-[13px] font-semibold text-[var(--foreground)]">
                {constraintTypeLabel(g.constraintType)}
                {g.constraintType === "register-tone" && (
                  <span className="text-[11px] font-normal italic text-[var(--muted-foreground)]">
                    judged, not mechanically provable
                  </span>
                )}
              </h3>
              {g.rules.map((entry) => (
                <RuleItem
                  key={entry.rule.localId}
                  rule={entry.rule}
                  entry={entry}
                  hl={hl}
                />
              ))}
            </div>
          ))}
        </div>
      </Section>

      {model.conflicts.length > 0 && (
        <Section
          title="Detected conflicts & resolution"
          sub="How precedence resolves, by subject. Relations are only created between overlapping scopes → a brand partition is not a conflict."
        >
          <div className="flex flex-col gap-4">
            {model.conflicts.map((c) => (
              <div key={c.subject} className="flex flex-col gap-1.5">
                <h3 className="text-[13px] font-medium text-[var(--foreground)]">
                  Subject &laquo;{c.subject}&raquo;
                </h3>
                {c.items.map((it, i) => (
                  <ConflictItem key={i} item={it} />
                ))}
              </div>
            ))}
          </div>
        </Section>
      )}

      {model.flagged.length > 0 && (
        <Section
          title="To clarify — data hygiene"
          sub="Flagged at ingestion, never applied silently."
        >
          {model.flagged.map((r) => (
            <div
              key={r.localId}
              id={`doctrine-rule-${r.localId}`}
              className={`rounded-[10px] border border-[var(--border)] bg-[var(--card)] px-3 py-2 transition ${
                hl === r.localId ? "ring-2 ring-[var(--primary)]" : ""
              }`}
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-mono text-[11px] text-[var(--muted-foreground)]">#{r.localId}</span>
                <span className="text-[13px] font-medium text-[var(--foreground)]">{r.name}</span>
                <span className="rounded-[5px] bg-[var(--judged)]/15 px-1.5 py-0.5 text-[10px] font-medium text-[var(--judged)]">
                  {r.dataQuality}
                </span>
              </div>
              {r.comment && (
                <p className="mt-1 text-[12px] text-[var(--muted-foreground)]">{r.comment}</p>
              )}
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]">{title}</h2>
        {sub && <p className="text-[12px] text-[var(--muted-foreground)]">{sub}</p>}
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function RuleItem({
  rule,
  entry,
  hl,
}: {
  rule: Rule;
  entry?: DoctrineRuleEntry;
  hl: string | null;
}) {
  const cat = CONSTRAINT_LABEL[rule.constraintType];
  return (
    <div
      id={`doctrine-rule-${rule.localId}`}
      className={`rounded-[12px] border border-[var(--border)] bg-[var(--card)] p-3 transition ${
        hl === rule.localId ? "ring-2 ring-[var(--primary)]" : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-mono text-[11px] text-[var(--muted-foreground)]">#{rule.localId}</span>
        <span className="text-[13px] font-medium text-[var(--foreground)]">{rule.name}</span>
        <span
          className="rounded-[5px] bg-[var(--muted)] px-1.5 py-0.5 text-[10px] font-medium"
          style={{ color: cat.color }}
        >
          {cat.label}
        </span>
        <span className="rounded-[5px] bg-[var(--muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
          {STRENGTH_LABEL[rule.strength]}
        </span>
        {!rule.overridable && (
          <span className="rounded-full bg-[var(--primary)]/10 px-1.5 py-0.5 text-[9px] font-medium uppercase text-[var(--primary)]">
            baseline
          </span>
        )}
      </div>

      <p className="mt-2 border-l-2 border-[var(--border)] pl-3 text-[13px] leading-relaxed text-[var(--foreground)]">
        {rule.text}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--muted-foreground)]">
        <span>
          Scope: <span className="text-[var(--foreground)]">{describeScope(rule.scope)}</span>
        </span>
        {entry && entry.justifiedBy.length > 0 && (
          <span>justified by {entry.justifiedBy.map((id) => `#${id}`).join(", ")}</span>
        )}
        {entry && entry.reinforces.length > 0 && (
          <span>reinforces {entry.reinforces.map((id) => `#${id}`).join(", ")}</span>
        )}
      </div>
    </div>
  );
}

function ConflictItem({ item }: { item: DoctrineConflictItem }) {
  const reason =
    item.kind === "overrides"
      ? `more specific (${describeScope(item.winner.scope)}); outside this scope, #${item.loser.localId} applies.`
      : `same scope level, higher strength (${item.winner.strength} > ${item.loser.strength}).`;
  return (
    <p className="text-[12px] leading-relaxed text-[var(--muted-foreground)]">
      <span className="font-medium text-[var(--foreground)]">#{item.winner.localId}</span> wins over{" "}
      <span className="font-medium text-[var(--foreground)]">#{item.loser.localId}</span> — {reason}
    </p>
  );
}
