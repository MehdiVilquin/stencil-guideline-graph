import { describe, expect, it } from 'vitest';
import { sanitizeCopy } from '@/lib/llm';

describe('sanitizeCopy', () => {
  it('strips wrapping triple/double/single quote runs', () => {
    expect(sanitizeCopy('"""""""Bonjour"""""""')).toBe('Bonjour');
    expect(sanitizeCopy('"Bonjour le monde"')).toBe('Bonjour le monde');
    expect(sanitizeCopy("'''Bonjour'''")).toBe('Bonjour');
    expect(sanitizeCopy('“Bonjour”')).toBe('Bonjour');
  });

  it('strips a wrapping markdown code fence', () => {
    expect(sanitizeCopy('```\nBonjour\n```')).toBe('Bonjour');
    expect(sanitizeCopy('```text\nBonjour le monde\n```')).toBe('Bonjour le monde');
  });

  it('drops a leading preamble line ending with a colon', () => {
    expect(sanitizeCopy('Voici la copie :\nBonjour')).toBe('Bonjour');
    expect(sanitizeCopy('Here is the copy:\nHello')).toBe('Hello');
  });

  it('preserves internal guillemets, apostrophes and punctuation', () => {
    expect(sanitizeCopy('Un sérum « éclat » à l’acide hyaluronique')).toBe(
      'Un sérum « éclat » à l’acide hyaluronique',
    );
  });

  it('leaves already-clean text unchanged', () => {
    expect(sanitizeCopy('Sérum éclat pour une peau visiblement plus lumineuse')).toBe(
      'Sérum éclat pour une peau visiblement plus lumineuse',
    );
  });

  it('does not strip a copy legitimately wrapped in French guillemets', () => {
    expect(sanitizeCopy('« Révélez votre éclat »')).toBe('« Révélez votre éclat »');
  });
});
