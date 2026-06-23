// Draft-review fix application — the one-click fix must match the SAME word boundaries
// the verifier uses (never corrupt a larger word), preserve case, and treat the
// replacement literally (no `$`-pattern surprises).

import { describe, expect, it } from 'vitest';
import { applyOneFix } from '@/lib/ui/marks';

describe('applyOneFix — word boundaries', () => {
  it('does NOT touch the term inside a larger word', () => {
    // "pro" must not corrupt "professionnel"
    expect(applyOneFix('un service professionnel', 'pro', 'expert')).toBe('un service professionnel');
  });
  it('replaces the standalone word', () => {
    expect(applyOneFix('un pro ici', 'pro', 'expert')).toBe('un expert ici');
  });
  it('replaces every standalone occurrence, including adjacent ones', () => {
    expect(applyOneFix('pro pro', 'pro', 'x')).toBe('x x');
  });
});

describe('applyOneFix — case preservation', () => {
  it('keeps a leading capital', () => {
    expect(applyOneFix('Best price', 'best', 'meilleur')).toBe('Meilleur price');
  });
  it('keeps ALLCAPS', () => {
    expect(applyOneFix('BEST price', 'best', 'meilleur')).toBe('MEILLEUR price');
  });
  it('leaves lowercase as-is', () => {
    expect(applyOneFix('a best deal', 'best', 'meilleur')).toBe('a meilleur deal');
  });
});

describe('applyOneFix — literal replacement', () => {
  it('does not interpret "$" in the replacement as a $-pattern', () => {
    expect(applyOneFix('prix bas', 'bas', '$5')).toBe('prix $5');
  });
});

describe('applyOneFix — removal ("")', () => {
  it('removes the term and collapses the leftover space', () => {
    expect(applyOneFix('un mot truc ici', 'truc', '')).toBe('un mot ici');
  });
  it('removes the term and tidies the space before punctuation', () => {
    expect(applyOneFix('un mot truc.', 'truc', '')).toBe('un mot.');
  });
});
