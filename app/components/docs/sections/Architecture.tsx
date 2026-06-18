"use client";

import { Section, Sub, P, Ul, Li, C, DataTable, Note } from "../prose";

export default function Architecture() {
  return (
    <Section id="architecture" title="Architecture & Decisions" kicker="The why">
      <P>
        A few modelling choices carry the whole design. They are worth stating explicitly — both for
        reviewers and for the next engineer who extends this.
      </P>

      <Sub id="lattice-vs-tree" title="Lattice vs. tree vs. alternatives">
        <P>
          There are two distinct graph structures, often conflated: the{" "}
          <strong>scope lattice</strong> (a partial order, for precedence) and the{" "}
          <strong>relation graph</strong> (a property graph, for conflict detection and
          traceability). Why a partial order and not a tree? Because scope is multi-dimensional —
          some scopes are incomparable, and a tree forbids that.
        </P>
        <DataTable
          head={["Model", "Verdict", "Why"]}
          rows={[
            ["Tree / hierarchy", "✗", "single inheritance — can't capture multi-dim scope"],
            ["Total order / priority list", "✗", "forces a global ranking — can't say 'incomparable'"],
            ["Property graph (relations)", "✓", "first-class typed edges — right for relations"],
            ["Partial order / lattice", "✓", "right for precedence"],
            ["RDF / OWL ontology", "✗", "powerful but ceremonious — overkill"],
            ["Rules engine (RETE / Drools)", "✗", "legit but heavy and opaque — anti glass-box"],
          ]}
        />
      </Sub>

      <Sub id="graph-cost" title="When a graph earns its cost">
        <P>
          If you only <em>filter rows</em>, a table suffices. A graph earns its keep when the{" "}
          <strong>relations are the product</strong> and you traverse them: chains of{" "}
          <C>overrides</C>, chains of <C>justified-by</C>, cliques of <C>conflicts-with</C>. Even
          then, the graph is a <strong>conceptual model</strong> — not necessarily a graph database.
        </P>
        <Note>
          A real graph DB (Neo4j) or a rules engine would earn its cost only if interactions exploded{" "}
          <em>and</em> scale did (hundreds of thousands of rules, multi-brand). For 47–a few thousand
          rules, an in-memory adjacency model is the right call — the lattice is the <em>model</em>,
          not the tech.
        </Note>
      </Sub>

      <Sub id="stack" title="Stack">
        <Ul>
          <Li>
            <strong>In-memory & deterministic</strong> — the graph is plain objects, built once and
            cached; no database, no runtime mutation.
          </Li>
          <Li>
            <strong>Serverless</strong> — a single Next.js deployable; the proof surface runs
            client-side and works without an API key.
          </Li>
          <Li>
            <strong>Pluggable model</strong> — the LLM client is swappable via{" "}
            <C>OPENAI_BASE_URL</C> / <C>OPENAI_MODEL</C> env vars (OpenAI-compatible). Currently
            wired to GLM-4.7 on Z.ai. The model only drafts and classifies, never decides
            precedence or compliance.
          </Li>
        </Ul>
      </Sub>
    </Section>
  );
}
