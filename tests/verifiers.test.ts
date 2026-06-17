// Verifier golden tests — the deterministic proof checkers must catch real
// violations and clear compliant copy.

import { describe, expect, it } from 'vitest';
import { ingest } from '@/lib/domain/ingest';
import { verify } from '@/lib/domain/verifiers';
import { defaultRawRules } from '@/lib/data';

const graph = ingest(defaultRawRules);
const rule = (id: string) => graph.rules.find((r) => r.localId === id)!;

describe('lexical-forbidden (rule 4: anti-aging)', () => {
  it('fails when the forbidden term appears', () => {
    expect(verify('An anti-aging serum for radiance', rule('4')).pass).toBe(false);
  });
  it('passes when the prescribed replacement is used', () => {
    expect(verify('An age-defying serum for radiance', rule('4')).pass).toBe(true);
  });
});

describe('length-bound (rule 27: title ≤ 60)', () => {
  it('fails over the bound', () => {
    expect(verify('x'.repeat(61), rule('27')).pass).toBe(false);
  });
  it('passes under the bound', () => {
    expect(verify('A radiance ritual', rule('27')).pass).toBe(true);
  });
});

describe('format-pattern (rule 12: no exclamation)', () => {
  it('fails with an exclamation mark', () => {
    expect(verify('Your glow starts now!', rule('12')).pass).toBe(false);
  });
  it('passes without', () => {
    expect(verify('Your glow starts now', rule('12')).pass).toBe(true);
  });
});

describe('format-pattern (rule 19: fr currency after amount)', () => {
  it('passes "50 €"', () => {
    expect(verify('Disponible à 50 €.', rule('19')).pass).toBe(true);
  });
  it('fails "€50"', () => {
    expect(verify('Disponible à €50.', rule('19')).pass).toBe(false);
  });
});

describe('lexical-required (rule 2: keep flagship name in French)', () => {
  it('passes when the required form is present (not flagged as a forbidden variant)', () => {
    // regression: "Never translate X; keep in French" → X is REQUIRED, must not fail
    expect(verify('“Sérum Éclat Absolu®” für strahlende Haut', rule('2')).pass).toBe(true);
  });
});

describe('lexical-required (rule 1: house name spelling)', () => {
  it('fails when the wrong (unaccented) variant appears', () => {
    expect(verify('Bienvenue chez Maison Lumiere', rule('1')).pass).toBe(false);
  });
  it('passes with the correct accented form', () => {
    expect(verify('Bienvenue chez Maison Lumière', rule('1')).pass).toBe(true);
  });
});

describe('honest boundary', () => {
  it('register-tone is reported as not verifiable', () => {
    const v = verify('Entdecken Sie Ihr Ritual.', rule('35'));
    expect(v.verifiable).toBe(false);
  });
});
