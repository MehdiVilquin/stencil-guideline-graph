"use client";

// "New session" — pick a model (last loaded preselected), set the 6-dim context,
// see a LIVE preview of how many rules will apply (resolve() runs client-side on
// the chosen model), then start. The context the user lands on carries into the
// atelier unchanged.

import { useMemo, useState } from "react";
import { resolve } from "@/lib/domain/precedence";
import type { ConstraintType, GenerationContext } from "@/lib/domain/types";
import { DIMS, prettyValue, seedContextFromFacets, type Model } from "../types";
import { DEMO_CONTEXT, ctxLabel } from "../types";
import { fieldLabel, CONSTRAINT_LABEL } from "@/lib/ui/labels";
import { deriveModel } from "@/app/store/library";
import { Check, ChevronDown, Plus } from "../icons";

/** A sensible starting context for a model — the showcase for the sample, else
 *  the first concrete facet value per dimension. */
function seedFor(model: Model): GenerationContext {
  const { facets } = deriveModel(model);
  return model.source === "Échantillon" ? DEMO_CONTEXT : seedContextFromFacets(facets);
}

export default function NewSession({
  models,
  initialModelId,
  onStart,
  onAddModel,
}: {
  models: Model[];
  initialModelId: string | null;
  onStart: (modelId: string, ctx: GenerationContext, title: string) => void;
  onAddModel: () => void;
}) {
  const initial = models.find((m) => m.id === initialModelId) ?? models[0] ?? null;
  const [modelId, setModelId] = useState<string | null>(initial?.id ?? null);
  const model = models.find((m) => m.id === modelId) ?? null;
  const [ctx, setCtx] = useState<GenerationContext>(() => (initial ? seedFor(initial) : DEMO_CONTEXT));

  const { graph, facets } = useMemo(
    () => (model ? deriveModel(model) : { graph: null, facets: null }),
    [model],
  );
  const resolved = useMemo(
    () => (graph ? resolve(graph.rules, ctx) : null),
    [graph, ctx],
  );

  const selectModel = (m: Model) => {
    setModelId(m.id);
    setCtx(seedFor(m));
  };
  const setDim = (k: keyof GenerationContext, v: string) => setCtx((c) => ({ ...c, [k]: v }));

  const start = () => {
    if (!model) return;
    const title = `${ctxLabel(ctx)} · ${fieldLabel(ctx.field)}`;
    onStart(model.id, ctx, title);
  };

  if (models.length === 0) {
    return (
      <div className="grid flex-1 place-items-center p-10 text-center">
        <div>
          <p className="text-[14px] text-[var(--muted-foreground)]">
            No model loaded. Add one to start a session.
          </p>
          <button
            type="button"
            onClick={onAddModel}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2.5 text-[14px] font-medium text-[var(--primary-foreground)] shadow-[var(--shadow-sm)] transition hover:opacity-90"
          >
            <Plus className="h-[15px] w-[15px]" />
            Add data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <ScreenHead title="New session" sub="— choose a model and context" />
      <div className="mx-auto max-w-[880px] px-6 pb-16 pt-7">
        {/* model picker */}
        <SectionTitle>Rule model</SectionTitle>
        <SectionDesc>The most recently loaded model is pre-selected.</SectionDesc>
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {models.map((m, i) => {
            const meta = deriveMeta(m);
            const sel = m.id === modelId;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => selectModel(m)}
                className={`relative rounded-[16px] border-[1.5px] bg-[var(--card)] p-3.5 text-left transition ${
                  sel
                    ? "border-[var(--primary)] shadow-[0_0_0_3px_oklch(0.56_0.2_257_/_0.12)]"
                    : "border-[var(--border)] hover:border-[oklch(0.78_0.06_257)]"
                }`}
              >
                {i === 0 && (
                  <span className="absolute -top-2 left-3.5 rounded-full bg-[var(--foreground)] px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-[var(--background)]">
                    Latest
                  </span>
                )}
                {sel && <Check className="absolute right-3 top-3 h-[18px] w-[18px] text-[var(--primary)]" />}
                <div className="mb-3 flex items-center gap-2.5">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-[8px] font-mono text-[11px] font-semibold text-white"
                    style={{ background: m.color }}
                  >
                    {m.monogram}
                  </span>
                  <span className="text-[13.5px] font-semibold">{m.name}</span>
                </div>
                <div className="text-[11.5px] leading-relaxed text-[var(--muted-foreground)]">
                  {meta.rules} rules · {meta.locales} locale{meta.locales > 1 ? "s" : ""}
                  <br />
                  {meta.conflicts > 0
                    ? `${meta.conflicts} conflict${meta.conflicts > 1 ? "s" : ""} resolved`
                    : "no conflicts"}
                </div>
              </button>
            );
          })}
        </div>

        {/* context */}
        <SectionTitle>Generation context</SectionTitle>
        <SectionDesc>
          Values come from the chosen model. The engine resolves applicable rules in real time.
        </SectionDesc>
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DIMS.map((d) => (
            <Field key={d.key} label={d.label}>
              <Select
                value={ctx[d.key]}
                options={facets ? [d.wildcard, ...facets[d.key]] : [d.wildcard]}
                render={(o) => prettyValue(d.key, o)}
                onChange={(v) => setDim(d.key, v)}
                ariaLabel={d.label}
              />
            </Field>
          ))}
        </div>

        {/* live outcome graph */}
        <ContextOutcome resolved={resolved} />

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={start}
            disabled={!model}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2.5 text-[14px] font-medium text-[var(--primary-foreground)] shadow-[var(--shadow-sm)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/45 disabled:opacity-40"
          >
            Start session →
          </button>
        </div>
      </div>
    </div>
  );
}

