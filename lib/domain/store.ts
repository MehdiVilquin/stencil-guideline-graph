// In-memory graph store. The graph is conceptual — implemented over plain
// structures, no Neo4j. Default set is built once and cached; any uploaded set
// goes through the exact same ingest pipeline (proves data-driven).

import { defaultRawRules } from '../data';
import { ingest, RawRule } from './ingest';
import { RuleGraph, SCOPE_DIMENSIONS, ScopeVector, WILDCARD } from './types';

let cached: RuleGraph | null = null;

export function defaultGraph(): RuleGraph {
  if (!cached) cached = ingest(defaultRawRules);
  return cached;
}

export function graphFrom(rows?: RawRule[]): RuleGraph {
  return rows && rows.length ? ingest(rows) : defaultGraph();
}

/** Distinct concrete (non-wildcard) values per scope dimension → context selector. */
export function facets(graph: RuleGraph): Record<keyof ScopeVector, string[]> {
  const out = {} as Record<keyof ScopeVector, string[]>;
  for (const dim of SCOPE_DIMENSIONS) {
    const vals = new Set<string>();
    for (const r of graph.rules) {
      const v = r.scope[dim];
      if (v !== WILDCARD) vals.add(v);
    }
    out[dim] = [...vals].sort();
  }
  return out;
}
