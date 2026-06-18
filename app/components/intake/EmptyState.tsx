"use client";

// First-run onboarding. The empty state IS the onboarding surface: name what's
// missing, say why, give the one action that fills it. Line-art illustration,
// monochrome tinted with the primary hue.

import { Plus } from "../icons";

export default function EmptyState({
  onAddModel,
  onUseSample,
}: {
  onAddModel: () => void;
  onUseSample: () => void;
}) {
  return (
    <div className="grid flex-1 place-items-center p-10">
      <div className="max-w-[420px] text-center">
        <svg width="190" height="150" viewBox="0 0 190 150" fill="none" className="mx-auto" aria-hidden>
          <g stroke="var(--primary)" strokeWidth="1.6" opacity="0.85" strokeLinecap="round" strokeLinejoin="round">
            <rect x="20" y="26" width="64" height="84" rx="8" fill="oklch(0.56 0.2 257 / 0.04)" />
            <path d="M32 46h40M32 58h40M32 70h26" opacity="0.6" />
            <path d="M88 68h22" strokeDasharray="3 4" />
            <circle cx="138" cy="40" r="11" fill="oklch(0.56 0.2 257 / 0.06)" />
            <circle cx="166" cy="84" r="11" fill="oklch(0.56 0.2 257 / 0.06)" />
            <circle cx="120" cy="104" r="11" fill="oklch(0.56 0.2 257 / 0.06)" />
            <path d="M147 49l12 27M132 99l-3-48M129 100l30-12" opacity="0.5" />
          </g>
        </svg>
        <h2 className="mt-5 text-[20px] font-bold tracking-[-0.02em]">Add your first dataset</h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--muted-foreground)]">
          Drop a guidelines file (.xlsx, .csv, .json). We extract the rules, classify them,
          and build the graph — ready to start a session.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onAddModel}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2.5 text-[14px] font-medium text-[var(--primary-foreground)] shadow-[var(--shadow-sm)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/45"
          >
            <Plus className="h-[15px] w-[15px]" />
            Add data
          </button>
          <button
            type="button"
            onClick={onUseSample}
            className="text-[13px] font-medium text-[var(--primary)] transition hover:underline"
          >
            or try the Maison Lumière sample (47 rules)
          </button>
        </div>
      </div>
    </div>
  );
}
