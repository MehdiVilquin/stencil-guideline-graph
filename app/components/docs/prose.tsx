"use client";

// Prose primitives for the documentation page. All styled with our DS tokens
// (app/globals.css). The docs accent is the warm hub "03" hue.

import { useState } from "react";
import { Copy, Check, ChevronRight } from "../icons";

export const DOCS_ACCENT = "oklch(0.60 0.14 75)";

/* ── section wrappers (anchored) ───────────────────────────── */

export function Section({
  id,
  title,
  kicker,
  children,
}: {
  id: string;
  title: string;
  kicker?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 pb-16">
      {kicker && (
        <p
          className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: DOCS_ACCENT }}
        >
          {kicker}
        </p>
      )}
      <h2 className="group flex items-center gap-2 text-[30px] font-bold tracking-[-0.025em] text-[var(--foreground)]">
        <a href={`#${id}`} className="hover:underline">
          {title}
        </a>
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function Sub({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-24 pt-10 first:pt-0">
      <h3 className="group mb-3 flex items-center gap-2 text-[19px] font-semibold tracking-[-0.01em] text-[var(--foreground)]">
        <a href={`#${id}`} className="hover:underline">
          {title}
        </a>
      </h3>
      {children}
    </div>
  );
}

/* ── text ──────────────────────────────────────────────────── */

export function Lead({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[16px] leading-relaxed text-[var(--muted-foreground)]">{children}</p>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3.5 text-[14.5px] leading-[1.7] text-[var(--card-foreground)]">{children}</p>
  );
}

export function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="mt-3.5 space-y-2">{children}</ul>;
}

export function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5 text-[14.5px] leading-[1.65] text-[var(--card-foreground)]">
      <span className="mt-1 shrink-0" style={{ color: DOCS_ACCENT }}>
        <ChevronRight className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0">{children}</span>
    </li>
  );
}

/** inline code */
export function C({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-[5px] bg-[var(--muted)] px-1.5 py-0.5 font-mono text-[12.5px] text-[var(--secondary-foreground)]">
      {children}
    </code>
  );
}

/* ── analogy callout (the .md metaphors) ───────────────────── */

export function Analogy({ children, label = "Analogy" }: { children: React.ReactNode; label?: string }) {
  return (
    <div
      className="mt-5 rounded-r-[12px] rounded-l-[4px] border-l-[3px] bg-[oklch(0.60_0.14_75_/_0.06)] px-4 py-3.5"
      style={{ borderColor: DOCS_ACCENT }}
    >
      <p
        className="mb-1.5 flex items-center gap-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em]"
        style={{ color: DOCS_ACCENT }}
      >
        <span aria-hidden>🧠</span> {label}
      </p>
      <div className="text-[14px] leading-[1.65] text-[var(--card-foreground)]">{children}</div>
    </div>
  );
}

/* ── code block (real snippets) ────────────────────────────── */

export function CodeBlock({
  code,
  lang = "ts",
  caption,
}: {
  code: string;
  lang?: string;
  caption?: string;
}) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <figure className="mt-5 overflow-hidden rounded-[12px] border border-[var(--border)] bg-[oklch(0.18_0.01_265)]">
      <div className="flex items-center gap-2 border-b border-white/10 px-3.5 py-2">
        <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.1em] text-white/40">
          {lang}
        </span>
        {caption && <span className="truncate text-[11.5px] text-white/45">{caption}</span>}
        <button
          type="button"
          onClick={onCopy}
          aria-label="Copy code"
          className="ml-auto flex items-center gap-1 rounded-[7px] px-2 py-1 text-[11px] text-white/55 transition hover:bg-white/10 hover:text-white/80"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3.5 text-[12.5px] leading-[1.6]">
        <code className="font-mono text-[oklch(0.92_0.01_265)]">{code}</code>
      </pre>
    </figure>
  );
}

/* ── figure wrapper for embedded visuals ───────────────────── */

export function Figure({ caption, children }: { caption?: string; children: React.ReactNode }) {
  return (
    <figure className="mt-5 overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
      <div className="p-4">{children}</div>
      {caption && (
        <figcaption className="border-t border-[var(--border)] bg-[var(--muted)] px-4 py-2 text-[11.5px] text-[var(--muted-foreground)]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/* ── data table ────────────────────────────────────────────── */

export function DataTable({
  head,
  rows,
}: {
  head: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="mt-5 overflow-x-auto rounded-[12px] border border-[var(--border)]">
      <table className="w-full border-collapse text-left text-[13px]">
        <thead>
          <tr className="bg-[var(--muted)] text-[var(--muted-foreground)]">
            {head.map((h) => (
              <th key={h} className="px-3.5 py-2.5 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-[var(--border)] align-top">
              {r.map((cell, j) => (
                <td key={j} className="px-3.5 py-2.5 leading-snug text-[var(--card-foreground)]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── note / key-point box ──────────────────────────────────── */

export function Note({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "warn" }) {
  const color = tone === "warn" ? "var(--destructive)" : "var(--primary)";
  return (
    <div
      className="mt-5 rounded-[10px] border px-4 py-3 text-[13.5px] leading-[1.6] text-[var(--card-foreground)]"
      style={{ borderColor: `color-mix(in oklch, ${color} 30%, transparent)`, background: `color-mix(in oklch, ${color} 6%, transparent)` }}
    >
      {children}
    </div>
  );
}
