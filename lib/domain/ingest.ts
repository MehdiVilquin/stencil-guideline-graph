// Ingestion — raw rows (any guideline set) → typed Rule[] → frozen graph.
// Data contract: the column names below. Missing columns degrade to WILDCARD
// (and the row is flagged), so the system is data-driven, not hardcoded.

import { classify } from './classify';
import { buildGraph } from './graph';
import { normalizeScopeValue } from './scope';
import { DataQuality, Rule, RuleGraph, ScopeVector, Strength } from './types';

export type RawRule = Record<string, string>;

const STRENGTHS: Strength[] = ['forbidden', 'hard-rule', 'conditional', 'soft-preference'];

function toStrength(raw: string): Strength {
  const v = (raw ?? '').trim().toLowerCase();
  const found = STRENGTHS.find((s) => s === v);
  return found ?? 'soft-preference';
}

function toDataQuality(raw: string, productCategory: string): DataQuality {
  const v = (raw ?? '').trim().toLowerCase();
  if (v === 'needs_clarification') return 'needs_clarification';
  if ((productCategory ?? '').includes('[NOT PROVIDED]')) return 'not_provided';
  return 'complete';
}

/** Build the typed scope vector from a raw row, normalizing wildcards. */
function toScope(row: RawRule): ScopeVector {
  return {
    brand: normalizeScopeValue(row.brand),
    locale: normalizeScopeValue(row.target_locale),
    contentType: normalizeScopeValue(row.content_typology),
    productCategory: normalizeScopeValue(row.product_category),
    productType: normalizeScopeValue(row.product_type),
    field: normalizeScopeValue(row.product_field),
  };
}

/** Convert one raw row into a typed Rule. */
export function rowToRule(row: RawRule, index: number): Rule {
  const scope = toScope(row);
  const strength = toStrength(row.generation_type);
  const name = row.name ?? '';
  const text = row.guideline_text ?? '';
  const segmentExample = row.segment_example ?? '';

  const cls = classify({
    name,
    text,
    field: scope.field,
    strength,
    segmentExample,
  });

  return {
    localId: String(row.local_id ?? index + 1),
    name,
    text,
    scope,
    strength,
    constraintType: cls.constraintType,
    subject: cls.subject,
    overridable: cls.overridable,
    dataQuality: toDataQuality(row.data_quality, row.product_category ?? ''),
    comment: row.comment ?? '',
    segmentExample,
    guidelineType: row.guideline_type ?? '',
    origin: row.origin ?? '',
    classifierReason: cls.reason,
  };
}

/** Full ingestion: rows → frozen, conflict-aware graph. */
export function ingest(rows: RawRule[]): RuleGraph {
  const rules = rows.map(rowToRule);
  const graph = buildGraph(rules);
  return graph;
}
