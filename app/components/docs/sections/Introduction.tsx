"use client";

import { Section, Sub, Lead, P, Ul, Li, C, Analogy, Figure, Note } from "../prose";
import { PipelineFlow } from "../diagrams";

export default function Introduction() {
  return (
    <Section id="introduction" title="Introduction" kicker="Overview">
      <Lead>
        Stencil turns a messy guidelines file into a typed rule graph, then resolves which rules
        apply for a given context — <strong>deterministically</strong>. The language model never
        decides which rule wins or whether a rule is respected. It only helps classify rules at
        ingestion and drafts the prose. Everything else is mechanical, inspectable, and provable.
      </Lead>

      <Sub id="thesis" title="The thesis — LLM soup vs. a mechanistic engine">
        <P>
          Hand a model a pile of brand rules and it treats them <em>probabilistically</em>: it
          blends, averages, and quietly drops the ones that collide. We call that the soup. With a
          structured rule set you can do better — pull conflict resolution out of the stochastic
          model and put it into a <strong>deterministic function over a typed graph</strong>.
        </P>
        <P>
          The model is demoted to two narrow jobs: (1) <em>classify</em> rules at ingestion, and
          (2) <em>write</em> the copy. It never arbitrates precedence and never grades compliance.
        </P>
        <Analogy label="Why it matters">
          A barycentre — a weighted average of forces — is exactly the soup we are fleeing.
          Precedence is not a moving centre of gravity; it is an <strong>argmax under a
          lexicographic order</strong> (a winner-take-all priority sort). The needle does not
          settle in the middle; it jumps to a single winner.
        </Analogy>
      </Sub>

      <Sub id="architecture" title="Architecture at a glance">
        <P>The system is three subsystems, each a stage of the same pipeline:</P>
        <Ul>
          <Li>
            <strong>Ingestion</strong> — parse, type each rule, and materialize the edges
            (<C>overrides</C> / <C>conflicts-with</C> / <C>reinforces</C> / <C>justified-by</C>).
            Output: a typed, frozen, auditable graph.
          </Li>
          <Li>
            <strong>Resolution</strong> — given a context (brand + locale + content type + field +
            product), filter to the applicable subgraph and resolve conflicts by precedence,
            keeping a decision trace.
          </Li>
          <Li>
            <strong>Generation &amp; proof</strong> — the model drafts; a deterministic verifier
            checks each active rule and feeds failures back for repair.
          </Li>
        </Ul>
        <Figure caption="The end-to-end pipeline. The graph is built once; resolution and generation query it.">
          <PipelineFlow />
        </Figure>
      </Sub>

      <Sub id="core-ideas" title="Core ideas">
        <Ul>
          <Li>
            <strong>Glass-box / explainable-by-construction</strong> — every decision points back
            to a <C>local_id</C>; every <C>overrides</C> edge says <em>why</em> a rule won.
          </Li>
          <Li>
            <strong>Build once · query many</strong> — the graph is stable and frozen at ingestion;
            only resolution is dynamic, projecting that graph onto a context.
          </Li>
          <Li>
            <strong>Honest proof boundary</strong> — mechanical rules are <em>proven</em>; tone and
            register are <em>judged, not proven</em>, and labelled as such.
          </Li>
        </Ul>
        <Note>
          &quot;Works dynamically with any guideline set&quot; means <strong>data-driven</strong>{" "}
          (any file flows through the same pipeline) — not a graph that mutates at runtime. Those are
          two very different meanings of &quot;dynamic.&quot;
        </Note>
      </Sub>
    </Section>
  );
}
