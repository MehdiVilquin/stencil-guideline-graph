// ─────────────────────────────────────────────────────────────────────────────
// Domain types — the typed graph the whole tool reasons over.
// Thèse : la résolution de conflit est DÉTERMINISTE, sur un graphe typé.
// Le LLM ne décide jamais quelle règle gagne ni si une règle est respectée.
// ─────────────────────────────────────────────────────────────────────────────

/** Wildcard sentinel: a scope dimension that matches any context value. */
export const WILDCARD = '*' as const;

/** How strongly a rule is stated. Drives the tie-break in precedence. */
export type Strength = 'forbidden' | 'hard-rule' | 'conditional' | 'soft-preference';

/** Strength → rank (higher wins) used only when scope-specificity ties. */
export const STRENGTH_RANK: Record<Strength, number> = {
  forbidden: 4,
  'hard-rule': 3,
  conditional: 2,
  'soft-preference': 1,
};

/**
 * The constraint type = the OUTPUT CHANNEL a rule governs.
 * It is NOT a precedence axis — it defines the "ring" (who competes with whom)
 * and hands us, for free, the deterministic verifier for that channel.
 */
export type ConstraintType =
  | 'lexical-forbidden' // a term/word must NOT appear
  | 'lexical-required' // a specific spelling/term MUST appear
  | 'format-pattern' // currency / quotes / date / units / punctuation / case
  | 'length-bound' // character or item count bounds on a field
  | 'structure' // required sections / ordering / presence
  | 'register-tone'; // voice / address / register — NOT mechanically provable

/** The six scope dimensions. Each is a precise value or WILDCARD. */
export interface ScopeVector {
  brand: string;
  locale: string;
  contentType: string;
  productCategory: string;
  productType: string;
  field: string;
}

export const SCOPE_DIMENSIONS: (keyof ScopeVector)[] = [
  'brand',
  'locale',
  'contentType',
  'productCategory',
  'productType',
  'field',
];

export type DataQuality = 'complete' | 'needs_clarification' | 'not_provided';

/** A rule = a node in the graph. */
export interface Rule {
  localId: string;
  name: string;
  text: string;
  scope: ScopeVector;
  strength: Strength;
  constraintType: ConstraintType;
  subject: string; // grouping key (the "ring")
  overridable: boolean; // false = invariant / guardrail (legal · medical · safety) → floor
  dataQuality: DataQuality;
  comment: string;
  segmentExample: string;
  guidelineType: string; // raw TERM/BRAND/TYPO/STRUCT/LOCAL (kept for display)
  origin: string;
  /** how the classifier decided constraintType — shown in the glass-box */
  classifierReason: string;
}

export type EdgeType = 'overrides' | 'conflicts-with' | 'reinforces' | 'justified-by';

export interface Edge {
  type: EdgeType;
  from: string; // localId
  to: string; // localId
  reason: string;
}

/** The full ingested graph — built ONCE, frozen, auditable. */
export interface RuleGraph {
  rules: Rule[];
  edges: Edge[];
  /** rules whose data quality blocks safe application — surfaced, never silently applied */
  flaggedAtIngest: Rule[];
}

/** A generation context = a point at the bottom of the scope lattice. */
export interface GenerationContext {
  brand: string;
  locale: string;
  contentType: string;
  productCategory: string;
  productType: string;
  field: string;
}

/** Why a rule won (or was excluded) — the decision trace. */
export interface Decision {
  winner: Rule;
  beat: { rule: Rule; why: string }[]; // rules this one overrode, with reason
  reason: string; // human-readable: specificity / strength / invariant-floor
  subject: string;
  constraintType: ConstraintType;
}

/** An irreducible conflict the engine refuses to resolve on its own. */
export interface FlaggedConflict {
  subject: string;
  constraintType: ConstraintType;
  candidates: Rule[];
  reason: string;
}

export interface ResolveResult {
  context: GenerationContext;
  active: Rule[]; // the exact applicable, conflict-resolved rule set
  decisions: Decision[]; // one per contested ring (the audit trail)
  flagged: FlaggedConflict[]; // flag_for_human (irreducible tie OR data hygiene)
  applicableCount: number; // how many rules were in scope before resolution
}

/** One line of the deterministic proof report. */
export interface Verdict {
  localId: string;
  ruleName: string;
  constraintType: ConstraintType;
  pass: boolean;
  verifiable: boolean; // false → judged, not proven (register/tone)
  evidence: string;
}

/** One iteration of the generate→verify→repair loop (for the glass-box trace). */
export interface AttemptRecord {
  attempt: number;
  failing: { localId: string; ruleName: string; evidence: string }[];
}

export interface GenerationResult {
  context: GenerationContext;
  copy: string;
  report: Verdict[];
  attempts: number;
  allProvableGreen: boolean;
  /** per-attempt failing rules — only the LLM paths fill this (verifyDraft does not). */
  history?: AttemptRecord[];
}
