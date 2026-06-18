"use client";

import { Section, Sub, P, Ul, Li, C, Analogy, DataTable, CodeBlock, Note } from "../prose";

export default function Resolution() {
  return (
    <Section id="resolution" title="Resolution" kicker="Query by context">
      <P>
        Resolution projects the frozen graph onto a single context and returns{" "}
        <strong>exactly the rules that apply</strong>, conflicts resolved, with a decision trace. The
        core lives in <C>resolve()</C> — three stages: partition → gate → ranking.
      </P>

      <Sub id="context-selector" title="The context selector — the hinge">
        <P>
          A context is a precise point at the bottom of the lattice:{" "}
          <C>brand · locale · contentType · productCategory · productType · field</C>. It is the
          hinge both surfaces share — change it and a different subgraph lights up. Same graph,
          different query, different active set.
        </P>
      </Sub>

      <Sub id="ranking" title="Filter → gate → ranking">
        <Ul>
          <Li>
            <strong>① Filter</strong> — keep only rules whose scope is applicable to the context.
          </Li>
          <Li>
            <strong>② Partition</strong> — group applicable rules into rings by subject. Each ring
            resolves independently.
          </Li>
          <Li>
            <strong>③ Gate</strong> — if a ring has an invariant (<C>overridable: false</C>), it
            forms the winner pool, hors-competition (a floor).
          </Li>
          <Li>
            <strong>④ Ranking</strong> — for normal rules, sort lexicographically:{" "}
            <strong>specificity first, then strength</strong> only on ties.
          </Li>
        </Ul>
        <CodeBlock
          caption="lib/domain/precedence.ts"
          code={`function rank(a: Rule, b: Rule): number {
  const sa = ruleSpecificity(a);
  const sb = ruleSpecificity(b);
  if (sa !== sb) return sb - sa;                          // more specific first
  return STRENGTH_RANK[b.strength] - STRENGTH_RANK[a.strength]; // stronger first
}`}
        />
        <Analogy label="The dictionary">
          Lexicographic = compare the first letter; only look at the second if the firsts tie. Here:
          first letter = specificity, second = strength. You <strong>never</strong> compare strength
          across two different specificity levels.
        </Analogy>
        <P>The three real fights from the sample prove the ordering:</P>
        <DataTable
          head={["Ring", "Specificity", "Strength", "Winner", "Proves"]}
          rows={[
            [<>anti-aging {`{3,4}`}</>, "2 = 2 (tie)", "hard vs forbidden", "#4", "on a tie, strength decides"],
            [<>length:title {`{27,28}`}, de</>, "3 < 4", "hard vs conditional", "#28", "specificity ≫ strength"],
            [<>currency {`{18,19}`}, fr</>, "1 < 2", "hard = hard", "#19", "more specific (locale) wins"],
          ]}
        />
        <Note>
          Read the first two rows together: if strength came first, the weaker-but-specific #28
          would lose to #27 and German titles would be wrongly capped at 60. Specificity must come
          first.
        </Note>
      </Sub>

      <Sub id="invariant-floor" title="Force ≠ overridability">
        <P>
          The subtlest point: <strong>strength</strong> (how hard it&apos;s stated) is not{" "}
          <strong>overridability</strong> (whether a more specific scope may relax it). An invariant
          is not the <em>strongest</em> rule — it is <em>out of the competition</em>, applied like a
          floor.
        </P>
        <Analogy label="The referee's rules">
          Before the boxers climb in, there are the referee&apos;s rules (&quot;no hits below the belt&quot;).
          They apply no matter who is stronger. Rule 14 (&quot;no medical claims&quot;) is that — no more
          specific rule may relax it.
        </Analogy>
      </Sub>

      <Sub id="flag-for-human" title="flag_for_human — the honest fallback">
        <P>
          If two rules are at <strong>perfect equality</strong> (same specificity <em>and</em>{" "}
          strength) and contradict, the engine <strong>refuses to guess</strong> — it escalates to a
          human. Same for hygiene problems (<C>needs_clarification</C>, <C>[NOT PROVIDED]</C>).
        </P>
        <Analogy label="A good judge">
          &quot;On the rules alone I honestly cannot decide — I escalate&quot; beats flipping a coin. Honesty
          over false confidence is exactly what separates this from &quot;paste your rules into GPT.&quot;
        </Analogy>
      </Sub>

      <Sub id="decision-trace" title="The decision trace">
        <P>
          The output is a <C>ResolveResult</C>: the <C>active</C> rules, one <C>Decision</C> per
          contested ring (winner, who it beat, and why), the <C>flagged</C> conflicts, and the
          applicable count. For the demo context: <strong>22 applicable → 17 active</strong>, 4 traced
          decisions, 1 flagged for clarification.
        </P>
        <CodeBlock
          caption="lib/domain/types.ts"
          code={`export interface ResolveResult {
  context: GenerationContext;
  active: Rule[];          // the conflict-resolved set
  decisions: Decision[];   // one per contested ring (the audit trail)
  flagged: FlaggedConflict[]; // flag_for_human
  applicableCount: number;
}`}
        />
      </Sub>
    </Section>
  );
}
