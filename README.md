# Stencil — Guideline graph

> A brand gives us hundreds of content guidelines. Dump them all into the prompt and the
> agent drowns: it ignores rules, can't tell which one wins when two conflict, and can't
> justify a single choice. Stencil fixes that.

**The thesis, in one line:** take conflict resolution **out of the LLM** (probabilistic — it
makes a soup) and put it into a **deterministic precedence function over a typed rule graph**.
The LLM is demoted to two jobs — classify rules at ingest, and draft prose. It never decides
which rule wins, nor whether a rule is respected.

Given a generation context — `brand · locale · content type · field · product type` — Stencil
returns **exactly** the rules that apply (conflicts resolved, precedence explicit, every
decision traced to a `local_id`), then writes/rewrites a short copy and **proves**, rule by
rule, that it obeys them.

**Live:** [guidelines-graph.vercel.app](https://guidelines-graph.vercel.app) — Hub → Pitch · Prototype · Docs.

---

## What it does (end to end)

1. **Ingest** any guideline set → a typed, conflict-aware graph (built once, frozen, auditable).
2. **Resolve** a context → the exact active rule set + a decision trace (who won, who it beat, why) + a "flag for human" queue.
3. **Generate / rewrite** a short copy → a **deterministic proof report**: pass/fail per rule, each linked to its `local_id`, with a bounded `generate → verify → repair` loop.
4. **Glass-box UI** — the machinery is visible end to end. No black box.

The whole thing is **data-driven**: the bundled Maison Lumière sample (47 rules) goes through
the *same* pipeline as any uploaded set. Nothing about the brand is hardcoded.

---

## The model (why a graph, why deterministic)

Two distinct structures:

- **Scope = a 6-dimensional lattice** (`brand, locale, contentType, productCategory, productType, field`), not a single line — some scopes are *incomparable* (field vs locale), which is why it's a **partial order**, not a tree. "Most specific wins" = the lowest applicable node. The mental model is **CSS specificity**.
- **A typed property graph** of the relationships rules have: `overrides`, `conflicts-with`, `reinforces`, `justified-by`. These edges are the product — they make precedence and traceability first-class.

### Precedence — partition → ranking → gate

```
applicable = rules whose scope is compatible with the context (every dim: wildcard or ==)
group applicable by SUBJECT                                   ① PARTITION (the "ring")
for each ring:
    invariants (legal/medical/safety) win as a FLOOR           ③ GATE (never overridden)
    else sort lexicographically: specificity ↓, then strength ↓ ② RANKING
        winner active; contradicting rules suppressed; reinforcing rules coexist
        irreducible tie (equal specificity AND strength, opposed) → flag_for_human
```

- **Specificity ≻ strength** (lexicographic): a weaker-but-more-specific rule beats a stronger-but-more-general one (German title ≤80 beats global ≤60).
- **Strength** (`forbidden > hard-rule > conditional > soft-preference`) only breaks ties at equal specificity (anti-aging: `forbidden` beats `hard-rule`).
- **Overridability ≠ strength**: invariants (medical/legal) sit *outside* the cascade as a floor.

These are encoded as **golden tests** (`tests/precedence.test.ts`) — the planted conflicts from
the sample, asserting the engine resolves them the way the theory predicts. That is "provably"
applied to our own code.

### Verification — where proof stops, honestly

Each constraint type carries its own deterministic checker (`lib/domain/verifiers.ts`),
parametrized by rule data:

| Constraint type | Checker |
|---|---|
| `lexical-forbidden` / `lexical-required` | term presence/absence (word-boundary regex) |
| `format-pattern` | currency / quotes / units / exclamation regex |
| `length-bound` | character / item count |
| `structure` | best-effort presence |
| `register-tone` | **not mechanically verifiable → judged, not proven** |

Tone/voice rules are reported as *judged*, never as *proven*. Saying where the proof stops is
itself the point.

---

## Stack & choices

- **Next.js + TypeScript → Vercel** — one language, one deployable, one URL. The engine runs in API routes (`app/api/{graph,ingest,resolve,generate}`); the domain is pure TS in `lib/domain/`.
- **Graph is conceptual** — implemented over plain structures in memory. No Neo4j: for hundreds–thousands of rules it would be ops cost without payoff.
- **LLM for drafting only** (OpenAI SDK → any OpenAI-compatible endpoint: OpenAI, GLM/Z.ai, Groq, Azure, OpenRouter), behind a deterministic verifier. The provider is swappable in one file (`lib/llm.ts`) — concrete proof that the LLM is a demoted, pluggable component, not the decision-maker.
- **Apple design system** (better-design `apple` tokens) — light canvas, SF Pro + JetBrains Mono, blue primary, pill buttons: restrained and product-grade. The glass-box framing matches the deterministic, auditable thesis.

### Surfaces

| Route | What |
|---|---|
| `/` | Hub — entry to the three surfaces |
| `/pitch` | A bilingual (EN/FR) slide deck, computed live from the real resolved graph + a real proof — the deck *is* the proof |
| `/prototype` | The Stencil app: ingest → resolve → generate → prove |
| `/docs` | The doctrine: model, precedence, verification |

```
lib/domain/
  types.ts        scope.ts        classify.ts     directive.ts
  ingest.ts       graph.ts        precedence.ts   verifiers.ts   generate.ts
app/api/{graph,ingest,resolve,generate}/route.ts
app/{page,pitch,prototype,docs}/page.tsx
tests/            golden tests for precedence + verifiers
```

---

## Run it

```bash
npm install
npm test          # golden tests: precedence + verifiers (no API key needed)
npm run dev       # http://localhost:3000
```

The **proof path needs no API key** — load the demo context (Lumière Paris · de-DE · title) with a
draft that violates 5 rules and verify it deterministically. **Drafting / rewriting** calls the LLM:

```bash
cp .env.example .env.local   # OPENAI_API_KEY · OPENAI_BASE_URL · OPENAI_MODEL
```

The drafting client uses the **OpenAI SDK**, so it runs against any OpenAI-compatible endpoint —
set `OPENAI_BASE_URL` / `OPENAI_MODEL` to point at OpenAI, GLM-4.7 (Z.ai), Groq, Azure or
OpenRouter. Switching providers is one `.env` change; the deterministic engine and proof layer
don't move.

Deploy: push to GitHub, import on Vercel, set the LLM env vars. The verify path works without any
key, so the proof surface is always live.

---

## Roadmap (deliberately out of scope for a short build)

- LLM-assisted ingestion of **non-normalized** guideline dumps into the schema (the bundled data is already clean → we parse, we don't "AI-analyze the file").
- In-UI **add-a-rule → watch the conflict light up live** — the most demonstrative feature.
- Human-in-the-loop review of classifier-proposed edges; persistence; multi-set management.
