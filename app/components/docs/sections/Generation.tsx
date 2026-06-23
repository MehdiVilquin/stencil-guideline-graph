"use client";

import { Section, Sub, P, Ul, Li, C, Analogy, DataTable, CodeBlock, Note } from "../prose";

export default function Generation() {
  return (
    <Section id="generation" title="Generation & Proof" kicker="Write, then prove">
      <P>
        Only now does the model write. It receives <em>just</em> the active rules, drafts, and a
        deterministic verifier checks each one. Mechanical failures are fed back for a bounded
        repair loop. The report <strong>is</strong> the proof.
      </P>

      <Sub id="active-injection" title="Active-rules injection — not all 47">
        <P>
          We inject only the active set (≈ 8–17 rules), never the full file. Less noise, a cheaper
          prompt, and an agent that doesn&apos;t drown — this is the original product pain, solved.
        </P>
      </Sub>

      <Sub id="verifiers" title="The verifiers">
        <P>
          Recall the constraint type tells us <em>how to prove</em>. Each bin has its own checker,
          and the forbidden-term list comes from the rule itself (its quoted words) — never a
          hardcoded list, so it works on any brand.
        </P>
        <DataTable
          head={["Bin", "How it proves", "Example failure"]}
          rows={[
            [<C key="c">lexical-forbidden</C>, "term must be absent", "&quot;anti-aging&quot; present → ✗"],
            [<C key="c">lexical-required</C>, "wrong form must be absent", "&quot;hyaluronic acid&quot; in FR → ✗"],
            [<C key="c">format-pattern</C>, "format regex", "&quot;€50&quot; instead of &quot;50 €&quot; → ✗"],
            [<C key="c">length-bound</C>, "count characters / items", "title 94/80 → ✗"],
            [<C key="c">franglais</C>, "EN replacement tokens absent in non-EN copy", "&quot;water-resistant&quot; in FR → ✗"],
            [<C key="c">structure</C>, "presence (best-effort)", "—"],
            [<C key="c">register-tone</C>, "not provable → LLM-judged (separate pass)", "&quot;refined&quot; → judged"],
          ]}
        />
        <Note>
          A second real bug lived here: splitting on the hyphen <C>-</C> broke &quot;anti-aging&quot; and
          &quot;age-defying&quot; into pieces, so the verifier thought &quot;age-defying&quot; was forbidden. Fixed by
          splitting only on clause delimiters, not the hyphen.
        </Note>
      </Sub>

      <Sub id="franglais-guard" title="Franglais guard — localised replacements, not English leakage">
        <P>
          Rules are written in English (e.g. <em>&quot;never use waterproof — use water-resistant
          instead&quot;</em>). On FR/IT/DE copy the model would paste those English replacement terms
          verbatim, passing all lexical checks but producing obvious franglais.
        </P>
        <P>
          Two-pronged fix, both data-driven (zero hard-coded lists per brand):
        </P>
        <Ul>
          <Li>
            <strong>Prompt guard</strong> — <C>buildSystemPrompt</C> adds, for non-EN locales, an
            explicit instruction to translate every replacement term from rules into the target
            language. The <strong>verbatim allow-list</strong> (brand name + canonical forms from
            <C>lexical-required</C> rules) is injected inline so required terms are never
            mistakenly translated.
          </Li>
          <Li>
            <strong>Deterministic verifier</strong> — <C>verifyForeignTerms</C> (
            <C>verifiable: true</C>) extracts replacement tokens from every active{" "}
            <C>lexical-forbidden</C> rule and flags them if found in non-EN copy, excluding the
            allow-list. A positive flag fails <C>allProvableGreen</C> and feeds the repair loop
            with the exact offending token.
          </Li>
        </Ul>
        <Note>
          <C>verifyLanguage</C> (stopword dominance) is kept as a coarse language check.{" "}
          <C>verifyForeignTerms</C> is the fine-grained safety net — they complement each other.
        </Note>
      </Sub>

      <Sub id="provable-judged" title="Provable vs. judged — the honesty boundary">
        <P>
          <C>register-tone</C> and <C>structure</C> cannot be mechanically verified. We cannot{" "}
          <em>prove</em> &quot;refined, understated.&quot; So they are handled by a{" "}
          <strong>real, separate LLM-judge pass</strong> after the deterministic loop converges —
          not silently assumed to pass.
        </P>
        <P>
          The judge returns <C>{`{ pass: bool, reason: string }`}</C> per non-verifiable rule. Its
          verdicts are shown as <strong>&quot;AI-judged · looks OK&quot;</strong> or{" "}
          <strong>&quot;AI-judged · needs review&quot;</strong> in the inspector, clearly distinct from the
          deterministic &quot;Proven&quot; bucket. They never touch <C>allProvableGreen</C>.
        </P>
        <Analogy label="A laboratory">
          You can measure pH, length, temperature. You cannot measure &quot;is this elegant?&quot; — at best
          an expert judges it. Saying clearly what is <em>measured</em> vs <em>judged</em> is
          scientific rigour, and a strong FDE signal.
        </Analogy>
      </Sub>

      <Sub id="repair-loop" title="The repair loop">
        <P>The provably-green loop:</P>
        <CodeBlock
          caption="lib/domain/generate.ts (shape)"
          code={`1. take the ACTIVE rules (resolve) — not all 47
2. inject them into the prompt → the LLM DRAFTS
3. the VERIFIER (not the LLM) checks each rule
   — including franglais check for non-EN locales
4. if a MECHANICAL check still fails → send the violated
   local_ids back to the LLM → it fixes
   (bounded to 2 tries; 3 tries if ONLY length rules fail)
5. last resort: deterministic truncation to the last complete
   sentence before the tightest character bound
6. THEN: LLM-judge runs once on the final copy for
   non-verifiable rules (register-tone, structure)`}
        />
        <Analogy label="Writer + ruthless proofreader">
          The writer (LLM) drafts; the proofreader (verifier) circles the <em>measurable</em>
          mistakes in red and sends them back. The proofreader never writes — it only proves.
          A separate expert then <em>judges</em> the things no ruler can measure.
        </Analogy>
      </Sub>

      <Sub id="verify-only" title="Verify-only mode">
        <P>
          <C>verifyDraft()</C> runs the whole proof <strong>without the LLM</strong> — paste any copy
          and prove it offline, no API key required. The proof surface is always alive, independent
          of generation.
        </P>
      </Sub>
    </Section>
  );
}
