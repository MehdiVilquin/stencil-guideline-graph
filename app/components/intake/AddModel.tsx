"use client";

// "Add a model" — two-pane marketing layout:
//   left  = upload card (drop a guidelines file, parsed + ingested client-side)
//   right = custom-model pitch card (contact the team)
// Once a file is parsed, the Review pane replaces both cards.

import { useMemo, useRef, useState } from "react";
import { ingest } from "@/lib/domain/ingest";
import { facets as computeFacets } from "@/lib/domain/store";
import { resolve } from "@/lib/domain/precedence";
import type { ConstraintType, GenerationContext } from "@/lib/domain/types";
import { parseGuidelineFile } from "@/lib/parse/guidelines";
import { CONSTRAINT_LABEL } from "@/lib/ui/labels";
import { colorForName, monogramForName, sampleModelInput } from "@/app/store/library";
import { DEMO_CONTEXT, seedContextFromFacets, type Facets } from "../types";
import type { RawRule } from "@/lib/domain/ingest";
import GraphTab from "../graph/GraphTab";
import { ScreenHead } from "./NewSession";
import { Upload, Check, Sparkle, ArrowUp, ChevronRight, FilePlus } from "../icons";

const TYPE_ORDER: ConstraintType[] = [
  "lexical-forbidden",
  "lexical-required",
  "format-pattern",
  "length-bound",
  "structure",
  "register-tone",
];

interface Parsed {
  rows: RawRule[];
  source: string;
}

export default function AddModel({
  onSave,
}: {
  onSave: (input: { name: string; rows: RawRule[]; source: string }, start: boolean) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  const handleFile = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const p = await parseGuidelineFile(file);
      setParsed(p);
      setName(deriveName(p.source));
    } catch (e) {
      setError((e as Error).message ?? "Unreadable file.");
      setParsed(null);
    } finally {
      setBusy(false);
    }
  };

  const useSample = () => {
    const s = sampleModelInput();
    setParsed({ rows: s.rows, source: s.source });
    setName(s.name);
    setError(null);
  };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <ScreenHead
        title="Add data"
        sub="— drop a guidelines file, we extract and classify it"
      />

      <div className="mx-auto flex min-h-[calc(100%-64px)] max-w-[1040px] flex-col justify-center px-6 py-12">
        {!parsed ? (
          /* ── marketing layout ── */
          <>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* ── LEFT: upload card ── */}
              <UploadCard
                drag={drag}
                busy={busy}
                fileRef={fileRef}
                onDragOver={() => setDrag(true)}
                onDragLeave={() => setDrag(false)}
                onDrop={(f) => handleFile(f)}
                onBrowse={() => fileRef.current?.click()}
                onSample={useSample}
              />

              {/* ── RIGHT: custom model pitch ── */}
              <CustomModelCard />
            </div>

            {/* ── data format guide (full width, below) ── */}
            <DataFormatCard />

            {error && (
              <div className="mt-4 rounded-[10px] border border-[var(--destructive)]/25 bg-[var(--destructive)]/[0.06] px-4 py-3 text-[13px] text-[var(--destructive)]">
                {error}
              </div>
            )}
          </>
        ) : (
          /* ── review after upload ── */
          <>
            {error && (
              <div className="mb-4 rounded-[10px] border border-[var(--destructive)]/25 bg-[var(--destructive)]/[0.06] px-4 py-3 text-[13px] text-[var(--destructive)]">
                {error}
              </div>
            )}
            <Review parsed={parsed} name={name} onName={setName} onSave={onSave} />
          </>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        aria-label="Import a guidelines file (.xlsx, .csv, .json)"
        accept=".xlsx,.xls,.csv,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────
   Upload card (left)
───────────────────────────────────────── */

function UploadCard({
  drag,
  busy,
  fileRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onBrowse,
  onSample,
}: {
  drag: boolean;
  busy: boolean;
  fileRef: React.RefObject<HTMLInputElement | null>;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: (f: File) => void;
  onBrowse: () => void;
  onSample: () => void;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
      {/* header band */}
      <div className="border-b border-[var(--border)] px-7 py-6">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] bg-[oklch(0.96_0.03_257)] text-[var(--primary)]">
          <Upload className="h-6 w-6" />
        </div>
        <h2 className="text-[18px] font-semibold leading-snug">Add data</h2>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--muted-foreground)]">
          Import a guidelines file: we extract the rules, classify them automatically
          and build the constraint graph.
        </p>
      </div>

      {/* dropzone */}
      <div className="flex flex-1 flex-col justify-center px-7 py-8">
        <button
          type="button"
          onClick={onBrowse}
          onDragOver={(e) => {
            e.preventDefault();
            onDragOver();
          }}
          onDragLeave={onDragLeave}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) onDrop(f);
          }}
          className={`group flex w-full flex-col items-center gap-4 rounded-[16px] border-[1.5px] border-dashed px-6 py-10 text-center transition ${
            drag
              ? "border-[var(--primary)] bg-[oklch(0.985_0.01_257)]"
              : "border-[oklch(0.82_0.01_286)] bg-[oklch(0.99_0_0)] hover:border-[var(--primary)] hover:bg-[oklch(0.985_0.01_257)]"
          }`}
        >
          <span
            className={`flex h-14 w-14 items-center justify-center rounded-full transition ${
              drag ? "bg-[var(--primary)]/15 text-[var(--primary)]" : "bg-[var(--muted)] text-[var(--muted-foreground)] group-hover:bg-[var(--primary)]/10 group-hover:text-[var(--primary)]"
            }`}
          >
            <ArrowUp className="h-6 w-6" />
          </span>
          <span className="space-y-1">
            <span className="block text-[14px] font-semibold">
              {busy ? "Reading file…" : "Drop a file here"}
            </span>
            <span className="block text-[13px] text-[var(--muted-foreground)]">
              or{" "}
              <span className="font-medium text-[var(--primary)]">browse your files</span>
            </span>
          </span>
          <span className="flex flex-wrap justify-center gap-1.5">
            <Chip>.xlsx</Chip>
            <Chip>.csv</Chip>
            <Chip>.json</Chip>
          </span>
        </button>

        <div className="mt-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--border)]" />
          <span className="text-[12px] text-[var(--muted-foreground)]">or</span>
          <div className="h-px flex-1 bg-[var(--border)]" />
        </div>

        <button
          type="button"
          onClick={onSample}
          className="mt-4 w-full rounded-[12px] border border-[var(--border)] bg-[var(--card)] py-3 text-[13.5px] font-medium transition hover:bg-[var(--muted)]"
        >
          Try with the sample
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Custom model pitch card (right)
───────────────────────────────────────── */

