import { useState } from "react";
import type { ResolveResult, RuleGraph } from "@/lib/domain/types";
import type { GraphNode } from "../RuleGraphSVG";
import ForceGraph from "./ForceGraph";
import ClusterCards from "./ClusterCards";
import Strata from "./Strata";
import WeightLadder from "./WeightLadder";
import PinBoard from "./PinBoard";

type View = "weight" | "graph" | "matrix";
const VIEWS: { key: View; label: string }[] = [
  { key: "weight", label: "Weight" },
  { key: "graph", label: "Graph" },
  { key: "matrix", label: "Matrix" },
];

/** Graph tab: 3 views over the same resolved context. */
export default function GraphTab({
  graph,
  resolved,
  onRule,
}: {
  graph: RuleGraph | null;
  resolved: ResolveResult | null;
  onRule: (localId: string) => void;
}) {
  const [view, setView] = useState<View>("weight");
  if (!graph || !resolved) return <div className="text-sm text-[var(--muted-foreground)]">Loading…</div>;

  const seen = new Map<string, GraphNode>();
  for (const r of resolved.active) seen.set(r.localId, { rule: r, status: "active" });
  for (const d of resolved.decisions)
    for (const b of d.beat) if (!seen.has(b.rule.localId)) seen.set(b.rule.localId, { rule: b.rule, status: "suppressed" });
  for (const f of resolved.flagged)
    for (const c of f.candidates) if (!seen.has(c.localId)) seen.set(c.localId, { rule: c, status: "flagged" });
  const nodes = [...seen.values()];
  const ids = new Set(nodes.map((n) => n.rule.localId));
  const edges = graph.edges.filter((e) => ids.has(e.from) && ids.has(e.to));
  // rule localId → the rules it is related to (any edge), for the "↔ #x" hint
  const relations = new Map<string, string[]>();
  const link = (a: string, b: string) => {
    const arr = relations.get(a) ?? [];
    if (!arr.includes(b)) arr.push(b);
    relations.set(a, arr);
  };
  for (const e of edges) {
    link(e.from, e.to);
    link(e.to, e.from);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div role="tablist" aria-label="Graph view" className="flex items-center gap-0.5 rounded-[10px] bg-[var(--muted)] p-[3px]">
          {VIEWS.map((v) => {
            const active = view === v.key;
            return (
              <button
                key={v.key}
                type="button"
                role="tab"
                aria-selected={active ? "true" : "false"}
                onClick={() => setView(v.key)}
                className={`rounded-[8px] px-3 py-1 text-[12px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/45 ${
                  active ? "bg-[var(--card)] text-[var(--foreground)] shadow-[var(--shadow-sm)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {v.label}
              </button>
            );
          })}
        </div>
        <span className="text-[11px] tabular-nums text-[var(--muted-foreground)]">{resolved.active.length} active</span>
      </div>

      {view === "weight" && (
        <div className="flex flex-col gap-4">
          <Strata active={resolved.active} />
          <WeightLadder active={resolved.active} relations={relations} />
        </div>
      )}
      {view === "graph" && (
        <div className="flex flex-col gap-3">
          <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">Overview</div>
          <ForceGraph nodes={nodes} edges={edges} onRule={onRule} />
          <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">By subject</div>
          <ClusterCards nodes={nodes} edges={edges} onRule={onRule} />
        </div>
      )}
      {view === "matrix" && <PinBoard active={resolved.active} relations={relations} />}
    </div>
  );
}
