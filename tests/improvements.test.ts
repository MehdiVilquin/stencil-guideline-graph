// Tests for the A/B/C/D quality improvements:
//   A — franglais detection (verifyForeignTerms)
//   C — sentence-boundary truncation (truncateToBounds)

import { describe, expect, it } from 'vitest';
import { ingest, type RawRule } from '@/lib/domain/ingest';
import { verifyForeignTerms } from '@/lib/domain/verifiers';
import { truncateToBounds } from '@/lib/domain/generate';

// Minimal Northbound-style rules: a forbidden term with an English replacement,
// and a required canonical hero descriptor that must be kept verbatim.
const ROWS: RawRule[] = [
  {
    local_id: '3',
    brand: 'Northbound',
    target_locale: 'global',
    product_category: 'Apparel',
    name: 'Forbidden term: waterproof',
    guideline_text: 'Never use "waterproof" — it overstates protection. Use "water-resistant" instead.',
    generation_type: 'forbidden',
  },
  {
    local_id: '30',
    brand: 'Northbound',
    target_locale: 'global',
    name: 'Hero descriptor: trail-ready',
    guideline_text: 'Use "trail-ready" as a hero descriptor for the core line.',
    generation_type: 'hard-rule',
  },
  {
    local_id: '21',
    brand: 'Northbound',
    target_locale: 'global',
    product_field: 'seo_meta',
    name: 'SEO meta length',
    guideline_text: 'SEO meta descriptions: maximum 155 characters.',
    generation_type: 'hard-rule',
  },
];

const rules = ingest(ROWS).rules;

describe('A — verifyForeignTerms (franglais)', () => {
  it('flags an English replacement term left verbatim in French copy', () => {
    const verdict = verifyForeignTerms('Une veste water-resistant pour le sentier.', rules, 'Northbound');
    expect(verdict.pass).toBe(false);
    expect(verdict.evidence).toContain('water-resistant');
  });

  it('does NOT flag the required canonical form (trail-ready) or the brand', () => {
    const verdict = verifyForeignTerms('La veste Northbound trail-ready, résistante à l’eau.', rules, 'Northbound');
    expect(verdict.pass).toBe(true);
  });

  it('flags common English marker words', () => {
    expect(verifyForeignTerms('Une veste for the trail.', rules, 'Northbound').pass).toBe(false);
  });
});

describe('C — truncateToBounds (sentence boundary)', () => {
  it('cuts at the last complete sentence under the bound (no dangling word)', () => {
    const long =
      'Veste coupe-vent résistante à l’eau, idéale pour la randonnée. ' +
      'Elle protège du vent et de la pluie tout au long de votre sortie en montagne dès le matin.';
    const out = truncateToBounds(long, rules);
    expect(out.length).toBeLessThanOrEqual(155);
    expect(/[.!?]$/.test(out)).toBe(true); // ends on a complete sentence
  });

  it('leaves copy under the bound untouched', () => {
    const short = 'Courte description.';
    expect(truncateToBounds(short, rules)).toBe(short);
  });
});
