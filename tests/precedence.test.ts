// Golden tests — "provably" applied to OUR OWN engine.
// Each case is a planted conflict from the sample; the engine must resolve it
// the way the precedence theory predicts.

import { describe, expect, it } from 'vitest';
import { ingest } from '@/lib/domain/ingest';
import { resolve } from '@/lib/domain/precedence';
import { defaultRawRules } from '@/lib/data';
import { GenerationContext, Rule } from '@/lib/domain/types';

const graph = ingest(defaultRawRules);
const ids = (rules: Rule[]) => rules.map((r) => r.localId);

function ctx(p: Partial<GenerationContext>): GenerationContext {
  return {
    brand: 'Lumière Paris',
    locale: 'en-GB',
    contentType: 'Product Description',
    productCategory: 'Skincare',
    productType: 'SINGLE',
    field: 'long_description',
    ...p,
  };
}

describe('ingestion', () => {
  it('parses all 47 rules', () => {
    expect(graph.rules).toHaveLength(47);
  });
  it('flags the data-hygiene rows at ingest', () => {
    expect(ids(graph.flaggedAtIngest).sort()).toEqual(['15', '33', '42', '8'].sort());
  });
});

describe('precedence — planted conflicts', () => {
  it('3 vs 4 (Skincare): forbidden wins by strength at equal specificity', () => {
    const r = resolve(graph.rules, ctx({ productCategory: 'Skincare' }));
    expect(ids(r.active)).toContain('4'); // age-defying / forbid anti-aging
    expect(ids(r.active)).not.toContain('3');
  });

  it('27 vs 28 (de-DE title): more-specific locale wins though weaker', () => {
    const r = resolve(graph.rules, ctx({ locale: 'de-DE', field: 'title' }));
    expect(ids(r.active)).toContain('28'); // ≤ 80
    expect(ids(r.active)).not.toContain('27');
  });

  it('27 alone (non-DE title): the ≤60 field rule applies', () => {
    const r = resolve(graph.rules, ctx({ locale: 'en-GB', field: 'title' }));
    expect(ids(r.active)).toContain('27');
    expect(ids(r.active)).not.toContain('28');
  });

  it('18 vs 19 (fr-FR currency): locale specialization wins', () => {
    const r = resolve(graph.rules, ctx({ locale: 'fr-FR' }));
    expect(ids(r.active)).toContain('19');
    expect(ids(r.active)).not.toContain('18');
  });

  it('12 vs 13 (exclamation): brand partition, not a real conflict', () => {
    const lp = resolve(graph.rules, ctx({ brand: 'Lumière Paris' }));
    expect(ids(lp.active)).toContain('12');
    expect(ids(lp.active)).not.toContain('13');
    const al = resolve(graph.rules, ctx({ brand: "L'Atelier Lumière" }));
    expect(ids(al.active)).toContain('13');
    expect(ids(al.active)).not.toContain('12');
  });

  it('11 vs 35 (de-DE address): locale + strength both favour formal Sie', () => {
    const r = resolve(graph.rules, ctx({ locale: 'de-DE' }));
    expect(ids(r.active)).toContain('35');
    expect(ids(r.active)).not.toContain('11');
  });

  it('rule 14 (medical claims) is an invariant floor — always active', () => {
    const r = resolve(graph.rules, ctx({}));
    const r14 = graph.rules.find((x) => x.localId === '14')!;
    expect(r14.overridable).toBe(false);
    expect(ids(r.active)).toContain('14');
  });
});

describe('data hygiene — flagged, never silently applied', () => {
  it('rule 15 (luxury-feel, needs_clarification) is flagged, not active', () => {
    const r = resolve(graph.rules, ctx({}));
    expect(ids(r.active)).not.toContain('15');
    expect(r.flagged.some((f) => f.candidates.some((c) => c.localId === '15'))).toBe(true);
  });
});
