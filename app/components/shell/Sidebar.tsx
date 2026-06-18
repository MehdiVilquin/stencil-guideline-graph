"use client";

// Left rail — the app's persistent navigation. Lists SESSIONS (workspaces);
// model choice happens at session creation, not here. "Nouvelle session" is the
// primary action; "Ajouter un modèle" is secondary. Sessions group by recency.

import { useState } from "react";
import type { Model, Session } from "../types";
import { Plus, FilePlus, ChevronDown, Trash, Nodes, StencilIcon, Check } from "../icons";

type View = "session" | "new" | "add" | "empty";

export default function Sidebar({
  models,
  sessions,
  activeSessionId,
  view,
  onHome,
  onNewSession,
  onAddModel,
  onOpenSession,
  onDeleteSession,
}: {
  models: Model[];
  sessions: Session[];
  activeSessionId: string | null;
  view: View;
  onHome: () => void;
  onNewSession: () => void;
  onAddModel: () => void;
  onOpenSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const grouped = groupByRecency(sessions);

  if (collapsed) {
    return (
      <aside className="flex w-[60px] shrink-0 flex-col items-center gap-2 border-r border-[var(--border)] bg-[oklch(0.985_0_0)] py-3">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          aria-label="Expand menu"
          className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-gradient-to-br from-[var(--primary)] to-[oklch(0.5_0.2_290)] text-white shadow-[var(--shadow-sm)]"
        >
          <StencilIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onNewSession}
          aria-label="New session"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[var(--shadow-sm)] transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="flex w-[252px] shrink-0 flex-col border-r border-[var(--border)] bg-[oklch(0.985_0_0)]">
      {/* identity */}
      <div className="px-3 pt-3.5">
        <div className="flex items-center gap-2.5 px-1.5 pb-3">
          <button
            type="button"
            onClick={onHome}
            aria-label="Back to home"
            className="-mx-1 flex items-center gap-2.5 rounded-[9px] px-1 py-0.5 transition hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/45"
          >
            <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[8px] bg-gradient-to-br from-[var(--primary)] to-[oklch(0.5_0.2_290)] text-white shadow-[var(--shadow-sm)]">
              <StencilIcon className="h-[15px] w-[15px]" />
            </span>
            <span className="text-[13.5px] font-semibold tracking-[-0.01em]">Stencil</span>
          </button>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            aria-label="Collapse menu"
            className="ml-auto flex h-6 w-6 items-center justify-center rounded-[7px] text-[var(--muted-foreground)] transition hover:bg-[var(--muted)]"
          >
            <ChevronDown className="h-4 w-4 rotate-90" />
          </button>
        </div>
      </div>

      {/* primary / secondary actions */}
      <div className="flex flex-col gap-1.5 px-3">
        <button
          type="button"
          onClick={onNewSession}
          aria-current={view === "new" ? "page" : undefined}
          className="inline-flex w-full items-center justify-center gap-2 rounded-[12px] bg-[var(--primary)] px-3 py-2 text-[13px] font-medium text-[var(--primary-foreground)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/45"
        >
          <Plus className="h-[15px] w-[15px]" />
          New session
        </button>
        <button
          type="button"
          onClick={onAddModel}
          aria-current={view === "add" ? "page" : undefined}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-[12px] px-3 py-2 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/45 ${
            view === "add" ? "bg-[var(--muted)] text-[var(--foreground)]" : "text-[var(--foreground)] hover:bg-[var(--muted)]"
          }`}
        >
          <FilePlus className="h-[15px] w-[15px] text-[var(--muted-foreground)]" />
          Add data
        </button>
      </div>

      {/* scroll: sessions */}
      <div className="mt-1 min-h-0 flex-1 overflow-y-auto px-2.5 pb-2">
        <SectionLabel>Sessions</SectionLabel>
        {sessions.length === 0 ? (
          <p className="px-2 py-1 text-[11px] text-[var(--muted-foreground)]">No sessions.</p>
        ) : (
          grouped.map((g) => (
            <div key={g.label}>
              <div className="px-2 pb-1 pt-3 text-[11px] font-semibold text-[var(--muted-foreground)]">{g.label}</div>
              {g.items.map((s) => {
                const model = models.find((m) => m.id === s.modelId);
                const active = s.id === activeSessionId && view === "session";
                return (
                  <div
                    key={s.id}
                    className={`group flex items-center gap-2.5 rounded-[10px] px-2 py-1.5 transition ${
                      active ? "bg-[var(--accent)]" : "hover:bg-[var(--muted)]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onOpenSession(s.id)}
                      className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                    >
                      <span
                        className="h-[7px] w-[7px] shrink-0 rounded-full"
                        style={{ background: active ? "var(--ok)" : "var(--border)" }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium leading-tight">{s.title}</span>
                        <span className="block truncate text-[11px] text-[var(--muted-foreground)]">
                          {model?.name ?? "Deleted model"}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSession(s.id)}
                      aria-label="Delete session"
                      className="shrink-0 text-[var(--muted-foreground)] opacity-0 transition hover:text-[var(--destructive)] focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <Trash className="h-[15px] w-[15px]" />
                    </button>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* footer */}
      <div className="flex items-center gap-2 border-t border-[var(--border)] px-3 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)]">
          <Check className="h-3.5 w-3.5 text-[var(--ok)]" />
          Deterministic engine · serverless
        </span>
      </div>
    </aside>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 px-2 pb-1 pt-3.5 font-mono text-[10px] font-medium uppercase tracking-[0.09em] text-[var(--muted-foreground)]">
      {children}
    </div>
  );
}

/* ── group sessions by recency (sorted desc by updatedAt) ── */
function groupByRecency(sessions: Session[]): { label: string; items: Session[] }[] {
  const sorted = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = 86_400_000;
  const order = ["Today", "Yesterday", "Last 7 days", "Older"];
  const buckets = new Map<string, Session[]>();
  for (const s of sorted) {
    const label =
      s.updatedAt >= startOfToday
        ? "Today"
        : s.updatedAt >= startOfToday - day
          ? "Yesterday"
          : s.updatedAt >= startOfToday - 7 * day
            ? "Last 7 days"
            : "Older";
    (buckets.get(label) ?? buckets.set(label, []).get(label)!).push(s);
  }
  return order.filter((l) => buckets.has(l)).map((l) => ({ label: l, items: buckets.get(l)! }));
}
