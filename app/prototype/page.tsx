"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLibrary, deriveModel, sampleModelInput } from "@/app/store/library";
import { DEMO_CONTEXT, seedContextFromFacets, ctxLabel, type Model } from "@/app/components/types";
import type { GenerationContext } from "@/lib/domain/types";
import type { RawRule } from "@/lib/domain/ingest";
import { fieldLabel } from "@/lib/ui/labels";
import Sidebar from "@/app/components/shell/Sidebar";
import SessionView from "@/app/components/session/SessionView";
import EmptyState from "@/app/components/intake/EmptyState";
import NewSession from "@/app/components/intake/NewSession";
import AddModel from "@/app/components/intake/AddModel";

type View = "session" | "new" | "add" | "empty";

function seedFor(model: Model): GenerationContext {
  const { facets } = deriveModel(model);
  return model.source === "Échantillon" ? DEMO_CONTEXT : seedContextFromFacets(facets);
}

export default function PrototypePage() {
  const lib = useLibrary();
  const router = useRouter();
  const [view, setView] = useState<View>("empty");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [pickModelId, setPickModelId] = useState<string | null>(null);

  useEffect(() => {
    if (!lib.ready) return;
    if (lib.models.length === 0) {
      setView("empty");
    } else if (lib.sessions.length) {
      const last = [...lib.sessions].sort((a, b) => b.updatedAt - a.updatedAt)[0];
      setActiveSessionId(last.id);
      setView("session");
    } else {
      setView("new");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lib.ready]);

  useEffect(() => {
    if (lib.ready && lib.models.length === 0 && view !== "add") setView("empty");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lib.models.length, lib.ready]);

  const activeSession = useMemo(
    () => lib.sessions.find((s) => s.id === activeSessionId) ?? null,
    [lib.sessions, activeSessionId],
  );
  const activeModel = useMemo(
    () => (activeSession ? lib.models.find((m) => m.id === activeSession.modelId) ?? null : null),
    [lib.models, activeSession],
  );
  const derived = useMemo(() => (activeModel ? deriveModel(activeModel) : null), [activeModel]);

  const openNewSession = () => {
    setPickModelId(activeModel?.id ?? lib.models[0]?.id ?? null);
    setView("new");
  };
  const openSession = (id: string) => {
    setActiveSessionId(id);
    setView("session");
  };
  const startSession = (modelId: string, ctx: GenerationContext, title: string) => {
    const s = lib.addSession({ modelId, ctx, title });
    setActiveSessionId(s.id);
    setView("session");
  };
  const deleteSession = (id: string) => {
    lib.deleteSession(id);
    if (id === activeSessionId) {
      const rest = lib.sessions.filter((s) => s.id !== id);
      if (rest.length) openSession([...rest].sort((a, b) => b.updatedAt - a.updatedAt)[0].id);
      else setView(lib.models.length ? "new" : "empty");
    }
  };
  const saveModel = (input: { name: string; rows: RawRule[]; source: string }, start: boolean) => {
    const m = lib.addModel(input);
    if (start) {
      const ctx = seedFor(m);
      startSession(m.id, ctx, `${ctxLabel(ctx)} · ${fieldLabel(ctx.field)}`);
    } else {
      setPickModelId(m.id);
      setView("new");
    }
  };
  const useSample = () => {
    const m = lib.addModel(sampleModelInput());
    setPickModelId(m.id);
    setView("new");
  };

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[var(--card)]">
      <Sidebar
        models={lib.models}
        sessions={lib.sessions}
        activeSessionId={view === "session" ? activeSessionId : null}
        view={view}
        onHome={() => router.push("/")}
        onNewSession={openNewSession}
        onAddModel={() => setView("add")}
        onOpenSession={openSession}
        onDeleteSession={deleteSession}
      />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {view === "session" && activeSession && activeModel && derived ? (
          <SessionView
            key={activeSession.id}
            session={activeSession}
            model={activeModel}
            graph={derived.graph}
            facets={derived.facets}
            onUpdateSession={(patch) => lib.updateSession(activeSession.id, patch)}
          />
        ) : view === "new" ? (
          <NewSession
            models={lib.models}
            initialModelId={pickModelId}
            onStart={startSession}
            onAddModel={() => setView("add")}
          />
        ) : view === "add" ? (
          <AddModel onSave={saveModel} />
        ) : (
          <EmptyState onAddModel={() => setView("add")} onUseSample={useSample} />
        )}
      </main>
    </div>
  );
}
