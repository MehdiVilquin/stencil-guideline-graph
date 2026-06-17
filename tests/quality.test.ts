import { describe, expect, it } from 'vitest';
import { ingest } from '@/lib/domain/ingest';
import { defaultRawRules } from '@/lib/data';
import { verify, verifyLanguage } from '@/lib/domain/verifiers';
import { mechanicalFix } from '@/lib/domain/generate';

const graph = ingest(defaultRawRules);
const rule = (id: string) => graph.rules.find((r) => r.localId === id)!;

describe('medical-claims invariant — multilingual', () => {
  const medical = rule('14'); // No medical claims (overridable:false floor)

  it('catches French claims the English-only list missed', () => {
    expect(verify('Ce sérum guérit les rides en sept jours.', medical).pass).toBe(false);
    expect(verify('Une formule cliniquement prouvée contre les rides.', medical).pass).toBe(false);
  });

  it('catches German / Italian claims', () => {
    expect(verify('Dieses Serum heilt die Haut.', medical).pass).toBe(false);
    expect(verify('Un trattamento clinicamente provato.', medical).pass).toBe(false);
  });

  it('still catches English claims', () => {
    expect(verify('This serum cures wrinkles.', medical).pass).toBe(false);
  });

  it('does not flag legitimate luxury copy', () => {
    expect(verify('Un soin éclat à l’acide hyaluronique pour une peau lumineuse.', medical).pass).toBe(true);
    expect(verify('Ce sérum cliniquement testé sublime votre peau.', medical).pass).toBe(true);
  });
});

describe('language adherence', () => {
  it('passes when the copy matches the locale', () => {
    expect(verifyLanguage('Unser Serum ist die perfekte Ergänzung für Sie und Ihre Haut.', 'de-DE').pass).toBe(true);
    expect(verifyLanguage('Un sérum de luxe pour votre peau, avec de l’acide hyaluronique.', 'fr-FR').pass).toBe(true);
    expect(verifyLanguage('輝く肌のための美容液です。', 'ja-JP').pass).toBe(true);
  });

  it('fails when the copy is in the wrong language', () => {
    // French copy for a German context (the id10 failure mode)
    expect(verifyLanguage('Un sérum de luxe pour votre peau, avec de la vitamine C.', 'de-DE').pass).toBe(false);
    // Latin copy for a Japanese context (the id13 failure mode)
    expect(verifyLanguage('Une bougie artisanale au parfum envoutant.', 'ja-JP').pass).toBe(false);
  });

  it('stays conservative on short, stopword-free copy', () => {
    expect(verifyLanguage('Sérum Éclat Absolu acide hyaluronique', 'fr-FR').pass).toBe(true);
  });
});

describe('mechanicalFix — exclamation', () => {
  const forbid = rule('12'); // No exclamation marks
  const allowOne = rule('13'); // L'Atelier may use a single exclamation mark

  it('strips all exclamation marks when forbidden', () => {
    expect(mechanicalFix('Un éclat absolu !', [forbid])).toBe('Un éclat absolu');
    expect(mechanicalFix('Génial!!! Vraiment!', [forbid])).toBe('Génial Vraiment');
  });

  it('caps at one when allowed', () => {
    expect(mechanicalFix('Wow! Super!', [allowOne])).toBe('Wow! Super');
  });

  it('leaves copy untouched when no exclamation rule is active', () => {
    expect(mechanicalFix('Texte normal.', [])).toBe('Texte normal.');
  });
});

describe('mechanicalFix — bullet over-count', () => {
  const bullets = rule('30'); // Bullet lists contain 3 to 5 items

  it('caps an over-long list to the max', () => {
    const six = '• a\n• b\n• c\n• d\n• e\n• f';
    expect(mechanicalFix(six, [bullets])).toBe('• a\n• b\n• c\n• d\n• e');
  });

  it('leaves an under-count list untouched (cannot fabricate items)', () => {
    expect(mechanicalFix('• a\n• b', [bullets])).toBe('• a\n• b');
  });

  it('does nothing without a bullet rule active', () => {
    const six = '• a\n• b\n• c\n• d\n• e\n• f';
    expect(mechanicalFix(six, [])).toBe(six);
  });
});
