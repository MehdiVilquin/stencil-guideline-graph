import type {
  Decision,
  GenerationContext,
  GenerationResult,
  Rule,
  ScopeVector,
} from "@/lib/domain/types";

export type Facets = Record<keyof ScopeVector, string[]>;
export type Mode = "write" | "rewrite";
export type Tab = "inspector" | "graph" | "archive" | "doctrine";

export interface Turn {
  id: number;
  kind: Mode;
  contextLabel: string;
  input: string;
  result: GenerationResult;
  active: Rule[];
  decisions: Decision[];
}

/** The six context dimensions, in display order. */
export const DIMS: {
  key: keyof GenerationContext;
  label: string;
  wildcard: string;
  wildcardLabel: string;
}[] = [
  { key: "brand", label: "Marque", wildcard: "All", wildcardLabel: "Toutes les marques" },
  { key: "locale", label: "Langue", wildcard: "global", wildcardLabel: "Toutes les langues" },
  { key: "contentType", label: "Type de contenu", wildcard: "All", wildcardLabel: "Tous les contenus" },
  { key: "productCategory", label: "Catégorie", wildcard: "All", wildcardLabel: "Toutes les catégories" },
  { key: "productType", label: "Type de produit", wildcard: "All", wildcardLabel: "Tous les types" },
  { key: "field", label: "Champ", wildcard: "all", wildcardLabel: "Tous les champs" },
];

/** Acronyms kept fully uppercase when prettifying raw facet values. */
const ACRONYMS = new Set(["seo", "sku", "url", "cta", "faq", "ui", "ux"]);

/** Title-cases all-lower / ALL-CAPS words; leaves mixed-case proper nouns untouched. */
const titleizeWord = (w: string) => {
  if (ACRONYMS.has(w.toLowerCase())) return w.toUpperCase();
  if (w !== w.toLowerCase() && w !== w.toUpperCase()) return w; // e.g. "L'Atelier", "Lumière"
  return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
};

const prettyLocale = (value: string) => {
  try {
    const name = new Intl.DisplayNames(["fr"], { type: "language" }).of(value);
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : value;
  } catch {
    return value;
  }
};

/**
 * Human-friendly label for a raw facet value: underscores become spaces,
 * snake_case / ALL-CAPS become Title Case, locale codes become language names.
 * The underlying value is never altered — only its display.
 */
export function prettyValue(key: keyof GenerationContext, value: string): string {
  const dim = DIMS.find((d) => d.key === key);
  if (dim && value === dim.wildcard) return dim.wildcardLabel;
  if (key === "locale") return prettyLocale(value);
  return value
    .replace(/_+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(titleizeWord)
    .join(" ");
}

export const DEMO_CONTEXT: GenerationContext = {
  brand: "Lumière Paris",
  locale: "de-DE",
  contentType: "Product Description",
  productCategory: "Skincare",
  productType: "SINGLE",
  field: "title",
};

export const ctxLabel = (c: GenerationContext) =>
  [c.brand, c.locale].filter(Boolean).join(" · ");

export const KIND_LABEL: Record<Mode, string> = { write: "Créer", rewrite: "Corriger" };
