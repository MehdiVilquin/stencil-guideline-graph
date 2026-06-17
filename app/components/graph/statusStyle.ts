import type { GraphNode } from "../RuleGraphSVG";

export type Status = GraphNode["status"];

/** Single source of truth: colour ALWAYS means status (graph + cards). */
export const STATUS_STYLE: Record<Status, { color: string; label: string }> = {
  active: { color: "var(--ok)", label: "Actif" },
  suppressed: { color: "var(--muted-foreground)", label: "Supprimé" },
  flagged: { color: "var(--judged)", label: "Jugé" },
  neutral: { color: "var(--muted-foreground)", label: "—" },
};

/** The statuses shown in legends (skip "neutral", only used in Doctrine). */
export const LEGEND_STATUSES: Status[] = ["active", "suppressed", "flagged"];
