"use client";

import { Section, Sub, P, Ul, Li, C, Analogy, DataTable, CodeBlock, Note } from "../prose";

export default function Data() {
  return (
    <Section id="data" title="Data" kicker="The input">
      <P>
        The engine reads a flat table: one row per rule, one column per attribute. Any{" "}
        <C>.xlsx</C>, <C>.csv</C> or <C>.json</C> file that follows the schema below flows through
        the exact same pipeline as the bundled sample — nothing is hardcoded to one brand.
      </P>

      <Sub id="file-format" title="Guidelines file format">
        <P>
          Columns the ingest pipeline understands. Only <C>guideline_text</C> is required; missing
          scope columns simply degrade to a wildcard (the rule applies everywhere on that axis).
        </P>
        <DataTable
          head={["Column", "Meaning", "Example"]}
          rows={[
            [<C key="c">guideline_text</C>, <>The rule itself, in plain language <strong>(required)</strong></>, "Never abbreviate the brand name"],
            [<C key="c">name</C>, "Short label", "Brand name in full"],
            [<C key="c">local_id</C>, "Stable identifier (the audit handle)", "4"],
            [<C key="c">brand</C>, "Brand scope", "Lumière Paris"],
            [<C key="c">target_locale</C>, "Locale scope", "de-DE"],
            [<C key="c">content_typology</C>, "Content type scope", "Product Description"],
            [<C key="c">product_category</C>, "Category scope", "Skincare"],
            [<C key="c">product_type</C>, "Product type scope", "GIFT SET"],
            [<C key="c">product_field</C>, "Output field scope", "title"],
            [<C key="c">generation_type</C>, "Strength", "must / should / may"],
            [<C key="c">guideline_type</C>, "Raw type hint (kept for display)", "TERM / BRAND / TYPO"],
            [<C key="c">data_quality</C>, "Hygiene flag", "complete"],
          ]}
        />
        <Note tone="warn">
          Keep the headers exactly as above. A file with mixed or unlabeled columns can&apos;t be
          classified — the parser picks the sheet whose header row best matches this schema and
          drops rows with neither <C>guideline_text</C> nor <C>name</C>.
        </Note>
      </Sub>

      <Sub id="scope-dimensions" title="The 6 scope dimensions">
        <P>
          Scope is not a single ladder — it is <strong>six independent dimensions</strong>. Each is
          either a precise value or the wildcard <C>*</C>.
        </P>
        <DataTable
          head={["#", "Dimension", "Column", "Example"]}
          rows={[
            ["1", <C key="c">brand</C>, "brand", "Lumière Paris"],
            ["2", <C key="c">locale</C>, "target_locale", "de-DE"],
            ["3", <C key="c">contentType</C>, "content_typology", "Product Description"],
            ["4", <C key="c">productCategory</C>, "product_category", "Skincare"],
            ["5", <C key="c">productType</C>, "product_type", "GIFT SET"],
            ["6", <C key="c">field</C>, "product_field", "title"],
          ]}
        />
        <Analogy label="A postal address with wildcards">
          A rule is a sign posted somewhere in a giant building; its scope is the{" "}
          <strong>address</strong>, and <C>*</C> means &quot;don&apos;t care, on this axis.&quot;
          The generation context is a single precise pin. A rule applies when its address — wildcards
          and all — <strong>covers</strong> that pin.
        </Analogy>
      </Sub>

      <Sub id="constraint-types" title="Constraint types — the 6 bins">
        <P>
          Every rule is sorted into one of six constraint types. The type is <strong>not</strong> a
          precedence axis — it defines the &quot;ring&quot; (who competes with whom) and hands us, for
          free, the deterministic verifier for that channel.
        </P>
        <DataTable
          head={["Constraint type", "Governs", "How it's proven"]}
          rows={[
            [<C key="c">lexical-forbidden</C>, "a term must NOT appear", "search the term — must be absent"],
            [<C key="c">lexical-required</C>, "a form MUST appear", "the wrong form must be absent"],
            [<C key="c">format-pattern</C>, "currency / quotes / date / units / case", "format regex"],
            [<C key="c">length-bound</C>, "character or item count", "count"],
            [<C key="c">structure</C>, "required sections / ordering", "presence (best-effort)"],
            [<C key="c">register-tone</C>, "voice / address / register", "⚠ not provable — judged"],
          ]}
        />
      </Sub>

      <Sub id="strength-levels" title="Strength levels">
        <P>
          How strongly a rule is stated. Strength is only a <strong>tie-break</strong> — it matters
          when two rules have equal scope specificity (see Resolution).
        </P>
        <CodeBlock
          caption="lib/domain/types.ts"
          code={`export const STRENGTH_RANK: Record<Strength, number> = {
  forbidden: 4,        // highest
  'hard-rule': 3,
  conditional: 2,
  'soft-preference': 1, // lowest
};`}
        />
      </Sub>

      <Sub id="data-hygiene" title="Data hygiene">
        <P>
          Real files are messy. Rules flagged <C>needs_clarification</C> or <C>[NOT PROVIDED]</C> are{" "}
          <strong>surfaced, never silently applied</strong>. Applying a vague or mis-scoped rule
          produces a confidently-wrong output — worse than skipping it.
        </P>
        <Ul>
          <Li>
            <C>complete</C> — clear enough to apply and prove.
          </Li>
          <Li>
            <C>needs_clarification</C> — too vague (e.g. &quot;luxurious feel&quot;); queued, not applied.
          </Li>
          <Li>
            <C>not_provided</C> — missing data; queued, not applied.
          </Li>
        </Ul>
      </Sub>
    </Section>
  );
}
