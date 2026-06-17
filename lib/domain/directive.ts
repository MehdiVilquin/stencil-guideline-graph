// Directive signatures: a normalized read of "what does this rule actually say"
// for a given subject, used to tell CONTRADICTION (resolve by precedence) from
// REINFORCEMENT (both stay active). Deterministic, content-derived.

import { Rule } from './types';

const lc = (s: string) => s.toLowerCase();

/** Numeric bound (characters/items) for length rules. */
export function numericBound(rule: Rule): number | null {
  const t = lc(rule.text);
  const charMatch = t.match(/(\d+)\s*char/);
  if (charMatch) return Number(charMatch[1]);
  const range = t.match(/(\d+)\s*(?:to|–|-)\s*(\d+)/);
  if (range) return Number(range[2]); // upper bound
  const first = t.match(/\b(\d+)\b/);
  return first ? Number(first[1]) : null;
}

/**
 * A coarse polarity/value signature within a subject. Same subject + different
 * signature ⇒ contradiction. Same/empty signature ⇒ compatible (reinforcing).
 */
export function directiveSignature(rule: Rule): string | null {
  const t = lc(`${rule.name}. ${rule.text}`);

  // currency placement
  if (rule.subject === 'currency') {
    if (/before the amount|symbol before|€\s*\d/.test(t)) return 'currency:before';
    if (/after (the )?amount|symbol after|\d+\s*€|comma decimal/.test(t)) return 'currency:after';
  }
  // quotes style
  if (rule.subject === 'quotes') {
    if (/guillemet|« »/.test(t)) return 'quotes:guillemets';
    if (/typographic|“ ”|curly/.test(t)) return 'quotes:typographic';
  }
  // reader address register — test "informal" FIRST ("formal" is a substring of it)
  if (rule.subject === 'reader-address') {
    if (/informal|tutoiement|“tu”|“you”|warmly/.test(t)) return 'address:informal';
    if (/formal|\bsie\b|vouvoiement/.test(t)) return 'address:formal';
  }
  // exclamation usage
  if (rule.subject === 'exclamation-mark') {
    if (/never|no exclamation|forbidden/.test(t)) return 'exclaim:forbid';
    if (/single|one exclamation|may use/.test(t)) return 'exclaim:allow-one';
  }
  // require vs forbid a term (same subject)
  if (rule.constraintType === 'lexical-required') return 'lexical:require';
  if (rule.constraintType === 'lexical-forbidden') return 'lexical:forbid';

  // length: signature carries the bound
  if (rule.constraintType === 'length-bound') {
    const n = numericBound(rule);
    return n != null ? `length:${n}` : null;
  }
  return null;
}

/**
 * Two rules CONTRADICT iff, on the same subject, their directive signatures
 * are both defined and differ. Two forbidden-lexical rules on the same subject
 * share the 'lexical:forbid' signature ⇒ compatible (they reinforce).
 */
export function contradicts(a: Rule, b: Rule): boolean {
  if (a.subject !== b.subject) return false;
  const sa = directiveSignature(a);
  const sb = directiveSignature(b);
  if (sa == null || sb == null) return false;
  return sa !== sb;
}
