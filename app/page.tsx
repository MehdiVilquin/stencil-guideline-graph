"use client";

import Link from "next/link";

const SAMPLES = [
  {
    id: "northbound",
    label: "Northbound Outfitters",
    sub: "Outdoor retail · provided",
    rules: 33,
    file: "/samples/northbound_guidelines.json",
    accent: "oklch(0.52 0.18 155)",
    accentBg: "oklch(0.52 0.18 155 / 0.07)",
  },
  {
    id: "maison-lumiere",
    label: "Maison Lumière",
    sub: "Luxury beauty · generated",
    rules: 47,
    file: "/samples/maison_lumiere.json",
    accent: "oklch(0.52 0.18 155)",
    accentBg: "oklch(0.52 0.18 155 / 0.07)",
  },
  {
    id: "vertex",
    label: "Vertex Systems",
    sub: "B2B SaaS · generated",
    rules: 20,
    file: "/samples/vertex_systems.json",
    accent: "oklch(0.52 0.18 155)",
    accentBg: "oklch(0.52 0.18 155 / 0.07)",
  },
];

const SPACES = [
  {
    href: "/pitch",
    label: "01",
    title: "Pitch deck",
    sub: "Product presentation",
    desc: "The problem, the thesis, the demo. What Stencil is, why it matters, and what a deterministic brand engine changes for teams working at scale.",
    accent: "oklch(0.56 0.2 257)",
    accentBg: "oklch(0.56 0.2 257 / 0.07)",
    accentBorder: "oklch(0.56 0.2 257 / 0.2)",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
        <rect x="4" y="5" width="20" height="18" rx="3" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 10h12M8 14h8M8 18h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/prototype",
    label: "02",
    title: "Prototype",
    sub: "Stencil — rule engine",
    desc: "Live, client-side. Import a guidelines file, resolve conflicts with the precedence engine, generate brand-compliant copy, inspect every decision.",
    accent: "oklch(0.52 0.18 155)",
    accentBg: "oklch(0.52 0.18 155 / 0.07)",
    accentBorder: "oklch(0.52 0.18 155 / 0.2)",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
        <rect x="4" y="4" width="20" height="20" rx="3" stroke="currentColor" strokeWidth="1.6" />
        <line x1="4" y1="14" x2="10" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="18" y1="14" x2="24" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="14" y1="4" x2="14" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="14" y1="18" x2="14" y2="24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    samples: SAMPLES,
  },
  {
    href: "/docs",
    label: "03",
    title: "Documentation",
    sub: "Model · algorithm · stack",
    desc: "How the rule graph works internally. The parse pipeline, the precedence engine, the constraint types, the API surface, and all the decisions behind them.",
    accent: "oklch(0.60 0.14 75)",
    accentBg: "oklch(0.60 0.14 75 / 0.07)",
    accentBorder: "oklch(0.60 0.14 75 / 0.2)",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
        <path d="M7 4h10l7 7v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M17 4v7h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 14h8M10 18h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function HubPage() {
  return (
    <div className="relative flex min-h-dvh flex-col bg-[var(--background)]">
      {/* subtle grid background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 0.45,
        }}
      />

      <div className="relative z-10 flex min-h-dvh flex-col">
        {/* header */}
        <header className="flex items-center gap-3 px-10 py-8">
          <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-gradient-to-br from-[var(--primary)] to-[oklch(0.5_0.2_290)] text-white shadow-[var(--shadow-sm)]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
              <line x1="3" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="15" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="12" y1="3" x2="12" y2="9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="12" y1="15" x2="12" y2="21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <span className="text-[14px] font-semibold tracking-[-0.01em] text-[var(--foreground)]">
            Stencil
          </span>
          <span className="ml-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-2 py-0.5 font-mono text-[10px] font-medium text-[var(--muted-foreground)]">
            v0.1 · prototype
          </span>
        </header>

        {/* hero */}
        <div className="px-10 pb-10 pt-4">
          <h1 className="max-w-xl text-[36px] font-bold leading-[1.1] tracking-[-0.03em] text-[var(--foreground)]">
            Brand rules,<br />made enforceable.
          </h1>
          <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[var(--muted-foreground)]">
            A deterministic precedence engine that turns a messy guidelines file into a typed rule graph — provable, inspectable, serverless.
          </p>
        </div>

        {/* cards */}
        <div className="flex flex-1 items-stretch gap-5 px-10 pb-12">
          {SPACES.map((s) => {
            const cardInner = (
              <>
                {/* top accent band */}
                <div className="h-1 w-full" style={{ background: s.accent }} />

                <div className="flex flex-1 flex-col p-8">
                  {/* label + icon */}
                  <div className="mb-6 flex items-start justify-between">
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-[14px]"
                      style={{ background: s.accentBg, color: s.accent }}
                    >
                      {s.icon}
                    </span>
                    <span
                      className="font-mono text-[11px] font-semibold tracking-widest"
                      style={{ color: s.accent }}
                    >
                      {s.label}
                    </span>
                  </div>

                  {/* text */}
                  <div className="flex flex-1 flex-col">
                    <p
                      className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
                      style={{ color: s.accent }}
                    >
                      {s.sub}
                    </p>
                    <h2 className="mb-3 text-[24px] font-bold tracking-[-0.02em] text-[var(--foreground)]">
                      {s.title}
                    </h2>
                    <p className="text-[14px] leading-relaxed text-[var(--muted-foreground)]">
                      {s.desc}
                    </p>
                  </div>

                  {/* Sample files — only on Prototype card */}
                  {"samples" in s && s.samples && (
                    <div className="mt-6 flex flex-col gap-2">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                        Sample files
                      </p>
                      {s.samples.map((sample) => (
                        <button
                          key={sample.id}
                          type="button"
                          onClick={() => {
                            const a = document.createElement("a");
                            a.href = sample.file;
                            a.download = sample.file.split("/").pop() ?? sample.id + ".json";
                            a.click();
                          }}
                          className="flex cursor-pointer items-center justify-between rounded-[10px] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-left transition-colors hover:border-[oklch(0.52_0.18_155_/_0.4)] hover:bg-[oklch(0.52_0.18_155_/_0.04)]"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[12px] font-semibold text-[var(--foreground)]">
                              {sample.label}
                            </p>
                            <p className="text-[10px] text-[var(--muted-foreground)]">
                              {sample.sub}
                            </p>
                          </div>
                          <div className="ml-3 flex shrink-0 items-center gap-2">
                            <span className="rounded-full bg-[oklch(0.52_0.18_155_/_0.1)] px-1.5 py-0.5 font-mono text-[10px] font-medium text-[oklch(0.52_0.18_155)]">
                              {sample.rules} rules
                            </span>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-[var(--muted-foreground)]" aria-hidden>
                              <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* CTA */}
                  {"samples" in s && s.samples ? (
                    <Link
                      href={s.href}
                      className="mt-6 inline-flex items-center gap-2 self-start rounded-[10px] px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                      style={{ background: s.accent }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Open →
                    </Link>
                  ) : (
                    <div className="mt-8">
                      <span
                        className="inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-[13px] font-semibold text-white transition-opacity group-hover:opacity-90"
                        style={{ background: s.accent }}
                      >
                        Open →
                      </span>
                    </div>
                  )}
                </div>
              </>
            );

            if ("samples" in s && s.samples) {
              return (
                <div
                  key={s.href}
                  className="group relative flex flex-1 flex-col overflow-hidden rounded-[24px] border bg-[var(--card)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_40px_oklch(0_0_0_/_0.1)]"
                  style={{ borderColor: s.accentBorder }}
                >
                  {cardInner}
                </div>
              );
            }

            return (
              <Link
                key={s.href}
                href={s.href}
                className="group relative flex flex-1 flex-col overflow-hidden rounded-[24px] border bg-[var(--card)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_40px_oklch(0_0_0_/_0.1)]"
                style={{ borderColor: s.accentBorder }}
              >
                {cardInner}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
