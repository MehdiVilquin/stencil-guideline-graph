"use client";

// Embeds the real product graph into the docs, driven by the bundled sample
// (Maison Lumière, 47 rules) resolved against the demo context. Read-only.

import { useMemo } from "react";
import { defaultGraph } from "@/lib/domain/store";
import { resolve } from "@/lib/domain/precedence";
import { DEMO_CONTEXT } from "../types";
import GraphTab from "../graph/GraphTab";

export default function LiveGraph() {
  const graph = useMemo(() => defaultGraph(), []);
  const resolved = useMemo(() => resolve(graph.rules, DEMO_CONTEXT), [graph]);
  return <GraphTab graph={graph} resolved={resolved} onRule={() => {}} />;
}
