"use client";

// Deck-only diagrams for /pitch. On-palette (Apple DS tokens), restrained.
// Pure SVG + minimal text. Real data (resolved graph, verdicts) is computed in
// page.tsx at module scope and passed in as props. PipelineFlow is animated
// (CSS + a small interval), gated by prefers-reduced-motion.

import { Fragment, useEffect, useState } from "react";
import type { Decision, Verdict } from "@/lib/domain/types";
import { Shield, Sliders, Sparkle, Check } from "@/app/components/icons";

/* ── tiny shared atoms ─────────────────────────────────────────────────── */

function StatusMark({ kind }: { kind: "pass" | "fail" | "judged" }) {
  const cls = kind === "pass" ? "text-[var(--ok)]" : kind === "fail" ? "text-[var(--destructive)]" : "text-[var(--judged)]";
  const glyph = kind === "pass" ? "✓" : kind === "fail" ? "✗" : "◐";
  return <span className={`font-mono text-[13px] font-bold leading-none ${cls}`} aria-hidden>{glyph}</span>;
}

/* ── 02 · Hook motif ───────────────────────────────────────────────────── */

export function HookMotif() {
  return (
    <svg width="100%" viewBox="0 0 320 96" fill="none" aria-hidden className="max-w-[340px]">
      <circle cx="48" cy="48" r="20" stroke="var(--muted-foreground)" strokeWidth="1.2" fill="var(--card)" opacity="0.5" />
      <circle cx="160" cy="48" r="22" stroke="var(--judged)" strokeWidth="1.4" strokeDasharray="4 3" fill="oklch(0.68 0.12 75/0.07)" />
      <circle cx="272" cy="48" r="20" stroke="var(--muted-foreground)" strokeWidth="1.2" fill="var(--card)" opacity="0.5" />
      <line x1="68" y1="48" x2="138" y2="48" stroke="var(--border)" strokeWidth="1.2" />
      <line x1="182" y1="48" x2="252" y2="48" stroke="var(--border)" strokeWidth="1.2" />
      <text x="160" y="92" textAnchor="middle" fontSize="9" fill="var(--judged)" fontFamily="var(--font-mono)" letterSpacing="0.12em">
        ? — {""}IRRÉSOLU
      </text>
    </svg>
  );
}

/* ── 04 · Probability vs Proof ────────────────────────────────────────── */

