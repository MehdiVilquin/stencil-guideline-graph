"use client";

// Hand-authored diagrams for the docs, styled with DS tokens — not images.
//  • PipelineFlow — the end-to-end vertical flow (file → graph → resolve → prove)
//  • ScopeLattice — the Hasse diagram of the scope partial order

import { DOCS_ACCENT } from "./prose";

/* ── pipeline flow ─────────────────────────────────────────── */

const STAGES = [
  { label: ".xlsx / any set", sub: "upload", tone: "muted" },
  { label: "Parse → ScopeVector", sub: "47 typed nodes", tone: "plain" },
  { label: "Classify · build edges", sub: "graph: nodes + edges", tone: "plain" },
  { label: "FROZEN GRAPH", sub: "built once · auditable", tone: "accent" },
  { label: "Resolve (context)", sub: "partition → gate → ranking", tone: "plain" },
  { label: "Active rules + trace", sub: "+ flag_for_human", tone: "plain" },
  { label: "Generate → Verify → Repair", sub: "LLM writes · verifier proves", tone: "primary" },
  { label: "Copy + proof report", sub: "pass/fail per local_id", tone: "ok" },
];

function toneStyle(tone: string): React.CSSProperties {
  switch (tone) {
    case "accent":
      return { borderColor: DOCS_ACCENT, background: "oklch(0.60 0.14 75 / 0.08)" };
    case "primary":
      return { borderColor: "color-mix(in oklch, var(--primary) 40%, transparent)", background: "color-mix(in oklch, var(--primary) 7%, transparent)" };
    case "ok":
      return { borderColor: "color-mix(in oklch, var(--ok) 45%, transparent)", background: "color-mix(in oklch, var(--ok) 8%, transparent)" };
    case "muted":
      return { borderColor: "var(--border)", background: "var(--muted)" };
    default:
      return { borderColor: "var(--border)", background: "var(--card)" };
  }
}

export function PipelineFlow() {
  return (
    <div className="flex flex-col items-center gap-0">
      {STAGES.map((s, i) => (
        <div key={s.label} className="flex w-full max-w-[420px] flex-col items-center">
          <div
            className="flex w-full items-center justify-between gap-3 rounded-[10px] border px-4 py-2.5"
            style={toneStyle(s.tone)}
          >
            <span className="text-[13px] font-semibold text-[var(--foreground)]">{s.label}</span>
            <span className="font-mono text-[10.5px] text-[var(--muted-foreground)]">{s.sub}</span>
          </div>
          {i < STAGES.length - 1 && (
            <span className="my-1 text-[var(--muted-foreground)]" aria-hidden>
              ↓
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── scope lattice (Hasse) ─────────────────────────────────── */

function Node({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "top" | "point" }) {
  const style: React.CSSProperties =
    tone === "top"
      ? { borderColor: DOCS_ACCENT, background: "oklch(0.60 0.14 75 / 0.08)" }
      : tone === "point"
        ? { borderColor: "color-mix(in oklch, var(--primary) 45%, transparent)", background: "color-mix(in oklch, var(--primary) 8%, transparent)" }
        : { borderColor: "var(--border)", background: "var(--card)" };
  return (
    <span
      className="rounded-[8px] border px-2.5 py-1 font-mono text-[11.5px] text-[var(--foreground)]"
      style={style}
    >
      {children}
    </span>
  );
}

export function ScopeLattice() {
  return (
    <div className="flex flex-col items-center gap-2.5 py-2 text-center">
      <Node tone="top">GLOBAL — all wildcards</Node>
      <span className="text-[var(--muted-foreground)]" aria-hidden>
        ╱ │ ╲
      </span>
      <div className="flex flex-wrap justify-center gap-2">
        <Node>locale=de-DE</Node>
        <Node>field=title</Node>
        <Node>category=Skincare</Node>
      </div>
      <span className="text-[var(--muted-foreground)]" aria-hidden>
        ╲ │ ╱
      </span>
      <div className="flex flex-wrap justify-center gap-2">
        <Node>locale=de-DE + field=title</Node>
      </div>
      <span className="text-[var(--muted-foreground)]" aria-hidden>
        │
      </span>
      <Node tone="point">context — a single point at the bottom</Node>
      <p className="mt-1 text-[11.5px] text-[var(--muted-foreground)]">
        More dimensions fixed → lower in the lattice → more specific. The winner is the lowest
        node still applicable to the context.
      </p>
    </div>
  );
}
