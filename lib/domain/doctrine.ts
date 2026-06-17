// Doctrine compiler — turns the typed graph into an explicit, human-readable
// "law": the design.md of brand language. Deterministic (no LLM): the AI/heuristics
// already classified at ingest; this just makes the implicit structure legible and
// exportable, so a human can review/ratify it. Reuses the graph's edges so the
// conflict section is consistent with the engine.
//
// `buildDoctrineModel` selects + groups the data once; both the markdown export
// (`compileDoctrine`) and the in-app HTML view (DoctrineDoc) render from it, so
// the two representations can never drift.

import { describeScope } from './scope';
import { ConstraintType, Rule, RuleGraph, STRENGTH_RANK } from './types';

const CT_LABEL: Record<ConstraintType, string> = {
  'lexical-forbidden': 'Termes interdits',
  'lexical-required': 'Termes / formes imposés',
  'format-pattern': 'Format & ponctuation',
  'length-bound': 'Longueur',
  structure: 'Structure',
  'register-tone': 'Registre & ton',
};

const TYPE_ORDER: ConstraintType[] = [
  'lexical-forbidden',
  'lexical-required',
  'format-pattern',
  'length-bound',
  'structure',
  'register-tone',
];

/** Human label for a constraint-type section heading. */
export function constraintTypeLabel(ct: ConstraintType): string {
  return CT_LABEL[ct];
}

/* ─────────────────────────── structured model ─────────────────────────── */

export interface DoctrineRuleEntry {
  rule: Rule;
  justifiedBy: string[]; // localIds this rule is justified by
  reinforces: string[]; // localIds this rule reinforces
}

export interface DoctrineGroup {
  constraintType: ConstraintType;
  rules: DoctrineRuleEntry[];
}

export interface DoctrineConflictItem {
  winner: Rule;
  loser: Rule;
  kind: 'overrides' | 'conflicts-with';
}

export interface DoctrineConflictGroup {
  subject: string;
  items: DoctrineConflictItem[];
}

export interface DoctrineModel {
  meta: { ruleCount: number; edgeCount: number; flaggedCount: number; brands: string[] };
  invariants: Rule[];
  groups: DoctrineGroup[];
  conflicts: DoctrineConflictGroup[];
  flagged: Rule[];
}

/** Select + group the graph into the doctrine's logical sections (no formatting). */
export function buildDoctrineModel(graph: RuleGraph): DoctrineModel {
  const { rules, edges, flaggedAtIngest } = graph;
  const byId = new Map(rules.map((r) => [r.localId, r]));
  const brands = [...new Set(rules.map((r) => r.scope.brand).filter((b) => b !== '*'))];

  const invariants = rules.filter((r) => !r.overridable);

  const groups: DoctrineGroup[] = [];
  for (const ct of TYPE_ORDER) {
    const rs = rules.filter(
      (r) => r.constraintType === ct && r.dataQuality === 'complete' && r.overridable,
    );
    if (!rs.length) continue;
    groups.push({
      constraintType: ct,
      rules: rs.map((r) => ({
        rule: r,
        justifiedBy: edges.filter((e) => e.type === 'justified-by' && e.from === r.localId).map((e) => e.to),
        reinforces: edges.filter((e) => e.type === 'reinforces' && e.from === r.localId).map((e) => e.to),
      })),
    });
  }

  // Conflicts derived from edges → consistent with the engine. Grouped under the
  // *from* rule's subject, deduped by winner+loser+kind.
  const conflictEdges = edges.filter((e) => e.type === 'overrides' || e.type === 'conflicts-with');
  const bySubject = new Map<string, { items: DoctrineConflictItem[]; seen: Set<string> }>();
  for (const e of conflictEdges) {
    const a = byId.get(e.from);
    const b = byId.get(e.to);
    if (!a || !b) continue;
    let winner: Rule;
    let loser: Rule;
    if (e.type === 'overrides') {
      winner = a;
      loser = b;
    } else {
      winner = STRENGTH_RANK[a.strength] >= STRENGTH_RANK[b.strength] ? a : b;
      loser = winner === a ? b : a;
    }
    const entry = bySubject.get(a.subject) ?? { items: [], seen: new Set<string>() };
    const key = `${winner.localId}|${loser.localId}|${e.type}`;
    if (!entry.seen.has(key)) {
      entry.seen.add(key);
      entry.items.push({ winner, loser, kind: e.type as DoctrineConflictItem["kind"] });
    }
    bySubject.set(a.subject, entry);
  }
  const conflicts: DoctrineConflictGroup[] = [...bySubject.entries()].map(([subject, v]) => ({
    subject,
    items: v.items,
  }));

  return {
    meta: {
      ruleCount: rules.length,
      edgeCount: edges.length,
      flaggedCount: flaggedAtIngest.length,
      brands,
    },
    invariants,
    groups,
    conflicts,
    flagged: flaggedAtIngest,
  };
}

