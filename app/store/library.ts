"use client";

// Client-side library of Models (ingested guideline sets) and Sessions, persisted
// in localStorage. No backend, no accounts. The graph + facets of a model are
// DERIVED from its raw rows via the pure domain pipeline (ingest/facets), which
// is client-safe — so an uploaded set runs through exactly the same engine as the
// bundled sample. Drafting still goes through /api/generate (LLM is server-only).

import { useCallback, useEffect, useState } from "react";
import { ingest, type RawRule } from "@/lib/domain/ingest";
import { facets as computeFacets } from "@/lib/domain/store";
import { defaultRawRules } from "@/lib/data";
import type { Facets, Model, Session } from "@/app/components/types";
import type { GenerationContext, RuleGraph } from "@/lib/domain/types";

const LS_MODELS = "gg.models.v1";
const LS_SESSIONS = "gg.sessions.v1";

/** Monogram palette — oklch hues in the brand range, restrained. */
const PALETTE = [
  "oklch(0.55 0.16 265)",
  "oklch(0.58 0.13 155)",
  "oklch(0.62 0.15 35)",
  "oklch(0.55 0.16 320)",
  "oklch(0.52 0.11 230)",
  "oklch(0.60 0.14 95)",
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function colorForName(name: string): string {
  return PALETTE[hash(name) % PALETTE.length];
}

export function monogramForName(name: string): string {
  const words = name.trim().split(/[\s·—-]+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase();
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* ── derived graph + facets (memoized per model id; rows are immutable) ── */
const cache = new Map<string, { graph: RuleGraph; facets: Facets }>();

export function deriveModel(model: Model): { graph: RuleGraph; facets: Facets } {
  const hit = cache.get(model.id);
  if (hit) return hit;
  const graph = ingest(model.rows);
  const out = { graph, facets: computeFacets(graph) as Facets };
  cache.set(model.id, out);
  return out;
}

export interface ModelMeta {
  rules: number;
  conflicts: number;
  locales: number;
  brands: number;
}

export function modelMeta(model: Model): ModelMeta {
  const { graph, facets } = deriveModel(model);
  return {
    rules: graph.rules.length,
    conflicts: graph.edges.filter((e) => e.type === "conflicts-with").length,
    locales: facets.locale.length,
    brands: facets.brand.length,
  };
}

/** The bundled Maison Lumière sample, as a model input. */
export function sampleModelInput(): { name: string; rows: RawRule[]; source: string } {
  return { name: "Maison Lumière", rows: defaultRawRules, source: "Échantillon" };
}

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

export interface Library {
  ready: boolean;
  models: Model[];
  sessions: Session[];
  addModel: (input: { name: string; rows: RawRule[]; source: string }) => Model;
  deleteModel: (id: string) => void;
  addSession: (input: { modelId: string; ctx: GenerationContext; title: string }) => Session;
  updateSession: (id: string, patch: Partial<Pick<Session, "ctx" | "turns" | "title">>) => void;
  deleteSession: (id: string) => void;
}

export function useLibrary(): Library {
  const [models, setModels] = useState<Model[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setModels(load<Model>(LS_MODELS));
    setSessions(load<Session>(LS_SESSIONS));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(LS_MODELS, JSON.stringify(models));
  }, [models, ready]);
  useEffect(() => {
    if (ready) localStorage.setItem(LS_SESSIONS, JSON.stringify(sessions));
  }, [sessions, ready]);

  const addModel = useCallback((input: { name: string; rows: RawRule[]; source: string }) => {
    const model: Model = {
      id: uid(),
      name: input.name.trim() || "Modèle sans nom",
      color: colorForName(input.name),
      monogram: monogramForName(input.name),
      source: input.source,
      rows: input.rows,
      createdAt: Date.now(),
    };
    setModels((m) => [model, ...m]);
    return model;
  }, []);

  const deleteModel = useCallback((id: string) => {
    cache.delete(id);
    setModels((m) => m.filter((x) => x.id !== id));
    setSessions((s) => s.filter((x) => x.modelId !== id));
  }, []);

  const addSession = useCallback(
    (input: { modelId: string; ctx: GenerationContext; title: string }) => {
      const now = Date.now();
      const session: Session = {
        id: uid(),
        modelId: input.modelId,
        title: input.title,
        ctx: input.ctx,
        turns: [],
        createdAt: now,
        updatedAt: now,
      };
      setSessions((s) => [session, ...s]);
      return session;
    },
    [],
  );

  const updateSession = useCallback(
    (id: string, patch: Partial<Pick<Session, "ctx" | "turns" | "title">>) => {
      setSessions((s) =>
        s.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: Date.now() } : x)),
      );
    },
    [],
  );

  const deleteSession = useCallback((id: string) => {
    setSessions((s) => s.filter((x) => x.id !== id));
  }, []);

  return { ready, models, sessions, addModel, deleteModel, addSession, updateSession, deleteSession };
}