const STRENGTH_TIERS = [
  { key: "socle",           label: "Baseline",    color: "var(--primary)" },
  { key: "forbidden",       label: "Forbidden",   color: "var(--destructive)" },
  { key: "hard-rule",       label: "Hard rule",   color: "oklch(0.62 0.18 50)" },
  { key: "conditional",     label: "Conditional", color: "oklch(0.68 0.15 85)" },
  { key: "soft-preference", label: "Preference",  color: "oklch(0.60 0.06 264)" },
] as const;

function ContextOutcome({ resolved }: { resolved: ReturnType<typeof resolve> | null }) {
  if (!resolved) return null;

  const { active, decisions, flagged } = resolved;
  const n = active.length;

  if (n === 0) {
    return (
      <div className="mb-6 rounded-[14px] border border-dashed border-[var(--border)] bg-[var(--muted)]/40 px-4 py-5 text-center">
        <p className="text-[13px] text-[var(--muted-foreground)]">No rules match this context.</p>
      </div>
    );
  }

  const conflicts = decisions.filter((d) => d.beat.length > 0).length;

  const tiers = STRENGTH_TIERS.map((t) => ({
    ...t,
    count:
      t.key === "socle"
        ? active.filter((r) => !r.overridable).length
        : active.filter((r) => r.overridable && r.strength === t.key).length,
  })).filter((t) => t.count > 0);

  const ctMap = new Map<ConstraintType, number>();
  for (const r of active) ctMap.set(r.constraintType, (ctMap.get(r.constraintType) ?? 0) + 1);
  const ctEntries = [...ctMap.entries()].sort((a, b) => b[1] - a[1]);
  const maxCt = Math.max(...ctEntries.map((e) => e[1]));

  return (
    <div className="mb-6 overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--card)]">
      {/* header */}
      <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
        <span className="text-[22px] font-extrabold tabular-nums text-[var(--primary)]">{n}</span>
        <div>
          <p className="text-[12.5px] font-medium text-[var(--foreground)]">rules will apply</p>
          <p className="text-[11px] tabular-nums text-[var(--muted-foreground)]">
            {conflicts} conflict{conflicts !== 1 ? "s" : ""} resolved · {flagged.length} to flag
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2">
        {/* strength breakdown */}
        <div className="border-b border-[var(--border)] px-4 py-3.5 sm:border-b-0 sm:border-r">
          <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            By strength
          </p>
          <div className="mb-2.5 flex h-3.5 w-full overflow-hidden rounded-full bg-[var(--muted)]">
            {tiers.map((t) => (
              <div
                key={t.key}
                style={{ width: `${(t.count / n) * 100}%`, background: t.color, opacity: 0.82 }}
                className="transition-[width] duration-300 ease-in-out"
                title={`${t.label}: ${t.count}`}
              />
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            {tiers.map((t) => (
              <div key={t.key} className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)]">
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ background: t.color, opacity: 0.85 }}
                  />
                  {t.label}
                </span>
                <span className="tabular-nums text-[11px] font-medium text-[var(--foreground)]">{t.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* constraint type breakdown */}
        <div className="px-4 py-3.5">
          <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            By type
          </p>
          <div className="flex flex-col gap-2">
            {ctEntries.map(([ct, count]) => {
              const { label, color } = CONSTRAINT_LABEL[ct];
              return (
                <div key={ct} className="flex items-center gap-2">
                  <span className="w-[76px] shrink-0 text-right text-[10.5px] text-[var(--muted-foreground)]">
                    {label}
                  </span>
                  <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--muted)]">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-300 ease-in-out"
                      style={{ width: `${(count / maxCt) * 100}%`, background: color, opacity: 0.75 }}
                    />
                  </div>
                  <span className="w-4 text-right text-[10.5px] tabular-nums font-medium text-[var(--foreground)]">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function deriveMeta(m: Model) {
  const { graph, facets } = deriveModel(m);
  return {
    rules: graph.rules.length,
    conflicts: graph.edges.filter((e) => e.type === "conflicts-with").length,
    locales: facets.locale.length,
  };
}

/* ── small UI bits (shared look with the app) ── */

export function ScreenHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="sticky top-0 z-[2] flex items-center gap-2 border-b border-[var(--border)] bg-[oklch(1_0_0_/_0.9)] px-6 py-4 backdrop-blur">
      <h1 className="text-[16px] font-semibold tracking-[-0.01em]">{title}</h1>
      {sub && <span className="text-[12.5px] text-[var(--muted-foreground)]">{sub}</span>}
    </div>
  );
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="mb-0.5 text-[13px] font-semibold">{children}</p>;
}
function SectionDesc({ children }: { children: React.ReactNode }) {
  return <p className="mb-3.5 text-[12.5px] text-[var(--muted-foreground)]">{children}</p>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11.5px] font-medium text-[var(--muted-foreground)]">{label}</span>
      {children}
    </label>
  );
}
function Select({
  value,
  options,
  onChange,
  render,
  ariaLabel,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  render: (o: string) => string;
  ariaLabel: string;
}) {
  return (
    <span className="relative inline-flex w-full items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className="w-full appearance-none rounded-[10px] border border-[var(--border)] bg-[var(--card)] py-2.5 pl-3 pr-8 text-[13px] font-medium text-[var(--foreground)] outline-none transition hover:bg-[var(--muted)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]/45"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {render(o)}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
    </span>
  );
}
