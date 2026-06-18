"use client";

import { Section, Sub, P, Ul, Li, C, Analogy, DataTable, CodeBlock, Figure, Note } from "../prose";
import { ScopeLattice } from "../diagrams";
import LiveGraph from "../LiveGraph";

export default function Model() {
  return (
    <Section id="model" title="Model" kicker="Build the graph, once">
      <P>
        Ingestion converts the flat table into a <strong>typed graph</strong>: each rule becomes a
        node with an address and three labels, and the relationships <em>between</em> rules become
        typed edges. This graph is built once and frozen — the foundation everything else queries.
      </P>

      <Sub id="scope-vector" title="ScopeVector — a rule's address">
        <P>
          A <C>ScopeVector</C> is the 6 cells that say <strong>where</strong> a rule applies. A rule
          is applicable to a context when, for <em>every</em> dimension, it is a wildcard or equals
          the context value.
        </P>
        <CodeBlock
          caption="lib/domain/scope.ts"
          code={`export function isApplicable(scope: ScopeVector, ctx: GenerationContext): boolean {
  return SCOPE_DIMENSIONS.every((d) => {
    const rv = scope[d];
    if (rv === WILDCARD) return true;
    return rv.toLowerCase() === String(ctx[d] ?? '').toLowerCase();
  });
}`}
        />
      </Sub>

      <Sub id="scope-lattice" title="The scope lattice — why a lattice, not a tree">
        <P>
          Because scope is multi-dimensional, the addresses form a <strong>partial order</strong> (a
          lattice), drawn as a Hasse diagram. The more dimensions a rule fixes, the lower it sits —
          and the more specific it is.
        </P>
        <Figure caption="The scope lattice. Specificity = number of non-wildcard dimensions that match the context.">
          <ScopeLattice />
        </Figure>
        <P>
          A <strong>tree</strong> gives each child a single parent. But the rule{" "}
          <C>de-DE + title</C> descends from <em>two</em> parents at once. Two parents → not a tree,
          a lattice. And some rules are simply <strong>incomparable</strong> (<C>field</C> vs{" "}
          <C>locale</C> fix different axes) — a tree or a sorted list cannot express &quot;incomparable.&quot;
        </P>
        <CodeBlock
          caption="lib/domain/scope.ts"
          code={`export function specificity(scope: ScopeVector): number {
  return SCOPE_DIMENSIONS.filter((d) => scope[d] !== WILDCARD).length;
}`}
        />
        <Analogy label="The CSS cascade">
          This is 1:1 the CSS specificity problem: several rules match an element; the most specific
          selector wins. &quot;Group policy&quot; vs &quot;the Paris office rule&quot; — inside the Paris office, the
          local rule wins.
        </Analogy>
      </Sub>

      <Sub id="classification" title="Classification — the 3 labels">
        <P>
          A rule arrives as a sentence. To make it operable, the classifier sticks{" "}
          <strong>three labels</strong> on it — deterministically, from language patterns, never from
          &quot;rule #4 = forbidden.&quot; Pattern-matching is what makes it work on any brand.
        </P>
        <Ul>
          <Li>
            <strong>① constraintType</strong> — which bin (forbidden, length, format…). Tells us{" "}
            <em>how to prove</em> it.
          </Li>
          <Li>
            <strong>② subject</strong> — what it&apos;s about (<C>anti-aging</C>, <C>currency</C>,{" "}
            <C>length:title</C>). The hashtag that says which rules compete.
          </Li>
          <Li>
            <strong>③ overridable</strong> — law or taste? A style preference (assouplissable) or a
            legal/medical guardrail (<C>overridable: false</C> → invariant).
          </Li>
        </Ul>
        <Analogy label="Sorting the mail">
          Before processing a letter you decide: invoice, ad, or registered mail? The type dictates
          the treatment. Same for a rule — the labels decide how it&apos;s grouped, ranked, and proven.
        </Analogy>
      </Sub>

      <Sub id="subjects-rings" title="Subjects & rings — group by subject only">
        <P>
          Rules are grouped into rings by <strong>subject alone</strong>, not subject + type. This
          one decision is subtle but decisive:
        </P>
        <Ul>
          <Li>
            Rule 3 <em>requires</em> &quot;anti-aging&quot; → bin <C>lexical-required</C>.
          </Li>
          <Li>
            Rule 4 <em>forbids</em> &quot;anti-aging&quot; → bin <C>lexical-forbidden</C>.
          </Li>
        </Ul>
        <P>
          Different bins, same subject — and they contradict head-on. Group by{" "}
          <C>bin + subject</C> and they land in separate rings, never meet, and the conflict goes{" "}
          <strong>invisible</strong>. Group by <C>subject</C> alone and they fight in the same ring,
          where precedence settles it.
        </P>
        <Analogy label="One motion, one room">
          A debate on a single motion: &quot;should we say anti-aging?&quot;. Everyone with an opinion is in
          the same room, for or against. Split the &quot;for&quot; and &quot;against&quot; into two rooms and there is
          no debate. The subject defines the room; the type is just a position in it.
        </Analogy>
      </Sub>

      <Sub id="contradiction" title="Contradiction vs. reinforcement">
        <P>
          Same ring does not mean fighting. Two rules on currency may say the <em>same</em> thing
          (they reinforce — both stay) or the <em>opposite</em> (they contradict — one survives). We
          decide with a normalized <strong>directive signature</strong>.
        </P>
        <CodeBlock
          caption="lib/domain/directive.ts (excerpt)"
          code={`// same subject + DIFFERENT signatures → contradiction
// same subject + IDENTICAL signatures  → reinforcement
if (rule.subject === 'currency') {
  if (/before the amount|symbol before|€\\s*\\d/.test(t)) return 'currency:before';
  if (/after (the )?amount|\\d+\\s*€/.test(t))            return 'currency:after';
}
// reader address — test "informal" FIRST ("formal" is a substring of it)
if (rule.subject === 'reader-address') {
  if (/informal|tutoiement/.test(t)) return 'address:informal';
  if (/formal|\\bsie\\b/.test(t))     return 'address:formal';
}`}
        />
        <Note>
          The <C>informal</C>-before-<C>formal</C> ordering is a real bug fix: <C>/formal/</C> also
          matches &quot;in<em>formal</em>&quot;, so an informal rule wrongly read as <C>address:formal</C>,
          looked identical to a formal rule, and the engine thought they <em>reinforced</em> — keeping
          both at once. Caught by the golden tests.
        </Note>
      </Sub>

      <Sub id="edge-types" title="Edge types">
        <P>
          Two rules get an edge only when they share a <strong>subject</strong> and their scopes{" "}
          <strong>overlap</strong>. That filter encodes the false conflict: two exclamation-mark
          rules on <em>different brands</em> have disjoint scopes → no edge → no false conflict.
        </P>
        <DataTable
          head={["Edge", "Meaning", "Example"]}
          rows={[
            [<C key="c">overrides</C>, "A (more specific) beats B", "#28 → #27"],
            [<C key="c">conflicts-with</C>, "same level, opposite directives", "#3 ↔ #4"],
            [<C key="c">reinforces</C>, "same direction, same subject", "#45 → #6"],
            [<C key="c">justified-by</C>, "semantic reason", "#4 → #14 (medical claim)"],
          ]}
        />
        <Figure caption="The live graph — the bundled Maison Lumière set (47 rules) resolved against the demo context. Switch between the Weight, Graph and Matrix views.">
          <LiveGraph />
        </Figure>
      </Sub>
    </Section>
  );
}
