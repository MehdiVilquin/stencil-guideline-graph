import { useState } from "react";
import type { Decision, ResolveResult, Rule, Verdict } from "@/lib/domain/types";
import type { Turn } from "../types";
import { proofStats } from "@/lib/ui/proof";
import { CONSTRAINT_LABEL } from "@/lib/ui/labels";
import { Check, ChevronDown, ChevronRight, Copy, Cross, HalfCircle, Scale } from "../icons";

/** Proof inspector: result block + score + status-grouped rules + precedence. */
export default function RulebookView({
  turn,
  resolved,
  onRule,
}: {
  turn: Turn | null;
  resolved: ResolveResult | null;
  onRule: (localId: string) => void;
}) {
  if (!turn) return <ActivePreview resolved={resolved} onRule={onRule} />;

  const { result, decisions } = turn;
  const report = result.report;
  const proven = report.filter((v) => v.verifiable && v.pass);
  const violations = report.filter((v) => v.verifiable && !v.pass);
  const judgedFail = report.filter((v) => !v.verifiable && !v.pass);
  const judgedPass = report.filter((v) => !v.verifiable && v.pass);
  const contested = decisions.filter((d) => d.beat.length > 0);

  return (
    <div className="flex flex-col gap-4">
      <ResultBlock kind={turn.kind} copy={result.copy} />
      <ProofScore report={report} />

      {violations.length > 0 && (
        <Group icon={<Cross className="h-3.5 w-3.5 text-[var(--destructive)]" />} title="Violations" sub="to fix" count={`${violations.length}`} countColor="var(--destructive)">
          {violations.map((v) => (
            <RuleRow key={v.localId} v={v} onRule={onRule} />
          ))}
        </Group>
      )}

      <Group
        icon={<Check className="h-3.5 w-3.5 text-[var(--ok)]" />}
        title="Proven"
        sub="deterministic"
        count={`${proven.length}/${proven.length + violations.length}`}
        countColor="var(--ok)"
      >
        {proven.map((v) => (
          <RuleRow key={v.localId} v={v} onRule={onRule} />
        ))}
      </Group>

      {judgedFail.length > 0 && (
        <Group
          icon={<HalfCircle className="h-3.5 w-3.5 text-[var(--judged)]" />}
          title="Judged — not met"
          sub="LLM-judged, not proven"
          count={`${judgedFail.length}`}
          countColor="var(--judged)"
        >
          {judgedFail.map((v) => (
            <RuleRow key={v.localId} v={v} onRule={onRule} />
          ))}
        </Group>
      )}

      {judgedPass.length > 0 && (
        <Accordion
          icon={<HalfCircle className="h-3.5 w-3.5 text-[var(--judged)]" />}
          title="Judged — met"
          sub="LLM-judged, not proven"
          count={`${judgedPass.length}`}
          countColor="var(--judged)"
        >
          {judgedPass.map((v) => (
            <RuleRow key={v.localId} v={v} onRule={onRule} />
          ))}
        </Accordion>
      )}

      {contested.length > 0 && (
        <Accordion
          icon={<Scale className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />}
          title="Precedence"
          sub="why these rules"
          count={`${contested.length}`}
          countColor="var(--primary)"
        >
          <PrecedenceList decisions={contested} />
        </Accordion>
      )}
    </div>
  );
}

/* ── Result / copy block ── */

function ResultBlock({ kind, copy }: { kind: "write" | "rewrite"; copy: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = () => {
    navigator.clipboard?.writeText(copy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  return (
    <div className="rounded-[14px] border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-[11px] font-medium text-[var(--primary)]">
          {kind === "write" ? "Created" : "Corrected"}
        </span>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 rounded-[8px] border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--foreground)] transition hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/45"
        >
          <Copy className="h-[13px] w-[13px] text-[var(--muted-foreground)]" />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[var(--foreground)]">{copy}</p>
    </div>
  );
}

/* ── Proof score header + segmented bar ── */

function ProofScore({ report }: { report: Verdict[] }) {
  const { provable, greens, judged, judgedFail } = proofStats(report);
  const violations = provable - greens;
  const seg = (count: number, color: string) =>
    count > 0 ? <div className="h-2 rounded-full" style={{ flexGrow: count, backgroundColor: color }} /> : null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Check className="h-[15px] w-[15px] text-[var(--ok)]" />
          <span className="text-[14px] font-semibold text-[var(--foreground)]">
            <span className="tabular-nums">
              {greens}/{provable}
            </span>{" "}
            proven
          </span>
          <span className="text-[14px] text-[var(--muted-foreground)]"> · {judged} judged</span>
          {judgedFail > 0 && (
            <span className="text-[14px] font-medium text-[var(--judged)]"> ({judgedFail} unmet)</span>
          )}
        </div>
        <span className="text-[12px] tabular-nums text-[var(--muted-foreground)]">{report.length} rules</span>
      </div>
      <div className="flex w-full gap-0.5">
        {seg(greens, "color-mix(in oklch, var(--ok) 55%, white)")}
        {seg(violations, "color-mix(in oklch, var(--destructive) 55%, white)")}
        {seg(judged, "color-mix(in oklch, var(--judged) 55%, white)")}
        {report.length === 0 && <div className="h-2 flex-grow rounded-full bg-[var(--muted)]" />}
      </div>
    </div>
  );
}

/* ── one rule row ── */

function statusIcon(v: Verdict) {
  if (!v.verifiable) return <HalfCircle className="h-3.5 w-3.5 text-[var(--judged)]" />;
  return v.pass ? (
    <Check className="h-3.5 w-3.5 text-[var(--ok)]" />
  ) : (
    <Cross className="h-3.5 w-3.5 text-[var(--destructive)]" />
  );
}

