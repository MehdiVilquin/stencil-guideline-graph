// Graph construction — turn the flat rule list into a typed, conflict-aware
// graph ONCE at ingest (frozen, auditable). Edges are the product: they make
// the relationships between rules first-class.

import { contradicts } from './directive';
import { isSpecializationOf, scopesOverlap, ruleSpecificity } from './scope';
import { Edge, Rule, RuleGraph } from './types';

export function buildGraph(rules: Rule[]): RuleGraph {
  const edges: Edge[] = [];

  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      const a = rules[i];
      const b = rules[j];
      if (a.subject !== b.subject) continue; // only same-ring rules interact
      if (!scopesOverlap(a.scope, b.scope)) continue; // disjoint scopes never conflict

      const conflict = contradicts(a, b);
      if (conflict) {
        // Directed override if one is a strict scope-specialization, else symmetric conflict.
        if (isSpecializationOf(a.scope, b.scope)) {
          edges.push(edge('overrides', a, b, `scope plus spécifique → ${a.localId} prime sur ${b.localId}`));
        } else if (isSpecializationOf(b.scope, a.scope)) {
          edges.push(edge('overrides', b, a, `scope plus spécifique → ${b.localId} prime sur ${a.localId}`));
        } else {
          // same level: stronger overrides, but record the conflict link
          edges.push(edge('conflicts-with', a, b, 'même niveau de scope, directives opposées'));
        }
      } else {
        // same subject, compatible direction → they reinforce
        edges.push(edge('reinforces', a, b, 'même direction, sur le même sujet'));
      }
    }
  }

  // justified-by: a rule that cites a compliance concept owned by an invariant.
  const invariants = rules.filter((r) => !r.overridable);
  for (const r of rules) {
    if (!r.overridable) continue;
    if (/medical|therapeutic|claim/i.test(r.text)) {
      for (const inv of invariants) {
        if (inv.localId !== r.localId)
          edges.push(edge('justified-by', r, inv, 'justifiée par un invariant de conformité'));
      }
    }
  }

  const flaggedAtIngest = rules.filter((r) => r.dataQuality !== 'complete');
  return { rules, edges, flaggedAtIngest };
}

function edge(type: Edge['type'], from: Rule, to: Rule, reason: string): Edge {
  return { type, from: from.localId, to: to.localId, reason };
}

export { ruleSpecificity };
