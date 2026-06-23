import { useMemo, type ReactNode } from "react";
import type { Turn } from "./types";
import { fieldLabel } from "@/lib/ui/labels";
import { draftReport, marksFromReport, unmarkedViolations, type DraftMark } from "@/lib/ui/marks";

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The submitted draft, marked up like a spell-checker: each deterministic violation
 *  gets a red wavy underline; clicking it jumps to the rule. The corrected, proven copy
 *  lives in the right-hand inspector — here we only show what was wrong. */
export default function DraftReview({
  turn,
  onRule,
  onApplyFix,
}: {
  turn: Turn;
  onRule: (localId: string) => void;
  onApplyFix: (term: string, fix: string) => void;
}) {
  const { marks, listed } = useMemo(() => {
    const report = draftReport(turn.input, turn.active, turn.result.context);
    return { marks: marksFromReport(report), listed: unmarkedViolations(report) };
  }, [turn]);

  const fixes = marks.filter((m) => m.fix !== undefined);
  const total = marks.length + listed.length;

  return (
    <div className="rounded-[14px] border border-[var(--primary)] bg-[var(--primary)]/[0.03] p-3.5">
      <div className="mb-2 flex items-center gap-2">
        <span className="shrink-0 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[11px] font-medium text-[var(--foreground)]">
          {turn.kind === "write" ? "Your brief" : "Your draft"}
        </span>
        <span className="truncate text-[12px] font-medium text-[var(--foreground)]">
          {fieldLabel(turn.result.context.field)}
        </span>
        <span className="flex-1" />
        {total > 0 ? (
          <span className="inline-flex shrink-0 items-center rounded-full bg-[var(--destructive)]/12 px-2 py-0.5 text-[11px] font-medium text-[var(--destructive)]">
            {total} issue{total > 1 ? "s" : ""}
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center rounded-full bg-[var(--ok)]/12 px-2 py-0.5 text-[11px] font-medium text-[var(--ok)]">
            no hard issues
          </span>
        )}
      </div>

      <HighlightedDraft text={turn.input} marks={marks} onRule={onRule} />

      {total === 0 && (
        <p className="mt-2 text-[11px] text-[var(--muted-foreground)]">
          No deterministic rule is broken — tone &amp; register are judged at correction, not here.
        </p>
      )}

      {listed.length > 0 && (
        <div className="mt-2.5 border-t border-[var(--border)] pt-2.5">
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
            Other issues
          </p>
          <div className="flex flex-col gap-0.5">
            {listed.map((v) => (
              <button
                key={v.localId}
                type="button"
                onClick={() => onRule(v.localId)}
                title={`#${v.localId} · ${v.ruleName} — view rule`}
                className="flex w-full items-start gap-2 rounded-[8px] px-1.5 py-1 text-left transition hover:bg-[var(--muted)]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/40"
              >
                <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--destructive)]" />
                <span className="min-w-0 flex-1 text-[12px] leading-snug">
                  <span className="font-medium text-[var(--foreground)]">{v.ruleName}</span>
                  <span className="text-[var(--muted-foreground)]"> · {v.evidence}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {fixes.length > 0 && (
        <div className="mt-2.5 border-t border-[var(--border)] pt-2.5">
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
            Suggested fixes
          </p>
          <div className="flex flex-wrap gap-1.5">
            {fixes.map((f, i) => (
              <button
                key={`${f.localId}-${i}`}
                type="button"
                onClick={() => onApplyFix(f.term, f.fix ?? "")}
                title={`#${f.localId} · ${f.ruleName} — apply to the editor`}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-2.5 py-1 text-[11px] transition hover:border-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/40"
              >
                <span className="text-[var(--destructive)] line-through">{f.term}</span>
                <span className="text-[var(--muted-foreground)]">→</span>
                <span className="font-medium text-[var(--ok)]">{f.fix ? f.fix : "remove"}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HighlightedDraft({
  text,
  marks,
  onRule,
}: {
  text: string;
  marks: DraftMark[];
  onRule: (localId: string) => void;
}) {
  if (!marks.length) {
    return <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[var(--foreground)]">{text}</p>;
  }

  const terms = [...new Set(marks.map((m) => m.term))].filter(Boolean).sort((a, b) => b.length - a.length);
  const re = new RegExp(`(${terms.map(escapeRe).join("|")})`, "gi");

  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const matched = m[0];
    const ml = matched.toLowerCase();
    const mk = marks.find((x) => x.term.toLowerCase() === ml) ?? marks.find((x) => ml.includes(x.term.toLowerCase()));
    nodes.push(
      <button
        key={`mk-${key++}`}
        type="button"
        onClick={() => mk && onRule(mk.localId)}
        title={mk ? `#${mk.localId} · ${mk.ruleName} — view rule` : undefined}
        className="rounded-[2px] bg-[var(--destructive)]/[0.08] text-[var(--foreground)] underline decoration-[var(--destructive)] decoration-wavy decoration-2 underline-offset-[3px] transition hover:bg-[var(--destructive)]/[0.16]"
      >
        {matched}
      </button>,
    );
    last = m.index + matched.length;
    if (re.lastIndex === m.index) re.lastIndex++;
  }
  if (last < text.length) nodes.push(text.slice(last));

  return <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[var(--foreground)]">{nodes}</p>;
}