function RuleRow({ v, onRule }: { v: Verdict; onRule: (localId: string) => void }) {
  const cat = CONSTRAINT_LABEL[v.constraintType];
  return (
    <button
      type="button"
      onClick={() => onRule(v.localId)}
      title={`View #${v.localId} in doctrine`}
      className="flex w-full items-start gap-2.5 border-b border-[var(--border)] py-2.5 text-left transition last:border-0 hover:bg-[var(--muted)]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/40"
    >
      <span className="mt-0.5 shrink-0">{statusIcon(v)}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <span className="font-mono text-[11px] text-[var(--muted-foreground)]">#{v.localId}</span>
          <span className="text-[13px] font-medium text-[var(--foreground)]">{v.ruleName}</span>
          <span
            className="rounded-[5px] bg-[var(--muted)] px-1.5 py-0.5 text-[10px] font-medium"
            style={{ color: cat.color }}
          >
            {cat.label}
          </span>
        </div>
        <div className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">{v.evidence}</div>
      </div>
    </button>
  );
}

/* ── group (always open) + accordion (collapsible) ── */

function GroupHeader({
  icon,
  title,
  sub,
  count,
  countColor,
  expandable,
  open,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  count: string;
  countColor: string;
  expandable?: boolean;
  open?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        {expandable && (
          <span className="text-[var(--muted-foreground)]">
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </span>
        )}
        {icon}
        <span className="text-[13px] font-medium text-[var(--foreground)]">{title}</span>
        <span className="text-[12px] text-[var(--muted-foreground)]">· {sub}</span>
      </div>
      <span className="text-[12px] font-medium tabular-nums" style={{ color: countColor }}>
        {count}
      </span>
    </div>
  );
}

function Group({
  icon,
  title,
  sub,
  count,
  countColor,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  count: string;
  countColor: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="pb-1.5">
        <GroupHeader icon={icon} title={title} sub={sub} count={count} countColor={countColor} />
      </div>
      <div>{children}</div>
    </section>
  );
}

function Accordion({
  icon,
  title,
  sub,
  count,
  countColor,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  count: string;
  countColor: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-[12px] border border-[var(--border)] bg-[var(--card)]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center px-3.5 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/40"
      >
        <div className="flex-1">
          <GroupHeader icon={icon} title={title} sub={sub} count={count} countColor={countColor} expandable open={open} />
        </div>
      </button>
      {open && <div className="border-t border-[var(--border)] px-3.5 pb-2">{children}</div>}
    </section>
  );
}

/* ── precedence ── */

function PrecedenceList({ decisions }: { decisions: Decision[] }) {
  return (
    <div className="flex flex-col gap-2 pt-2">
      {decisions.map((d, i) => (
        <div key={i} className="text-[12px] leading-relaxed">
          <span className="font-medium text-[var(--foreground)]">#{d.winner.localId}</span>{" "}
          <span className="text-[var(--muted-foreground)]">wins over</span>{" "}
          {d.beat.map((b, j) => (
            <span key={b.rule.localId} className="font-medium text-[var(--foreground)]">
              {j > 0 && ", "}#{b.rule.localId}
            </span>
          ))}
          <div className="text-[11px] text-[var(--muted-foreground)]">{d.beat[0].why}</div>
        </div>
      ))}
    </div>
  );
}

/* ── no-turn state: preview the active rulebook ── */

function ActivePreview({
  resolved,
  onRule,
}: {
  resolved: ResolveResult | null;
  onRule: (localId: string) => void;
}) {
  if (!resolved) return <div className="text-sm text-[var(--muted-foreground)]">Loading…</div>;
  const contested = resolved.decisions.filter((d) => d.beat.length > 0);
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="h-[7px] w-[7px] rounded-full bg-[var(--primary)]" />
          <span className="text-[13px] font-medium text-[var(--foreground)]">
            {resolved.active.length} active rules
          </span>
          <span className="text-[12px] text-[var(--muted-foreground)]">· current context</span>
        </div>
        <div>
          {resolved.active.map((r) => (
            <ActiveRuleRow key={r.localId} rule={r} onRule={onRule} />
          ))}
        </div>
      </div>
      {contested.length > 0 && (
        <Accordion
          icon={<Scale className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />}
          title="Precedence"
          sub="why these rules"
          count={`${contested.length}`}
          countColor="var(--primary)"
        >
          <PrecedenceList decisions={contested} />
        </Accordion>
      )}
      <p className="text-[12px] text-[var(--muted-foreground)]">
        Correct a copy on the left to see the proof, rule by rule, appear here.
      </p>
    </div>
  );
}

function ActiveRuleRow({ rule, onRule }: { rule: Rule; onRule: (localId: string) => void }) {
  const cat = CONSTRAINT_LABEL[rule.constraintType];
  return (
    <button
      type="button"
      onClick={() => onRule(rule.localId)}
      title={`Voir #${rule.localId} dans la doctrine`}
      className="flex w-full items-center gap-2.5 border-b border-[var(--border)] py-2 text-left transition last:border-0 hover:bg-[var(--muted)]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/40"
    >
      <span className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ backgroundColor: rule.overridable ? "var(--muted-foreground)" : "var(--primary)" }} />
      <span className="font-mono text-[11px] text-[var(--muted-foreground)]">#{rule.localId}</span>
      <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--foreground)]">{rule.name}</span>
      <span className="shrink-0 rounded-[5px] bg-[var(--muted)] px-1.5 py-0.5 text-[10px] font-medium" style={{ color: cat.color }}>
        {cat.label}
      </span>
      {!rule.overridable && (
        <span className="shrink-0 rounded-full bg-[var(--primary)]/10 px-1.5 py-0.5 text-[9px] font-medium uppercase text-[var(--primary)]">
          baseline
        </span>
      )}
    </button>
  );
}
