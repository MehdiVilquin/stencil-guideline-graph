"use client";

// The atelier — one open Session. Extracted from the old page.tsx so the shell
// can host many sessions. Everything domain runs on the ACTIVE model: resolution
// and doctrine are computed client-side from `graph`; drafting posts to
// /api/generate WITH `rows: model.rows` so the uploaded model (not the bundled
// default) drives generation + the deterministic proof.

import { useMemo, useRef, useState } from "react";
import { resolve } from "@/lib/domain/precedence";
import { compileDoctrine } from "@/lib/domain/doctrine";
import type { GenerationContext, ResolveResult, RuleGraph } from "@/lib/domain/types";
import {
  type Turn,
  type Mode,
  type Tab,
  type Facets,
  type Model,
  type Session,
  ctxLabel,
} from "../types";
import { proofStats } from "@/lib/ui/proof";
import Feed from "../Feed";
import Composer from "../Composer";
import ContextBar from "../ContextBar";
import Nav from "../Nav";
import RulebookView from "../inspector/RulebookView";
import GraphTab from "../graph/GraphTab";
import DoctrineDoc from "../doctrine/DoctrineDoc";
import RuleGraphSVG from "../RuleGraphSVG";

const KIND_BADGE: Record<Mode, { label: string; cls: string }> = {
  write: { label: "Create", cls: "bg-[var(--badge-create-bg)] text-[var(--badge-create-fg)]" },
  rewrite: { label: "Correct", cls: "bg-[var(--badge-correct-bg)] text-[var(--badge-correct-fg)]" },
};

