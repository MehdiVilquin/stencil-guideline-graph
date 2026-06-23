// Verifier golden tests — the deterministic proof checkers must catch real
// violations and clear compliant copy.

import { describe, expect, it } from 'vitest';
import { ingest } from '@/lib/domain/ingest';
import { verify } from '@/lib/domain/verifiers';
import { mechanicalFix } from '@/lib/domain/generate';
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

describe('format-pattern (rule 37: fr date DD/MM/YYYY)', () => {
  it('proves day-first when the 1st field can only be a day (31/05/2024)', () => {
    const v = verify('Disponible dès le 31/05/2024.', rule('37'));
    expect(v.verifiable).toBe(true);
    expect(v.pass).toBe(true);
  });
  it('proves a violation when the 2nd field can only be a day (05/31/2024)', () => {
    const v = verify('Available from 05/31/2024.', rule('37'));
    expect(v.verifiable).toBe(true);
    expect(v.pass).toBe(false);
  });
  it('stays judged (not verifiable) when the date is genuinely ambiguous (03/04/2024)', () => {
    const v = verify('Disponible le 03/04/2024.', rule('37'));
    expect(v.verifiable).toBe(false);
  });
});

describe('inline marks (spell-checker highlights)', () => {
  it('lexical-forbidden emits the offending term + a prescribed fix', () => {
    const r = verify('An anti-aging serum for radiance', rule('4'));
    expect(r.pass).toBe(false);
    expect(r.marks).toContain('anti-aging');
    expect(typeof r.fix).toBe('string');
    expect(r.fix).not.toBe('');
  });
  it('exclamation emits "!" as a mark with an empty (remove) fix', () => {
    const r = verify('Your glow starts now!', rule('12'));
    expect(r.pass).toBe(false);
    expect(r.marks).toContain('!');
    expect(r.fix).toBe('');
  });
  it('a clean copy carries no marks', () => {
    expect(verify('A radiance ritual', rule('27')).marks).toBeUndefined();
  });
});

describe('bullet rule #30 (count + no terminal period)', () => {
  it('fails when the draft is a single paragraph (too few items)', () => {
    const r = verify('Offre-toi un rituel précieux signé Maison Lumière. Il contient le sérum.', rule('30'));
    expect(r.verifiable).toBe(true);
    expect(r.pass).toBe(false);
  });
  it('fails when a bullet ends with a terminal period', () => {
    expect(verify('- un\n- deux.\n- trois', rule('30')).pass).toBe(false);
  });
  it('passes a clean 3-item list with no terminal period', () => {
    expect(verify('- un\n- deux\n- trois', rule('30')).pass).toBe(true);
  });
});

describe('currency comma-decimal (rule 19)', () => {
  it('fails a dot decimal even when placement is right', () => {
    expect(verify('Disponible à 99.00 €.', rule('19')).pass).toBe(false);
  });
  it('passes a comma decimal after the amount', () => {
    expect(verify('Disponible à 99,00 €.', rule('19')).pass).toBe(true);
  });
});

describe('mechanicalFix — deterministic formatting', () => {
  it('normalizes bullets to "- " with no terminal period', () => {
    const out = mechanicalFix('Découvre le rituel.\nIl contient le sérum.\nUne expérience.', [rule('30')]);
    expect(out).toBe('- Découvre le rituel\n- Il contient le sérum\n- Une expérience');
  });
  it('normalizes currency to comma decimal + non-breaking space', () => {
    expect(mechanicalFix('seulement 99.00€ aujourd’hui', [rule('19')])).toContain('99,00 €');
  });
});

describe('honest boundary', () => {
  it('register-tone is reported as not verifiable', () => {
    const v = verify('Entdecken Sie Ihr Ritual.', rule('35'));
    expect(v.verifiable).toBe(false);
  });
});
