// The precedence engine — DETERMINISTIC. This is where the exercise is won:
// conflict resolution lives here, in code, not in the LLM.
//
//   PARTITION (by subject = the ring)
//     → GATE   (invariants / guardrails are a floor, never suppressed)
//     → RANKING (lexicographic: specificity ↓, then strength ↓)
//
// Reinforcing rules (same directive) coexist; only contradicting ones get
// overridden. Irreducible ties (equal specificity AND strength, contradictory)
// are NOT guessed — they are flagged for a human.

import { contradicts } from './directive';
import { isApplicable, ruleSpecificity } from './scope';
import {
  Decision,
  FlaggedConflict,
  GenerationContext,
  ResolveResult,
  Rule,
  STRENGTH_RANK,
} from './types';

function rank(a: Rule, b: Rule): number {
  const sa = ruleSpecificity(a);
  const sb = ruleSpecificity(b);
  if (sa !== sb) return sb - sa; // more specific first
  return STRENGTH_RANK[b.strength] - STRENGTH_RANK[a.strength]; // stronger first
}

function groupBySubject(rules: Rule[]): Map<string, Rule[]> {
  const m = new Map<string, Rule[]>();
  for (const r of rules) {
    const arr = m.get(r.subject) ?? [];
    arr.push(r);
    m.set(r.subject, arr);
  }
  return m;
}

function reasonFor(winner: Rule, loser: Rule): string {
  const sw = ruleSpecificity(winner);
  const sl = ruleSpecificity(loser);
  if (sw > sl) return `plus spécifique (${sw} vs ${sl} dimensions fixées)`;
  if (STRENGTH_RANK[winner.strength] > STRENGTH_RANK[loser.strength])
    return `spécificité égale → force supérieure (${winner.strength} > ${loser.strength})`;
  return 'invariant (plancher de conformité)';
}

export function resolve(allRules: Rule[], ctx: GenerationContext): ResolveResult {
  const applicable = allRules.filter((r) => isApplicable(r.scope, ctx));
  const rings = groupBySubject(applicable);

  const active: Rule[] = [];
  const decisions: Decision[] = [];
  const flagged: FlaggedConflict[] = [];

  for (const [subject, ring] of rings) {
    // Data-hygiene: never silently apply an unclear rule.
    const unclear = ring.filter((r) => r.dataQuality !== 'complete');
    if (unclear.length) {
      flagged.push({
        subject,
        constraintType: unclear[0].constraintType,
        candidates: unclear,
        reason: 'qualité de donnée insuffisante (needs_clarification / not_provided)',
      });
    }
    const clear = ring.filter((r) => r.dataQuality === 'complete');
    if (clear.length === 0) continue;

    if (clear.length === 1) {
      active.push(clear[0]);
      continue;
    }

    // Is there any contradiction in this ring?
    const anyContradiction = clear.some((a, i) =>
      clear.slice(i + 1).some((b) => contradicts(a, b)),
    );

    if (!anyContradiction) {
      // All compatible → they reinforce; keep them all.
      active.push(...clear);
      if (clear.length > 1) {
        decisions.push({
          winner: [...clear].sort(rank)[0],
          beat: [],
          reason: `${clear.length} règles se renforcent (même direction)`,
          subject,
          constraintType: clear[0].constraintType,
        });
      }
      continue;
    }

    // GATE: invariants form the winner pool if present (floor).
    const invariants = clear.filter((r) => !r.overridable);
    const pool = invariants.length ? invariants : clear;
    const sorted = [...pool].sort(rank);
    const winner = sorted[0];
    const runnerUp = sorted[1];

    // Irreducible tie → flag for human (don't guess).
    if (
      runnerUp &&
      ruleSpecificity(winner) === ruleSpecificity(runnerUp) &&
      STRENGTH_RANK[winner.strength] === STRENGTH_RANK[runnerUp.strength] &&
      contradicts(winner, runnerUp)
    ) {
      flagged.push({
        subject,
        constraintType: winner.constraintType,
        candidates: [winner, runnerUp],
        reason: 'égalité irréductible (spécificité ET force égales, directives opposées)',
      });
      // still surface the contestants but apply none
      continue;
    }

    // Winner active. Suppress contradicting rules; keep compatible (reinforcing) ones.
    active.push(winner);
    const beat: { rule: Rule; why: string }[] = [];
    for (const r of clear) {
      if (r === winner) continue;
      if (contradicts(winner, r)) {
        if (!r.overridable) {
          // an invariant can never be suppressed — keep it too
          active.push(r);
        } else {
          beat.push({ rule: r, why: reasonFor(winner, r) });
        }
      } else {
        active.push(r); // compatible → reinforces
      }
    }
    decisions.push({
      winner,
      beat,
      reason:
        invariants.length && !winner.overridable
          ? 'invariant (plancher de conformité) — non-overridable'
          : `gagne par ${reasonFor(winner, runnerUp ?? winner)}`,
      subject,
      constraintType: winner.constraintType,
    });
  }

  // Deterministic, stable order for display.
  active.sort((a, b) => Number(a.localId) - Number(b.localId));

  return {
    context: ctx,
    active,
    decisions,
    flagged,
    applicableCount: applicable.length,
  };
}
