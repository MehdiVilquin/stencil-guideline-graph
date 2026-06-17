import type { EdgeType } from "@/lib/domain/types";

/** Shared visual language for the 4 edge types (used by Minimap + ClusterCards). */
export const EDGE_STYLE: Record<EdgeType, { color: string; glyph: string; label: string; dash?: string; arrow?: boolean }> = {
  overrides: { color: "var(--primary)", glyph: "→", label: "prime sur", arrow: true },
  "conflicts-with": { color: "var(--destructive)", glyph: "≠", label: "conflit", dash: "5 3" },
  reinforces: { color: "var(--muted-foreground)", glyph: "≈", label: "renforce", dash: "1.5 3" },
  "justified-by": { color: "var(--judged)", glyph: "↳", label: "justifiée par", dash: "1.5 3" },
};
