"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { resolve } from "@/lib/domain/precedence";
import RuleGraphSVG from "./components/RuleGraphSVG";
import type { GenerationContext, ResolveResult, RuleGraph } from "@/lib/domain/types";
import { type Turn, type Mode, type Tab, type Facets, DEMO_CONTEXT, ctxLabel } from "./components/types";
import { proofStats } from "@/lib/ui/proof";
import Feed from "./components/Feed";
import Composer from "./components/Composer";
import ContextBar from "./components/ContextBar";
import Nav from "./components/Nav";
import RulebookView from "./components/inspector/RulebookView";
import GraphTab from "./components/graph/GraphTab";
import DoctrineDoc from "./components/doctrine/DoctrineDoc";

const KIND_BADGE: Record<Mode, { label: string; cls: string }> = {
  write: { label: "Créer", cls: "bg-[var(--badge-create-bg)] text-[var(--badge-create-fg)]" },
  rewrite: { label: "Corriger", cls: "bg-[var(--badge-correct-bg)] text-[var(--badge-correct-fg)]" },
};

export default function Page() {
  const [graph, setGraph] = useState<RuleGraph | null>(null);
  const [facets, setFacets] = useState<Facets | null>(null);
  const [ctx, setCtx] = useState<GenerationContext>(DEMO_CONTEXT);

  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>("rewrite");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState<Mode | null>(null);
  const [busyWand, setBusyWand] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>("inspector");
  const [doctrine, setDoctrine] = useState<string | null>(null);
  const [doctrineSub, setDoctrineSub] = useState<"list" | "graph">("list");
  const [doctrineTarget, setDoctrineTarget] = useState<{ id: string; key: number } | null>(null);
  const [selectedTurnId, setSelectedTurnId] = useState<number | null>(null);

  const turnId = useRef(0);
  const jumpRef = useRef(0);
  const ctrlRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch("/api/graph")
      .then((r) => r.json())
      .then((d) => {
        setGraph(d.graph);
        setFacets(d.facets);
      });
  }, []);

  // Engine is pure TS → resolution runs CLIENT-SIDE, instantly, offline.
  const resolved: ResolveResult | null = useMemo(
    () => (graph ? resolve(graph.rules, ctx) : null),
    [graph, ctx],
  );

  const selectedTurn = useMemo(
    () => turns.find((t) => t.id === selectedTurnId) ?? turns[turns.length - 1] ?? null,
    [turns, selectedTurnId],
  );
  const selIndex = selectedTurn ? turns.findIndex((t) => t.id === selectedTurn.id) : -1;

  const loadDoctrine = async () => {
    if (doctrine) return;
    const d = await fetch("/api/doctrine").then((r) => r.json());
    setDoctrine(d.markdown ?? "");
  };

  const run = async (kind: Mode) => {
    if (!text.trim() || busy) return;
    setBusy(kind);
    setNotice(null);
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    const snapActive = resolved?.active ?? [];
    const snapDecisions = resolved?.decisions ?? [];
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
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setNotice(d.message ?? "Erreur.");
        return;
      }
      const id = ++turnId.current;
      setTurns((t) => [
        ...t,
        { id, kind, contextLabel: ctxLabel(ctx), input, result: d, active: snapActive, decisions: snapDecisions },
      ]);
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
        body: JSON.stringify({ context: ctx, mode: "sabotage" }),
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

  const setDim = (k: keyof GenerationContext, v: string) => setCtx((c) => ({ ...c, [k]: v }));
  const openTurn = (id: number) => {
    setSelectedTurnId(id);
    setTab("inspector");
  };
  /** Jump to a rule's description in the Doctrine tab (scroll + highlight). */
  const goToRule = (localId: string) => {
    setTab("doctrine");
    setDoctrineSub("list");
    loadDoctrine();
    setDoctrineTarget({ id: localId, key: ++jumpRef.current });
  };

  return (
    <div className="mx-auto flex max-w-[1320px] flex-col px-4 py-4 lg:h-dvh lg:overflow-hidden">
      <div className="grid grid-cols-1 divide-y divide-[var(--border)] overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-panel)] lg:min-h-0 lg:flex-1 lg:grid-cols-[1fr_0.9fr] lg:divide-x lg:divide-y-0">
        {/* LEFT — atelier */}
        <section className="flex min-h-[70vh] flex-col overflow-hidden bg-[var(--surface-feed)] lg:min-h-0">
          <Feed turns={turns} selectedId={selectedTurn?.id ?? null} onSelect={openTurn} />
          <div className="shrink-0 px-3 pt-2">
            <ContextBar ctx={ctx} facets={facets} onDim={setDim} />
          </div>
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
        </section>

        {/* RIGHT — inspector / graph / archive / doctrine */}
        <section className="flex min-h-[70vh] flex-col overflow-hidden bg-[var(--card)] lg:min-h-0">
          <Nav
            tab={tab}
            onTab={(t) => {
              setTab(t);
              if (t === "doctrine") loadDoctrine();
            }}
            canPrev={selIndex > 0}
            canNext={selIndex >= 0 && selIndex < turns.length - 1}
            onPrev={() => selIndex > 0 && setSelectedTurnId(turns[selIndex - 1].id)}
            onNext={() => selIndex < turns.length - 1 && setSelectedTurnId(turns[selIndex + 1].id)}
          />
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {tab === "inspector" && (
              <RulebookView turn={selectedTurn} resolved={resolved} onRule={goToRule} />
            )}
            {tab === "graph" && <GraphTab graph={graph} resolved={resolved} onRule={goToRule} />}
            {tab === "archive" && <ArchiveView turns={turns} onOpen={openTurn} />}
            {tab === "doctrine" && (
              <DoctrineView
                md={doctrine}
                graph={graph}
                sub={doctrineSub}
                onSub={setDoctrineSub}
                target={doctrineTarget}
              />
            )}
          </div>
        </section>
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
      action: t.kind === "write" ? "Créer" : "Corriger",
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

  if (turns.length === 0) return <Muted>Aucun artefact encore. Crée ou corrige une copie.</Muted>;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <SectionLabel>
          {turns.length} ARTEFACT{turns.length > 1 ? "S" : ""}
        </SectionLabel>
        <button
          type="button"
          onClick={download}
          title="Télécharger l'archive en JSON (réglages, avant/après, règles appliquées, preuve)"
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
                  <div className="mb-0.5 font-mono text-[9px] uppercase text-[var(--muted-foreground)]">Avant</div>
                  <p className="line-clamp-3 text-[var(--muted-foreground)] line-through decoration-[var(--destructive)]/40">
                    {t.input}
                  </p>
                </div>
                <div>
                  <div className="mb-0.5 font-mono text-[9px] uppercase text-[var(--muted-foreground)]">Après</div>
                  <p className="line-clamp-3 text-[var(--foreground)]">{t.result.copy}</p>
                </div>
              </div>
              <div className="mt-1.5 font-mono text-[10px] text-[var(--ok)]">
                {greens}/{provable} prouvées
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
  md: string | null;
  graph: RuleGraph | null;
  sub: "list" | "graph";
  onSub: (s: "list" | "graph") => void;
  target: { id: string; key: number } | null;
}) {
  const download = () => {
    const blob = new Blob([md ?? ""], { type: "text/markdown" });
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
            {s === "list" ? "Liste" : "Graph"}
          </button>
        ))}
        {sub === "list" && md && (
          <button
            type="button"
            onClick={download}
            className="ml-auto rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-[12px] hover:bg-[var(--muted)]"
          >
            Télécharger .md
          </button>
        )}
      </div>

      {sub === "list" ? (
        graph ? (
          <DoctrineDoc graph={graph} target={target} />
        ) : (
          <Muted>Compilation…</Muted>
        )
      ) : graph ? (
        <RuleGraphSVG nodes={graph.rules.map((r) => ({ rule: r, status: "neutral" }))} edges={graph.edges} />
      ) : (
        <Muted>Chargement…</Muted>
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
