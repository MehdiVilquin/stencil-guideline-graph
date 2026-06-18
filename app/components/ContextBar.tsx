"use client";

import { useEffect, useRef, useState } from "react";
import type { GenerationContext } from "@/lib/domain/types";
import type { Facets } from "./types";
import { DIMS, prettyValue } from "./types";
import { ChevronDown, Cross, Sliders } from "./icons";

/** The 6 context dimensions, collapsed behind a single "Filtres" popover. */
export default function ContextBar({
  ctx,
  facets,
  onDim,
}: {
  ctx: GenerationContext;
  facets: Facets | null;
  onDim: (k: keyof GenerationContext, v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const active = DIMS.filter((d) => ctx[d.key] !== d.wildcard);
  const resetAll = () => active.forEach((d) => onDim(d.key, d.wildcard));

  return (
    <div ref={rootRef} className="relative flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] py-1.5 pl-2.5 pr-3 text-[12px] font-medium text-[var(--foreground)] outline-none transition hover:bg-[var(--muted)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]/45"
      >
        <Sliders className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
        Filters
        {active.length > 0 && (
          <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--primary)] px-1 text-[10px] font-semibold leading-none text-[var(--primary-foreground)]">
            {active.length}
          </span>
        )}
      </button>

      {active.map((d) => (
        <span
          key={d.key}
          className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--card)] py-1 pl-2.5 pr-1 text-[12px] font-medium text-[var(--foreground)]"
        >
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="max-w-[160px] truncate outline-none transition hover:text-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]/45"
            title={`${d.label} : ${prettyValue(d.key, ctx[d.key])}`}
          >
            {prettyValue(d.key, ctx[d.key])}
          </button>
          <button
            type="button"
            onClick={() => onDim(d.key, d.wildcard)}
            aria-label={`Remove ${d.label}`}
            className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[var(--muted-foreground)] outline-none transition hover:bg-[var(--muted)] hover:text-[var(--foreground)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]/45"
          >
            <Cross className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}

      {open && (
        <div
          role="dialog"
          aria-label="Filters"
          className="absolute bottom-full left-0 z-20 mb-1.5 w-[320px] rounded-[12px] border border-[var(--border)] bg-[var(--card)] p-3 shadow-[var(--shadow-panel)]"
        >
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[var(--foreground)]">Filters</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={resetAll}
                disabled={active.length === 0}
                className="rounded-full px-2 py-1 text-[11px] font-medium text-[var(--muted-foreground)] outline-none transition hover:bg-[var(--muted)] hover:text-[var(--foreground)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]/45 disabled:pointer-events-none disabled:opacity-40"
              >
                Reset all
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[var(--muted-foreground)] outline-none transition hover:bg-[var(--muted)] hover:text-[var(--foreground)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]/45"
              >
                <Cross className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {DIMS.map((d) => {
              const opts = facets ? [d.wildcard, ...facets[d.key]] : [d.wildcard];
              return (
                <label key={d.key} className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-[var(--muted-foreground)]">
                    {d.label}
                  </span>
                  <span className="relative inline-flex items-center">
                    <select
                      value={ctx[d.key]}
                      onChange={(e) => onDim(d.key, e.target.value)}
                      aria-label={d.label}
                      className="w-full appearance-none rounded-[8px] border border-[var(--border)] bg-[var(--card)] py-1.5 pl-2.5 pr-7 text-[12px] font-medium text-[var(--foreground)] outline-none transition hover:bg-[var(--muted)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]/45"
                    >
                      {opts.map((o) => (
                        <option key={o} value={o}>
                          {prettyValue(d.key, o)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
