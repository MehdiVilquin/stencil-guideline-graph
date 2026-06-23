import type { GenerationContext, Rule, Verdict } from "@/lib/domain/types";
import { verifyAll, verifyForeignTerms, franglaisApplies } from "@/lib/domain/verifiers";

/** One inline highlight on a draft: an offending substring + the rule it breaks. */
export interface DraftMark {
  term: string;
  localId: string;
  ruleName: string;
  /** Prescribed replacement, when the rule carries one ("" = remove the term). */
  fix?: string;
}

/** Run the DETERMINISTIC checkers on a raw draft (the user's input), so we can point
 *  at what's wrong before any correction — like a spell-checker. Tone/judged rules are
 *  excluded by construction (they carry no `marks`). */
export function draftReport(input: string, active: Rule[], ctx: GenerationContext): Verdict[] {
  const rep = verifyAll(input, active);
  if (franglaisApplies(ctx.locale)) rep.push(verifyForeignTerms(input, active, ctx.brand));
  return rep;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Apply one prescribed fix to a text (all case-insensitive occurrences). "" = remove
 *  the term and tidy the leftover spacing/punctuation. Operates on the LIVE editor text
 *  so repeated applies compose. */
export function applyOneFix(text: string, term: string, fix: string): string {
  const out = text.replace(new RegExp(escapeRe(term), "gi"), fix);
  return fix === "" ? out.replace(/\s{2,}/g, " ").replace(/\s+([.,;!?])/g, "$1").trim() : out;
}

/** Deterministic violations that CANNOT be pinned to a token (length, structure,
 *  bullet-count, ambiguous format). Shown as a list, not inline squiggles — without
 *  this, a draft that fails e.g. the bullet-count rule looks "nothing flagged". */
export function unmarkedViolations(report: Verdict[]): Verdict[] {
  return report.filter((v) => v.verifiable && !v.pass && !v.marks);
}

/** Reduce a report to the token-localizable violations → inline marks (deduped). */
export function marksFromReport(report: Verdict[]): DraftMark[] {
  const out: DraftMark[] = [];
  const seen = new Set<string>();
  for (const v of report) {
    if (v.pass || !v.verifiable || !v.marks) continue;
    for (const term of v.marks) {
      const key = `${v.localId}::${term.toLowerCase()}`;
      if (!term || seen.has(key)) continue;
      seen.add(key);
      out.push({ term, localId: v.localId, ruleName: v.ruleName, fix: v.fix });
    }
  }
  return out;
}
