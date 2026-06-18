// Guard for the /pitch deck's real-data wiring. The deck renders the LIVE
// resolved Maison Lumière graph + a LIVE deterministic proof, so a change to
// the sample or the demo context that yields an empty/degenerate result would
// silently break the demo. This asserts the wiring stays non-trivial.

import { describe, expect, it } from "vitest";
import { ingest } from "@/lib/domain/ingest";
import { resolve } from "@/lib/domain/precedence";
import { verifyAll, verifyLanguage, verifyForeignTerms, franglaisApplies } from "@/lib/domain/verifiers";
import { defaultRawRules } from "@/lib/data";
import type { GenerationContext } from "@/lib/domain/types";

const DEMO_CTX: GenerationContext = {
  brand: "Lumière Paris",
  locale: "de-DE",
  contentType: "Product Description",
  productCategory: "Skincare",
  productType: "SINGLE",
  field: "title",
};
const DEMO_COPY = "Anti-Aging Sérum: für nur €50, sichtbar jüngere Haut!";

describe("pitch demo wiring", () => {
  const graph = ingest(defaultRawRules);
  const resolved = resolve(graph.rules, DEMO_CTX);

  it("resolves a non-trivial active set from the full corpus", () => {
    expect(graph.rules.length).toBeGreaterThan(20);
    expect(resolved.active.length).toBeGreaterThan(0);
    // the whole point: the engine narrows the corpus.
    expect(resolved.applicableCount).toBeGreaterThan(resolved.active.length);
  });

  it("exposes at least one resolved ring (the glass-box trace)", () => {
    expect(resolved.decisions.length).toBeGreaterThan(0);
    const withBeat = resolved.decisions.filter((d) => d.beat.length > 0);
    // a real conflict (winner vs beaten) may or may not exist for this context;
    // the deck degrades gracefully either way, but we log what we have.
    if (withBeat.length) {
      const d = withBeat[0];
      expect(d.winner.localId).toBeTruthy();
      expect(d.beat[0].rule.localId).not.toBe(d.winner.localId);
    }
  });

  it("produces a real deterministic proof on the demo copy", () => {
    const report = [
      ...verifyAll(DEMO_COPY, resolved.active),
      verifyLanguage(DEMO_COPY, DEMO_CTX.locale),
    ];
    if (franglaisApplies(DEMO_CTX.locale)) {
      report.push(verifyForeignTerms(DEMO_COPY, resolved.active, DEMO_CTX.brand));
    }
    expect(report.length).toBeGreaterThan(0);
    // every verdict is traceable to a rule
    for (const v of report) expect(v.localId).toBeTruthy();
  });
});
