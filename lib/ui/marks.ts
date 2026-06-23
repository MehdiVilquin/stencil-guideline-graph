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

/** Mirror the matched term's case onto the replacement: ALLCAPS → upper, Capitalized →
 *  capitalized, otherwise verbatim. Keeps "Best price" → "Meilleur price", not "meilleur". */
function matchCase(matched: string, repl: string): string {
  if (!repl) return repl;
  if (matched === matched.toUpperCase() && matched !== matched.toLowerCase()) return repl.toUpperCase();
  if (matched[0] === matched[0].toUpperCase() && matched[0] !== matched[0].toLowerCase())
    return repl[0].toUpperCase() + repl.slice(1);
  return repl;
}

/** Apply one prescribed fix to a text — only at WORD BOUNDARIES (the same matching the
 *  verifier's `present()` uses, so we never corrupt a larger word, e.g. "pro" inside
 *  "professionnel"), case-preserving, and treating `fix` LITERALLY (a function replacer,
 *  so a "$" in the replacement is not read as a $-pattern). "" = remove the term and tidy
 *  the leftover spacing/punctuation. Operates on the LIVE editor text so repeated applies
 *  compose. */
export function applyOneFix(text: string, term: string, fix: string): string {
  if (!term) return text;
  // (^|non-letter) consumed before; (non-letter|end) lookahead after so adjacent hits still match.
  const re = new RegExp(`(^|[^\\p{L}])(${escapeRe(term)})(?=[^\\p{L}]|$)`, "giu");
  const out = text.replace(re, (_m, pre: string, hit: string) => pre + matchCase(hit, fix));
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