const PERKS = [
  {
    text: "Trained on your guidelines — brand bible, business rules, legal constraints",
    sub: "Your editorial corpus at the heart of the model",
  },
  {
    text: "+ 1,000,000 reference points from our datasets",
    sub: "Cross-brand, sector, and market benchmarks",
  },
  {
    text: "Competitive benchmark built in from the first run",
    sub: "Editorial positioning measured, not estimated",
  },
  {
    text: "Constraint graph delivered turnkey in < 2 weeks",
    sub: "Ready to integrate into your workflow",
  },
];

function CustomModelCard() {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-[20px] bg-[oklch(0.17_0.045_257)]">
      {/* decorative glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[radial-gradient(circle,oklch(0.6_0.22_257)_0%,transparent_70%)] opacity-25"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-[radial-gradient(circle,oklch(0.7_0.18_310)_0%,transparent_70%)] opacity-15"
      />

      {/* badge */}
      <div className="relative px-7 pt-8">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/70">
          <Sparkle className="h-3 w-3" />
          Custom model
        </span>
      </div>

      {/* headline */}
      <div className="relative px-7 pt-5">
        <h2 className="text-[21px] font-semibold leading-snug text-white">
          Your data.<br />
          <span className="text-white/50">Our references.</span><br />
          A model that fits you.
        </h2>
        <p className="mt-3 text-[13px] leading-relaxed text-white/55">
          We merge your editorial corpus with over a million data points collected
          across other brands — sector benchmarks, trends, and market standards.
          Result: a model calibrated to your reality, anchored in an objective industry reference.
        </p>
      </div>

      {/* perks list */}
      <div className="relative mt-6 flex flex-1 flex-col justify-between px-7 pb-8">
        <ul className="space-y-3.5">
          {PERKS.map((perk) => (
            <li key={perk.text} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
                <Check className="h-3 w-3" />
              </span>
              <span>
                <span className="block text-[13px] font-medium text-white/85">{perk.text}</span>
                <span className="block text-[11.5px] text-white/40">{perk.sub}</span>
              </span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="mt-7 flex flex-col gap-2.5">
          <a
            href="mailto:contact@dataword.ai?subject=Demande%20de%20mod%C3%A8le%20sur%20mesure"
            className="group flex w-full items-center justify-center gap-2 rounded-[13px] bg-white py-3.5 text-[14px] font-semibold text-[oklch(0.17_0.045_257)] transition hover:bg-white/90"
          >
            Contact us
            <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </a>
          <p className="text-center text-[11.5px] text-white/35">
            Reply within 48 h · Custom pricing
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Data format guide (full width, below cards)
───────────────────────────────────────── */

// Columns the ingest pipeline reads. `required` rows must be present; everything
// else is optional — a missing column simply scopes the rule to "all contexts".
const COLUMNS: { key: string; desc: string; example: string; required?: boolean }[] = [
  { key: "guideline_text", desc: "The rule itself, in plain language", example: "Never abbreviate the brand name", required: true },
  { key: "name", desc: "Short label for the rule", example: "Brand name in full" },
  { key: "target_locale", desc: "Locale it applies to", example: "fr-FR" },
  { key: "content_typology", desc: "Type of content", example: "product-page" },
  { key: "product_category", desc: "Product scope", example: "skincare" },
  { key: "generation_type", desc: "Strength: must / should / may", example: "must" },
  { key: "guideline_type", desc: "Constraint hint (optional)", example: "lexical" },
];

function DataFormatCard() {
  return (
    <div className="mt-5 overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
      {/* header */}
      <div className="flex items-start gap-4 border-b border-[var(--border)] px-7 py-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[oklch(0.96_0.03_257)] text-[var(--primary)]">
          <FilePlus className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-[18px] font-semibold leading-snug">Expected data format</h2>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--muted-foreground)]">
            One row per rule, one column per attribute. Only{" "}
            <code className="rounded-[5px] bg-[var(--muted)] px-1.5 py-0.5 font-mono text-[12px] text-[var(--secondary-foreground)]">
              guideline_text
            </code>{" "}
            is required — the rest help the algorithm scope each rule. A file with mixed
            or unlabeled columns can&apos;t be classified, so keep these headers exactly.
          </p>
        </div>
      </div>

      {/* two columns: header reference + example */}
      <div className="grid grid-cols-1 gap-x-10 gap-y-7 px-7 py-7 lg:grid-cols-[1fr_1fr]">
        {/* column reference */}
        <div>
          <div className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
            Columns
          </div>
          <ul className="space-y-2.5">
            {COLUMNS.map((c) => (
              <li key={c.key} className="flex items-start gap-3">
                <code className="mt-0.5 shrink-0 rounded-[6px] bg-[var(--muted)] px-1.5 py-0.5 font-mono text-[11.5px] font-medium text-[var(--secondary-foreground)]">
                  {c.key}
                </code>
                <span className="min-w-0 text-[12.5px] leading-snug text-[var(--muted-foreground)]">
                  {c.desc}
                  {c.required ? (
                    <span className="ml-1.5 rounded-full bg-[var(--primary)]/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-[var(--primary)]">
                      required
                    </span>
                  ) : (
                    <span className="ml-1.5 text-[11px] text-[var(--muted-foreground)]/60">optional</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* example sheet */}
        <div>
          <div className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
            Example
          </div>
          <div className="overflow-hidden rounded-[12px] border border-[var(--border)]">
            <table className="w-full border-collapse text-left font-mono text-[11px]">
              <thead>
                <tr className="bg-[var(--muted)] text-[var(--muted-foreground)]">
                  <th className="px-2.5 py-2 font-medium">guideline_text</th>
                  <th className="px-2.5 py-2 font-medium">target_locale</th>
                  <th className="px-2.5 py-2 font-medium">generation_type</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Never abbreviate the brand name", "fr-FR", "must"],
                  ["Prefer the present tense", "fr-FR", "should"],
                  ["Avoid exclamation marks", "en-US", "may"],
                ].map((row) => (
                  <tr key={row[0]} className="border-t border-[var(--border)]">
                    <td className="px-2.5 py-2">{row[0]}</td>
                    <td className="px-2.5 py-2 text-[var(--muted-foreground)]">{row[1]}</td>
                    <td className="px-2.5 py-2 text-[var(--muted-foreground)]">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[12px] text-[var(--muted-foreground)]">
            <Check className="h-3.5 w-3.5 text-[var(--primary)]" />
            One sheet, headers on the first row. Extra columns are ignored.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Review — shown after a file is parsed
───────────────────────────────────────── */

function Review({
  parsed,
  name,
  onName,
  onSave,
}: {
  parsed: Parsed;
  name: string;
  onName: (v: string) => void;
  onSave: (input: { name: string; rows: RawRule[]; source: string }, start: boolean) => void;
}) {
  const { graph, facets } = useMemo(() => {
    const g = ingest(parsed.rows);
    return { graph: g, facets: computeFacets(g) as Facets };
  }, [parsed]);

  const previewCtx: GenerationContext = useMemo(
    () => (parsed.source === "Échantillon" ? DEMO_CONTEXT : seedContextFromFacets(facets)),
    [parsed.source, facets],
  );
  const resolved = useMemo(() => resolve(graph.rules, previewCtx), [graph, previewCtx]);

  const conflicts = graph.edges.filter((e) => e.type === "conflicts-with").length;
  const color = colorForName(name);
  const monogram = monogramForName(name || "?");
  const input = { name, rows: parsed.rows, source: parsed.source };

  const grouped = TYPE_ORDER.map((ct) => ({
    ct,
    rules: graph.rules.filter((r) => r.constraintType === ct),
  })).filter((g) => g.rules.length > 0);

  return (
    <>
      {/* banner: name + meta + save */}
      <div className="flex flex-wrap items-center gap-3.5 rounded-[16px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)]">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] font-mono text-[14px] font-semibold text-white"
          style={{ background: color }}
        >
          {monogram}
        </span>
        <div className="min-w-0">
          <input
            value={name}
            onChange={(e) => onName(e.target.value)}
            aria-label="Model name"
            className="w-[230px] max-w-full rounded-[9px] border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 text-[14px] font-semibold outline-none focus-visible:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]/30"
          />
          <div className="mt-1 text-[12px] tabular-nums text-[var(--muted-foreground)]">
            {graph.rules.length} extracted rules · {facets.locale.length} locale
            {facets.locale.length > 1 ? "s" : ""} · {conflicts} conflict{conflicts > 1 ? "s" : ""}{" "}
            detected · source: {parsed.source}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onSave(input, true)}
            className="rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-[14px] font-medium transition hover:bg-[var(--muted)]"
          >
            Save + start
          </button>
          <button
            type="button"
            onClick={() => onSave(input, false)}
            className="rounded-full bg-[var(--primary)] px-5 py-2.5 text-[14px] font-medium text-[var(--primary-foreground)] shadow-[var(--shadow-sm)] transition hover:opacity-90"
          >
            Save model
          </button>
        </div>
      </div>

      {/* two-pane review */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_380px]">
        {/* left: classified rules */}
        <div className="overflow-hidden rounded-[16px] border border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-3.5 py-3 text-[12px] font-semibold">
            Extracted &amp; classified rules
            <span className="ml-auto font-mono text-[11px] text-[var(--muted-foreground)]">
              {graph.rules.length}
            </span>
          </div>
          <div className="max-h-[460px] overflow-y-auto px-3.5 pb-3.5">
            {grouped.map((g) => (
              <div key={g.ct}>
                <div className="pb-1 pt-3.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
                  {CONSTRAINT_LABEL[g.ct].label}
                </div>
                {g.rules.map((r) => (
                  <div key={r.localId} className="flex gap-2.5 border-b border-[var(--border)] py-2.5 last:border-0">
                    <span className="mt-0.5 shrink-0 font-mono text-[11px] text-[var(--muted-foreground)]">
                      #{r.localId}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 text-[13px] font-medium">
                        {r.name}
                        <span
                          className="rounded-[5px] px-1.5 py-0.5 font-mono text-[10px] font-medium"
                          style={{
                            color: CONSTRAINT_LABEL[r.constraintType].color,
                            background: "var(--muted)",
                          }}
                        >
                          {r.constraintType}
                        </span>
                        {!r.overridable && (
                          <span className="rounded-full bg-[var(--primary)]/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-[var(--primary)]">
                            baseline
                          </span>
                        )}
                      </div>
                      {r.classifierReason && (
                        <div className="mt-1 text-[11.5px] leading-snug text-[var(--muted-foreground)]">
                          {r.classifierReason}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* right: graph + conflicts */}
        <div className="overflow-hidden rounded-[16px] border border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-3.5 py-3 text-[12px] font-semibold">
            Graphe
            <span className="ml-auto font-mono text-[11px] text-[var(--muted-foreground)]">
              3 views
            </span>
          </div>
          <div className="max-h-[460px] overflow-y-auto px-3.5 py-3.5">
            <GraphTab graph={graph} resolved={resolved} onRule={() => {}} />
            <p className="mt-2 text-[10.5px] text-[var(--muted-foreground)]">
              Preview for a default context — adjustable in session.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-[6px] bg-[var(--muted)] px-1.5 py-0.5 font-mono text-[10.5px] font-medium text-[var(--secondary-foreground)]">
      {children}
    </span>
  );
}

function deriveName(source: string): string {
  if (source === "Échantillon") return "Maison Lumière";
  return (
    source
      .replace(/\.[^.]+$/, "")
      .replace(/[_-]+/g, " ")
      .replace(/\s*\(\d+\)\s*$/, "")
      .trim() || "New model"
  );
}
