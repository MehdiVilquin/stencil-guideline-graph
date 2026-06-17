import type { ConstraintType } from "@/lib/domain/types";

/** Field key → human label (the artifact type shown on a turn card). */
export const FIELD_LABELS: Record<string, string> = {
  title: "Titre",
  long_description: "Description longue",
  short_description: "Description courte",
  bullet_points: "Bullet points",
  seo_meta: "SEO meta",
};

export const fieldLabel = (field: string) => FIELD_LABELS[field] ?? field;

/**
 * Constraint type → short category label + accent colour.
 * Status hues (red/blue/amber) reuse apple/status tokens; the three extra
 * category hues (format/length/structure) are assumed additions, kept muted.
 */
export const CONSTRAINT_LABEL: Record<ConstraintType, { label: string; color: string }> = {
  "lexical-forbidden": { label: "interdit", color: "var(--destructive)" },
  "lexical-required": { label: "requis", color: "var(--primary)" },
  "format-pattern": { label: "format", color: "oklch(0.55 0.14 300)" },
  "length-bound": { label: "length", color: "oklch(0.52 0.10 180)" },
  structure: { label: "structure", color: "oklch(0.50 0.10 270)" },
  "register-tone": { label: "ton", color: "var(--judged)" },
};
