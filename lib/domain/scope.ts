// Scope lattice helpers: normalization, applicability, specificity, overlap.
// The scope is a 6-dimensional PARTIAL ORDER (a lattice), not a single line —
// some scopes are incomparable (e.g. field vs locale). "Most specific wins"
// = lowest applicable node in the lattice = most non-wildcard dims matched.
// Mental model: CSS specificity.

import {
  GenerationContext,
  Rule,
  ScopeVector,
  SCOPE_DIMENSIONS,
  WILDCARD,
} from './types';

/** Values that mean "applies to everything" in the source data. */
const WILDCARD_TOKENS = new Set(['', 'all', 'global', 'any', '[not provided]', 'n/a']);

/** Normalize a raw cell into either a precise value or the WILDCARD sentinel. */
export function normalizeScopeValue(raw: string | undefined | null): string {
  const v = (raw ?? '').trim();
  if (WILDCARD_TOKENS.has(v.toLowerCase())) return WILDCARD;
  return v;
}

/**
 * A rule is APPLICABLE to a context iff, for EVERY dimension, the rule is
 * wildcard OR equals the context value. (The applicability filter.)
 */
export function isApplicable(scope: ScopeVector, ctx: GenerationContext): boolean {
  return SCOPE_DIMENSIONS.every((d) => {
    const rv = scope[d];
    if (rv === WILDCARD) return true;
    return rv.toLowerCase() === String(ctx[d] ?? '').toLowerCase();
  });
}

/** Specificity = number of non-wildcard dimensions. More specific = wins. */
export function specificity(scope: ScopeVector): number {
  return SCOPE_DIMENSIONS.filter((d) => scope[d] !== WILDCARD).length;
}

/**
 * Two scopes OVERLAP (context-free) iff there exists at least one context that
 * matches both — i.e. no dimension where both are precise but unequal.
 * Disjoint scopes (e.g. brand A vs brand B) can never conflict: that is the
 * "false conflict / partition" insight (rules 12 vs 13).
 */
export function scopesOverlap(a: ScopeVector, b: ScopeVector): boolean {
  return SCOPE_DIMENSIONS.every((d) => {
    const av = a[d];
    const bv = b[d];
    if (av === WILDCARD || bv === WILDCARD) return true;
    return av.toLowerCase() === bv.toLowerCase();
  });
}

/** True if `a` is a strict scope-specialization of `b` (a refines b). */
export function isSpecializationOf(a: ScopeVector, b: ScopeVector): boolean {
  if (!scopesOverlap(a, b)) return false;
  let strictlyMore = false;
  for (const d of SCOPE_DIMENSIONS) {
    if (b[d] !== WILDCARD && a[d] !== b[d]) return false; // a must respect b's pins
    if (b[d] === WILDCARD && a[d] !== WILDCARD) strictlyMore = true;
  }
  return strictlyMore;
}

export function describeScope(scope: ScopeVector): string {
  const parts = SCOPE_DIMENSIONS.filter((d) => scope[d] !== WILDCARD).map(
    (d) => `${d}=${scope[d]}`,
  );
  return parts.length ? parts.join(' · ') : 'global';
}

export function ruleSpecificity(rule: Rule): number {
  return specificity(rule.scope);
}
