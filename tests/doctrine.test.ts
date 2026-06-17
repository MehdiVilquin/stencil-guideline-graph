// The doctrine compiler must make the implicit structure explicit and stay
// consistent with the engine (same conflict resolutions).

import { describe, expect, it } from 'vitest';
import { ingest } from '@/lib/domain/ingest';
import { compileDoctrine } from '@/lib/domain/doctrine';
import { defaultRawRules } from '@/lib/data';

const md = compileDoctrine(ingest(defaultRawRules));

describe('doctrine.md compilation', () => {
  it('has the core sections', () => {
    expect(md).toContain('# Doctrine de marque');
    expect(md).toContain('## Invariants');
    expect(md).toContain('## Règles par type de contrainte');
    expect(md).toContain('## Conflits détectés & résolution');
    expect(md).toContain('## À clarifier');
  });

  it('lists the medical-claims invariant', () => {
    expect(md).toMatch(/#14.*invariant/);
  });

  it('makes the title-length conflict resolution explicit (28 over 27)', () => {
    expect(md).toContain('Sujet « length:title »');
    expect(md).toMatch(/#28.*l’emporte sur #27/);
  });

  it('makes the anti-aging conflict explicit (4 over 3 by strength)', () => {
    expect(md).toMatch(/#4.*l’emporte sur #3.*force/);
  });

  it('surfaces the data-hygiene rows to clarify', () => {
    for (const id of ['8', '15', '33', '42']) expect(md).toContain(`#${id}`);
  });
});