export function ProbabilityVsProof({ isEn }: { isEn: boolean }) {
  const ghosts = isEn
    ? ["maybe compliant…", "probably on-brand…", "looks okay-ish…"]
    : ["peut-être conforme…", "probablement on-brand…", "ça a l'air ok…"];
  return (
    <div className="grid w-full max-w-[640px] grid-cols-2 gap-4">
      <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] p-5">
        <p className="d-kicker text-[var(--destructive)]">{isEn ? "PROBABILISTIC" : "PROBABILISTE"}</p>
        <div className="relative mt-4 h-[120px]">
          {ghosts.map((g, i) => (
            <p key={g} className="d-mono absolute left-0 text-[var(--muted-foreground)]" style={{ top: `${i * 26 + 8}px`, opacity: 0.35 + i * 0.18 }}>{g}</p>
          ))}
          <p className="d-mono absolute bottom-0 right-0 text-[var(--destructive)]">✗ {isEn ? "not auditable" : "non auditable"}</p>
        </div>
      </div>
      <div className="rounded-[var(--radius-sm)] border border-[var(--ok)] bg-[oklch(0.58_0.13_155/0.05)] p-5">
        <p className="d-kicker text-[var(--ok)]">{isEn ? "DETERMINISTIC PROOF" : "PREUVE DÉTERMINISTE"}</p>
        <ul className="mt-4 flex flex-col gap-2.5">
          {[
            { k: "pass", t: isEn ? "rule #21 — title ≤ 80 chars" : "règle #21 — titre ≤ 80 car." },
            { k: "pass", t: isEn ? "rule #04 — no « anti-aging »" : "règle #04 — pas d'« anti-aging »" },
            { k: "judged", t: isEn ? "rule #03 — poetic tone (judged)" : "règle #03 — ton poétique (jugé)" },
          ].map((r) => (
            <li key={r.t} className="d-mono flex items-center gap-2.5 text-[var(--foreground)]">
              <StatusMark kind={r.k as "pass" | "judged"} />
              {r.t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ── 07 · Scope lattice ────────────────────────────────────────────────── */

const SCOPE_AXES = [
  { label: "brand" }, { label: "locale" }, { label: "content" },
  { label: "category" }, { label: "type" }, { label: "field" },
];

export function ScopeLattice() {
  const R = 132, cx = 175, cy = 165;
  const pt = (i: number, r = R) => {
    const a = (-90 + i * 60) * (Math.PI / 180);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };
  const poly = (f: number) => SCOPE_AXES.map((_, i) => { const p = pt(i, R * f); return `${p.x},${p.y}`; }).join(" ");
  return (
    <svg width="100%" viewBox="0 0 350 330" fill="none" aria-hidden className="mx-auto max-w-[360px]">
      {[0.33, 0.66, 1].map((f) => <polygon key={f} points={poly(f)} stroke="var(--border)" strokeWidth="1" fill="none" />)}
      {SCOPE_AXES.map((_, i) => { const v = pt(i); return <line key={i} x1={cx} y1={cy} x2={v.x} y2={v.y} stroke="var(--border)" strokeWidth="1" />; })}
      <polygon
        points={[pt(0, R * 0.4), pt(1, R * 0.9), pt(2, R * 0.3), pt(3, R * 0.85), pt(4, R * 0.75), pt(5, R * 0.9)].map((p) => `${p.x},${p.y}`).join(" ")}
        fill="oklch(0.56 0.2 257/0.10)" stroke="var(--primary)" strokeWidth="1.5"
      />
      {SCOPE_AXES.map((a, i) => { const l = pt(i, R + 22); return <text key={a.label} x={l.x} y={l.y} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="var(--muted-foreground)" fontFamily="var(--font-mono)">{a.label}</text>; })}
      <circle cx={cx} cy={cy} r="26" fill="var(--primary)" opacity="0.1" stroke="var(--primary)" strokeWidth="1.5" />
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--primary)" fontFamily="var(--font-mono)">Rule</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8" fill="var(--muted-foreground)" fontFamily="var(--font-mono)">specificity 4/6</text>
    </svg>
  );
}

/* ── 06 · Pipeline flow — ANIMATED (Parse → Graph → Resolve → Prove) ──── */

function StageIcon({ name, color }: { name: string; color: string }) {
  const p = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "file") return <svg {...p}><path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" /><path d="M13 3v4a2 2 0 0 0 2 2h4" /></svg>;
  if (name === "nodes") return <svg {...p}><circle cx="6" cy="7" r="2" /><circle cx="18" cy="9" r="2" /><circle cx="9" cy="18" r="2" /><path d="M8 7.6 16 8.6M8.6 16 9.6 11M16.4 11 10.6 16.4" /></svg>;
  if (name === "scale") return <svg {...p}><path d="M12 4v16M6 9h12M6 9l-3 6a3 3 0 0 0 6 0zM18 9l3 6a3 3 0 0 1-6 0z" /></svg>;
  return <svg {...p}><path d="M5 13l4 4L19 7" /></svg>;
}

export function PipelineFlow({ isEn }: { isEn: boolean }) {
  const steps = isEn
    ? [{ s: "Parse", d: "xlsx · csv · json", icon: "file" }, { s: "Graph", d: "typed nodes + edges", icon: "nodes" }, { s: "Resolve", d: "precedence engine", icon: "scale" }, { s: "Prove", d: "traceable output", icon: "check" }]
    : [{ s: "Parser", d: "xlsx · csv · json", icon: "file" }, { s: "Graphe", d: "nœuds + arêtes typés", icon: "nodes" }, { s: "Résoudre", d: "moteur de précédence", icon: "scale" }, { s: "Prouver", d: "output traçable", icon: "check" }];

  const [step, setStep] = useState(0);
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const on = () => setReduce(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setStep((s) => (s + 1) % steps.length), 1000);
    return () => clearInterval(id);
  }, [reduce, steps.length]);

  const lit = (i: number) => reduce || step === i;

  return (
    <div className="deck-anim flex w-full max-w-[860px] items-stretch justify-center gap-2">
      {steps.map((st, i) => {
        const on = lit(i);
        return (
          <div key={st.s} className="flex flex-1 items-center gap-2">
            <div
              className="flex flex-1 flex-col items-center gap-2 rounded-[var(--radius-sm)] border px-4 py-4 text-center transition-[background,border-color,opacity] duration-300"
              style={{
                borderColor: on ? "var(--primary)" : "var(--border)",
                background: on ? "oklch(0.56 0.2 257/0.08)" : "var(--card)",
                opacity: on ? 1 : 0.5,
              }}
            >
              <StageIcon name={st.icon} color={on ? "var(--primary)" : "var(--muted-foreground)"} />
              <span className="text-[13px] font-semibold" style={{ color: on ? "var(--foreground)" : "var(--muted-foreground)" }}>{st.s}</span>
              <span className="d-mono text-[var(--muted-foreground)]">{st.d}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="relative h-[2px] w-5 rounded-full" style={{ background: "var(--border)" }}>
                {!reduce && step === i && (
                  <span
                    className="deck-anim absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full"
                    style={{ background: "var(--primary)", animation: "deck-flow 0.9s linear infinite" }}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── 08 · Algorithm — 3 explicit steps (Partition → Gate → Rank) ───────── */

export function AlgoPhases({ applicable, active, invariants, isEn }: { applicable: number; active: number; invariants: number; isEn: boolean }) {
  const phases = isEn
    ? [
        { n: "1", kicker: "PARTITION", title: "Keep in-scope rules", sub: "match the context vector", viz: "scatter", count: applicable, countLabel: "applicable" },
        { n: "2", kicker: "GATE", title: "Lock the invariants", sub: "a non-overridable floor", viz: "shield", count: invariants, countLabel: "invariants" },
        { n: "3", kicker: "RANK", title: "Sort by precedence", sub: "most specific rule wins", viz: "rank", count: active, countLabel: "active" },
      ]
    : [
        { n: "1", kicker: "PARTITION", title: "Garder les règles du périmètre", sub: "selon le vecteur de contexte", viz: "scatter", count: applicable, countLabel: "applicables" },
        { n: "2", kicker: "FILTRE", title: "Verrouiller les invariants", sub: "un plancher non-overridable", viz: "shield", count: invariants, countLabel: "invariants" },
        { n: "3", kicker: "CLASSEMENT", title: "Trier par précédence", sub: "la règle la plus spécifique gagne", viz: "rank", count: active, countLabel: "actives" },
      ];

  return (
    <div className="flex w-full max-w-[880px] items-stretch justify-center gap-2.5">
      {phases.map((ph, i) => (
        <Fragment key={ph.kicker}>
          <div className="flex flex-1 flex-col rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] p-5 text-left">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[13px] font-bold text-[var(--primary-foreground)]">{ph.n}</span>
              <p className="d-kicker text-[var(--primary)]">{ph.kicker}</p>
            </div>
            <p className="mt-3 text-[14px] font-semibold leading-snug text-[var(--foreground)]">{ph.title}</p>
            <p className="d-mono mt-1 text-[var(--muted-foreground)]">{ph.sub}</p>
            <div className="my-4 flex flex-1 items-center justify-center">
              {ph.viz === "scatter" && (
                <div className="grid grid-cols-6 gap-1.5">
                  {Array.from({ length: 24 }).map((_, k) => (
                    <span key={k} className="h-2.5 w-2.5 rounded-full" style={{ background: k < 11 ? "var(--primary)" : "var(--muted)", opacity: k < 11 ? 1 : 0.4 }} />
                  ))}
                </div>
              )}
              {ph.viz === "shield" && (
                <div className="flex flex-col items-center gap-2.5">
                  <Shield className="h-9 w-9 text-[var(--primary)]" />
                  <div className="h-[6px] w-20 rounded-full bg-[var(--primary)]" />
                  <span className="d-mono text-[10px] text-[var(--muted-foreground)]">{isEn ? "the floor" : "le plancher"}</span>
                </div>
              )}
              {ph.viz === "rank" && (
                <div className="flex w-full max-w-[150px] flex-col gap-1.5">
                  {[0, 1, 2].map((k) => (
                    <div key={k} className="flex items-center gap-2">
                      <span className="d-mono w-3 shrink-0 text-[10px] text-[var(--muted-foreground)]">{k + 1}</span>
                      <div className="h-2.5 rounded-full" style={{ width: `${92 - k * 24}%`, background: k === 0 ? "var(--primary)" : "var(--muted)", opacity: k === 0 ? 1 : 0.5 }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="d-mono border-t border-[var(--border)] pt-3 text-[var(--foreground)]">
              <span className="text-[20px] font-bold text-[var(--primary)]">{ph.count}</span> <span className="text-[var(--muted-foreground)]">{ph.countLabel}</span>
            </p>
          </div>
          {i < phases.length - 1 && (
            <div className="flex shrink-0 items-center">
              <span className="font-mono text-[18px] text-[var(--primary)]" aria-hidden>→</span>
            </div>
          )}
        </Fragment>
      ))}
    </div>
  );
}

/* ── 10 · Ingestion mock ──────────────────────────────────────────────── */

export function IngestionMock({ rules, conflicts, isEn }: { rules: number; conflicts: number; isEn: boolean }) {
  return (
    <div className="w-full max-w-[560px] rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[12px] border border-dashed border-[var(--primary)] bg-[oklch(0.56_0.2_257/0.04)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" /><path d="M13 3v4a2 2 0 0 0 2 2h4" /></svg>
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-[var(--foreground)]">{isEn ? "Drop guidelines file" : "Déposer le fichier de guidelines"}</p>
          <p className="d-mono text-[var(--muted-foreground)]">.xlsx · .csv · .json</p>
        </div>
      </div>
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[var(--muted)]"><div className="h-full rounded-full bg-[var(--primary)]" style={{ width: "92%" }} /></div>
      <p className="d-mono mt-2 text-[var(--muted-foreground)]">
        {rules} {isEn ? "rules extracted" : "règles extraites"} · <span className="text-[var(--destructive)]">{conflicts} {isEn ? "conflicts detected" : "conflits détectés"}</span> · {isEn ? "client-side, seconds" : "côté client, secondes"}
      </p>
    </div>
  );
}

/* ── 11 · Resolution panel (real decision: winner vs beaten) ──────────── */

export function ResolutionPanel({ decision, isEn }: { decision: Decision | null; isEn: boolean }) {
  if (!decision) {
    return <p className="d-mono text-[var(--muted-foreground)]">{isEn ? "No active conflict for this context." : "Aucun conflit actif pour ce contexte."}</p>;
  }
  const w = decision.winner;
  return (
    <div className="mt-2 flex w-full flex-col gap-2.5">
      <p className="d-kicker text-[var(--muted-foreground)]">{isEn ? "RING" : "RING"} · {decision.subject}</p>
      <div className="flex items-center gap-4 rounded-[var(--radius-sm)] border border-[var(--ok)] bg-[oklch(0.58_0.13_155/0.06)] px-5 py-3.5">
        <StatusMark kind="pass" />
        <div className="min-w-0 flex-1">
          <p className="d-mono truncate text-[13px] font-semibold text-[var(--foreground)]">#{w.localId} · {w.name}</p>
          <p className="d-mono text-[11px] text-[var(--ok)]">{isEn ? "ACTIVE" : "ACTIVE"} — {decision.reason}</p>
        </div>
      </div>
      {decision.beat.map((b) => (
        <div key={b.rule.localId} className="flex items-center gap-4 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-5 py-3 opacity-70">
          <StatusMark kind="fail" />
          <div className="min-w-0 flex-1">
            <p className="d-mono truncate text-[13px] text-[var(--muted-foreground)] line-through">#{b.rule.localId} · {b.rule.name}</p>
            <p className="d-mono text-[11px] text-[var(--destructive)]">{isEn ? "OVERRIDDEN" : "ÉCARTÉE"} — {b.why}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── 12 · Proof — copy quote + verdict list (split right column) ──────── */

export function CopyQuote({ copy }: { copy: string }) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--ok)] bg-[oklch(0.58_0.13_155/0.05)] px-5 py-3">
      <p className="d-mono text-[var(--foreground)]">“{copy}”</p>
    </div>
  );
}

export function VerdictList({ report, isEn }: { report: Verdict[]; isEn: boolean }) {
  const proven = report.filter((v) => v.verifiable).length;
  const greens = report.filter((v) => v.verifiable && v.pass).length;
  return (
    <div className="flex w-full flex-col">
      <p className="d-kicker mb-2 text-[var(--muted-foreground)]">
        {isEn ? "PROOF TRACE" : "TRACE DE PREUVE"} · {greens}/{proven} {isEn ? "provable green" : "prouvables verts"}
      </p>
      <div className="flex max-h-[600px] min-h-0 flex-col gap-1.5 overflow-y-auto pr-1">
        {report.map((v) => {
          const kind = !v.verifiable ? "judged" : v.pass ? "pass" : "fail";
          const bg = kind === "pass" ? "bg-[oklch(0.58_0.13_155/0.06)]" : kind === "fail" ? "bg-[oklch(0.63_0.2_25/0.06)]" : "bg-[var(--muted)]";
          return (
            <div key={v.localId + v.ruleName} className={`flex items-center gap-3 rounded-[10px] px-4 py-2.5 ${bg}`}>
              <StatusMark kind={kind as "pass" | "fail" | "judged"} />
              <span className="w-14 shrink-0 d-mono text-[12px] font-semibold text-[var(--foreground)]">#{v.localId}</span>
              <span className="min-w-0 flex-1 truncate text-[12px] text-[var(--foreground)]">{v.ruleName}</span>
              <span className="d-mono hidden truncate text-[var(--muted-foreground)] md:block md:max-w-[200px]">{v.evidence}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── 13 · Benefits grid (icon-led) ────────────────────────────────────── */

const BENEFIT_ICONS = [Shield, Sliders, Sparkle, Check];

export function BenefitsGrid({ cols, accent }: { cols: { label: string; desc: string }[]; accent: string }) {
  return (
    <div className="grid w-full max-w-[820px] grid-cols-2 gap-4">
      {cols.map((c, i) => {
        const Icon = BENEFIT_ICONS[i % BENEFIT_ICONS.length];
        return (
          <div key={c.label} className="flex items-start gap-4 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px]" style={{ background: "color-mix(in oklch, " + accent + " 10%, transparent)", color: accent }}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="d-subtitle text-[var(--foreground)]">{c.label}</p>
              <p className="d-body mt-1 text-[var(--muted-foreground)]">{c.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── 17 · Roadmap timeline ────────────────────────────────────────────── */

export function RoadmapTimeline({ items }: { items: { q: string; label: string; desc: string }[] }) {
  return (
    <div className="w-full max-w-[820px]">
      <div className="relative">
        <div className="absolute left-0 right-0 top-[10px] h-px bg-[var(--border)]" />
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
          {items.map((it) => (
            <div key={it.q} className="relative">
              <div className="mb-4 h-[22px] w-[22px] rounded-full border-2 border-[var(--primary)] bg-[var(--background)]" />
              <p className="d-kicker text-[var(--primary)]">{it.q}</p>
              <p className="mt-1 text-[13px] font-semibold text-[var(--foreground)]">{it.label}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-[var(--muted-foreground)]">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