/* ─────────────────────────── markdown formatting ─────────────────────────── */

function ruleLine(r: Rule): string {
  const inv = r.overridable ? '' : ' · **invariant**';
  return `- **#${r.localId}** ${r.name} — \`[${r.constraintType} · ${r.subject}]\` · ${r.strength} · scope: ${describeScope(
    r.scope,
  )}${inv}\n  > ${r.text}`;
}

function conflictLine(it: DoctrineConflictItem): string {
  if (it.kind === 'overrides') {
    return `**#${it.winner.localId}** l’emporte sur #${it.loser.localId} — plus spécifique (${describeScope(
      it.winner.scope,
    )}) ; hors de ce scope, #${it.loser.localId} s’applique.`;
  }
  return `**#${it.winner.localId}** l’emporte sur #${it.loser.localId} — même niveau de scope, force supérieure (${it.winner.strength} > ${it.loser.strength}).`;
}

/** Compile the whole graph into a structured doctrine markdown document. */
export function compileDoctrine(graph: RuleGraph): string {
  const { meta, invariants, groups, conflicts, flagged } = buildDoctrineModel(graph);

  const L: string[] = [];
  const push = (s = '') => L.push(s);

  push('# Doctrine de marque');
  push();
  push('> Compilation déterministe du graphe typé — la « loi » explicite, éditable, applicable.');
  push(
    `> ${meta.ruleCount} règles · ${meta.edgeCount} relations · ${meta.flaggedCount} à clarifier · marques : ${
      meta.brands.join(', ') || '—'
    }`,
  );
  push();

  // 1) Invariants
  if (invariants.length) {
    push('## Invariants — garde-fous non négociables');
    push('*Plancher de conformité, hors de la cascade de précédence (légal / médical / sécurité).*');
    push();
    invariants.forEach((r) => push(ruleLine(r)));
    push();
  }

  // 2) Rules by constraint type
  push('## Règles par type de contrainte');
  push();
  for (const g of groups) {
    push(
      `### ${CT_LABEL[g.constraintType]}${
        g.constraintType === 'register-tone' ? ' — *jugé, non prouvable mécaniquement*' : ''
      }`,
    );
    push();
    for (const { rule, justifiedBy, reinforces } of g.rules) {
      push(ruleLine(rule));
      if (justifiedBy.length) push(`  - justifiée par ${justifiedBy.map((id) => `#${id}`).join(', ')}`);
      if (reinforces.length) push(`  - renforce ${reinforces.map((id) => `#${id}`).join(', ')}`);
    }
    push();
  }

  // 3) Conflicts & resolution
  if (conflicts.length) {
    push('## Conflits détectés & résolution');
    push(
      '*Comment la précédence tranche, par sujet. Les relations ne sont créées qu’entre scopes qui se chevauchent → une partition par marque n’est pas un conflit.*',
    );
    push();
    for (const { subject, items } of conflicts) {
      push(`### Sujet « ${subject} »`);
      items.forEach((it) => push(`- ${conflictLine(it)}`));
      push();
    }
  }

  // 4) To clarify
  if (flagged.length) {
    push('## À clarifier — hygiène de donnée');
    push('*Signalées à l’ingestion, jamais appliquées en silence.*');
    push();
    for (const r of flagged) {
      push(`- **#${r.localId}** ${r.name} — ${r.dataQuality}${r.comment ? ` : ${r.comment}` : ''}`);
    }
    push();
  }

  return L.join('\n').trim() + '\n';
}