export default function SessionView({
  session,
  model,
  graph,
  facets,
  onUpdateSession,
}: {
  session: Session;
  model: Model;
  graph: RuleGraph;
  facets: Facets;
  onUpdateSession: (patch: Partial<Pick<Session, "ctx" | "turns" | "title">>) => void;
}) {
  const [ctx, setCtx] = useState<GenerationContext>(session.ctx);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>("rewrite");
  const [turns, setTurns] = useState<Turn[]>(session.turns);
  const [busy, setBusy] = useState<Mode | null>(null);
  const [busyWand, setBusyWand] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>("inspector");
  const [doctrineSub, setDoctrineSub] = useState<"list" | "graph">("list");
  const [doctrineTarget, setDoctrineTarget] = useState<{ id: string; key: number } | null>(null);
  const [selectedTurnId, setSelectedTurnId] = useState<number | null>(
    session.turns.length ? session.turns[session.turns.length - 1].id : null,
  );

  const turnId = useRef(session.turns.reduce((m, t) => Math.max(m, t.id), 0));
  const jumpRef = useRef(0);
  const ctrlRef = useRef<AbortController | null>(null);

  // Engine is pure TS → resolution runs CLIENT-SIDE, instantly, on the model.
  const resolved: ResolveResult = useMemo(() => resolve(graph.rules, ctx), [graph, ctx]);
  // Doctrine of THIS model — compiled client-side (no /api/doctrine round-trip).
  const doctrineMd = useMemo(() => compileDoctrine(graph), [graph]);

  const selectedTurn = useMemo(
    () => turns.find((t) => t.id === selectedTurnId) ?? turns[turns.length - 1] ?? null,
    [turns, selectedTurnId],
  );
  const selIndex = selectedTurn ? turns.findIndex((t) => t.id === selectedTurn.id) : -1;

  const run = async (kind: Mode) => {
    if (!text.trim() || busy) return;
    setBusy(kind);
    setNotice(null);
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    const snapActive = resolved.active;
    const snapDecisions = resolved.decisions;
    const input = text;
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          context: ctx,
          mode: kind,
          brief: kind === "write" ? text : "",
          draft: kind === "rewrite" ? text : "",
          rows: model.rows, // ← the ACTIVE model drives generation + proof
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setNotice(d.message ?? "Erreur.");
        return;
      }
      const id = ++turnId.current;
      const next: Turn[] = [
        ...turns,
        { id, kind, contextLabel: ctxLabel(ctx), input, result: d, active: snapActive, decisions: snapDecisions },
      ];
      setTurns(next);
      onUpdateSession({ turns: next });
      setSelectedTurnId(id);
      setTab("inspector");
      if (d.copy) setText(d.copy);
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
      setNotice(String(e));
    } finally {
      setBusy(null);
      ctrlRef.current = null;
    }
  };

  const stop = () => {
    ctrlRef.current?.abort();
    setBusy(null);
  };

  const wand = async () => {
    if (busyWand) return;
    setBusyWand(true);
    setNotice(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ context: ctx, mode: "sabotage", rows: model.rows }),
      });
      const d = await res.json();
      if (!res.ok) {
        setNotice(d.message ?? "Erreur.");
        return;
      }
      setText(d.copy ?? "");
      setMode("rewrite");
    } catch (e) {
      setNotice(String(e));
    } finally {
      setBusyWand(false);
    }
  };

  const setDim = (k: keyof GenerationContext, v: string) => {
    setCtx((c) => {
      const next = { ...c, [k]: v };
      onUpdateSession({ ctx: next });
      return next;
    });
  };

  const openTurn = (id: number) => {
    setSelectedTurnId(id);
    setTab("inspector");
  };
  /** Jump to a rule's description in the Doctrine tab (scroll + highlight). */
  const goToRule = (localId: string) => {
    setTab("doctrine");
    setDoctrineSub("list");
    setDoctrineTarget({ id: localId, key: ++jumpRef.current });
  };

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 divide-y divide-[var(--border)] overflow-hidden lg:grid-cols-[1fr_0.9fr] lg:divide-x lg:divide-y-0">
      {/* LEFT — atelier */}
      <section className="flex min-h-[70vh] flex-col overflow-hidden bg-[var(--surface-feed)] lg:min-h-0">
        <SessionHead model={model} session={session} />
        <div className="mx-auto flex min-h-0 w-full max-w-[840px] flex-1 flex-col">
          <Feed turns={turns} selectedId={selectedTurn?.id ?? null} onSelect={openTurn} />
        </div>
        <div className="mx-auto w-full max-w-[840px] shrink-0 px-3 pt-2">
          <ContextBar ctx={ctx} facets={facets} onDim={setDim} />
        </div>
        <div className="mx-auto w-full max-w-[840px]">
          <Composer
          text={text}
          mode={mode}
          busy={busy}
          busyWand={busyWand}
          notice={notice}
          resolved={resolved}
          onMode={setMode}
          onText={setText}
          onRun={run}
          onStop={stop}
          onWand={wand}
        />
        </div>
      </section>

      {/* RIGHT — inspector / graph / archive / doctrine */}
      <section className="flex min-h-[70vh] flex-col overflow-hidden bg-[var(--card)] lg:min-h-0">
        <Nav
          tab={tab}
          onTab={setTab}
          canPrev={selIndex > 0}
          canNext={selIndex >= 0 && selIndex < turns.length - 1}
          onPrev={() => selIndex > 0 && setSelectedTurnId(turns[selIndex - 1].id)}
          onNext={() => selIndex < turns.length - 1 && setSelectedTurnId(turns[selIndex + 1].id)}
        />
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mx-auto w-full max-w-[860px]">
            {tab === "inspector" && <RulebookView turn={selectedTurn} resolved={resolved} onRule={goToRule} />}
            {tab === "graph" && <GraphTab graph={graph} resolved={resolved} onRule={goToRule} />}
            {tab === "archive" && <ArchiveView turns={turns} onOpen={openTurn} />}
            {tab === "doctrine" && (
              <DoctrineView
                md={doctrineMd}
                graph={graph}
                sub={doctrineSub}
                onSub={setDoctrineSub}
                target={doctrineTarget}
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ───────────────────────── Session header ───────────────────────── */

function SessionHead({ model, session }: { model: Model; session: Session }) {
  return (
    <div className="flex shrink-0 items-center gap-2.5 border-b border-[var(--border)] bg-[var(--card)] px-4 py-2.5">
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] font-mono text-[11px] font-semibold text-white"
        style={{ background: model.color }}
      >
        {model.monogram}
      </span>
      <div className="min-w-0">
        <div className="truncate text-[13px] font-semibold text-[var(--foreground)]">{session.title}</div>
        <div className="truncate text-[11px] text-[var(--muted-foreground)]">{model.name}</div>
      </div>
    </div>
  );
}

/* ───────────────────────── Right: Archive ───────────────────────── */

/** Rich JSON export of every archived turn: settings (6 dims), input/output, applied rules, proof, precedence. */
function archivePayload(turns: Turn[]) {
  return {
    exportedAt: new Date().toISOString(),
    count: turns.length,
    artefacts: turns.map((t) => ({
      id: t.id,
      action: t.kind === "write" ? "Create" : "Correct",
      attempts: t.result.attempts,
      allProvableGreen: t.result.allProvableGreen,
      reglages: {
        brand: t.result.context.brand,
        locale: t.result.context.locale,
        contentType: t.result.context.contentType,
        productCategory: t.result.context.productCategory,
        productType: t.result.context.productType,
        field: t.result.context.field,
      },
      input: t.input,
      output: t.result.copy,
      reglesAppliquees: t.active.map((r) => ({
        localId: r.localId,
        name: r.name,
        text: r.text,
        constraintType: r.constraintType,
        subject: r.subject,
        strength: r.strength,
        overridable: r.overridable,
        scope: r.scope,
      })),
      preuve: t.result.report.map((v) => ({
        localId: v.localId,
        ruleName: v.ruleName,
        constraintType: v.constraintType,
        pass: v.pass,
        verifiable: v.verifiable,
        evidence: v.evidence,
      })),
      precedence: t.decisions
        .filter((d) => d.beat.length > 0)
        .map((d) => ({
          winner: d.winner.localId,
          beat: d.beat.map((b) => ({ rule: b.rule.localId, why: b.why })),
          subject: d.subject,
        })),
      repairHistory: t.result.history ?? null,
    })),
  };
}

function ArchiveView({ turns, onOpen }: { turns: Turn[]; onOpen: (id: number) => void }) {
  const download = () => {
    // Prepend a UTF-8 BOM so editors detect the encoding and don't show mojibake.
    const json = "﻿" + JSON.stringify(archivePayload(turns), null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `archive-${turns.length}-artefacts.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (turns.length === 0) return <Muted>No artifacts yet. Create or correct a copy.</Muted>;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <SectionLabel>
          {turns.length} ARTEFACT{turns.length > 1 ? "S" : ""}
        </SectionLabel>
        <button
          type="button"
          onClick={download}
          title="Download archive as JSON (settings, before/after, applied rules, proof)"
          className="inline-flex items-center gap-1 rounded-[8px] border border-[var(--border)] bg-[var(--card)] px-2.5 py-1 font-mono text-[10px] text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
        >
          ⤓ JSON
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {[...turns].reverse().map((t) => {
          const { provable, greens } = proofStats(t.result.report);
          const badge = KIND_BADGE[t.kind];
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onOpen(t.id)}
              className="rounded-[12px] border border-[var(--border)] bg-[var(--card)] p-3 text-left transition hover:border-black/15"
            >
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] tracking-wider ${badge.cls}`}>
                  {badge.label}
                </span>
                <span className="font-mono text-[10px] text-[var(--muted-foreground)]">{t.contextLabel}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <div className="mb-0.5 font-mono text-[9px] uppercase text-[var(--muted-foreground)]">Before</div>
                  <p className="line-clamp-3 text-[var(--muted-foreground)] line-through decoration-[var(--destructive)]/40">
                    {t.input}
                  </p>
                </div>
                <div>
                  <div className="mb-0.5 font-mono text-[9px] uppercase text-[var(--muted-foreground)]">After</div>
                  <p className="line-clamp-3 text-[var(--foreground)]">{t.result.copy}</p>
                </div>
              </div>
              <div className="mt-1.5 font-mono text-[10px] text-[var(--ok)]">
                {greens}/{provable} proven
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── Right: Doctrine ───────────────────────── */

function DoctrineView({
  md,
  graph,
  sub,
  onSub,
  target,
}: {
  md: string;
  graph: RuleGraph;
  sub: "list" | "graph";
  onSub: (s: "list" | "graph") => void;
  target: { id: string; key: number } | null;
}) {
  const download = () => {
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "doctrine.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-3 flex items-center gap-1">
        {(["list", "graph"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSub(s)}
            aria-pressed={sub === s ? "true" : "false"}
            className={`rounded-[8px] px-3 py-1 text-[12px] font-medium transition ${
              sub === s
                ? "bg-[var(--foreground)] text-[var(--background)]"
                : "border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            {s === "list" ? "List" : "Graph"}
          </button>
        ))}
        {sub === "list" && (
          <button
            type="button"
            onClick={download}
            className="ml-auto rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-[12px] hover:bg-[var(--muted)]"
          >
            Download .md
          </button>
        )}
      </div>

      {sub === "list" ? (
        <DoctrineDoc graph={graph} target={target} />
      ) : (
        <RuleGraphSVG nodes={graph.rules.map((r) => ({ rule: r, status: "neutral" }))} edges={graph.edges} />
      )}
    </div>
  );
}

/* ───────────────────────── shared bits ───────────────────────── */

function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`font-mono text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] ${className}`}>
      {children}
    </div>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-[var(--muted-foreground)]">{children}</div>;
}
