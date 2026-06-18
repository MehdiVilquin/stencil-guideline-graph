import type {
  Decision,
  GenerationContext,
  GenerationResult,
  Rule,
  ScopeVector,
} from "@/lib/domain/types";
import type { RawRule } from "@/lib/domain/ingest";

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
  { key: "brand", label: "Brand", wildcard: "All", wildcardLabel: "All brands" },
  { key: "locale", label: "Locale", wildcard: "global", wildcardLabel: "All locales" },
  { key: "contentType", label: "Content type", wildcard: "All", wildcardLabel: "All content types" },
  { key: "productCategory", label: "Category", wildcard: "All", wildcardLabel: "All categories" },
  { key: "productType", label: "Product type", wildcard: "All", wildcardLabel: "All types" },
  { key: "field", label: "Field", wildcard: "all", wildcardLabel: "All fields" },
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
    const name = new Intl.DisplayNames(["en"], { type: "language" }).of(value);
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

export const KIND_LABEL: Record<Mode, string> = { write: "Create", rewrite: "Correct" };

/* ───────────────────────── Library objects ─────────────────────────
   A Model = an ingested guideline set (frozen graph), named + colored.
   A Session = a workspace bound to ONE model + a generation context.
   Both persist in localStorage (see app/store/library.ts). The graph and
   facets are DERIVED from `rows` on demand — we store the raw rows so any
   set goes through the same ingest pipeline (data-driven). */

export interface Model {
  id: string;
  name: string;
  /** monogram background — oklch, derived from the name */
  color: string;
  /** 1–2 letter monogram derived from the name */
  monogram: string;
  /** filename or "Échantillon" */
  source: string;
  rows: RawRule[];
  createdAt: number;
}

export interface Session {
  id: string;
  modelId: string;
  title: string;
  ctx: GenerationContext;
  turns: Turn[];
  createdAt: number;
  updatedAt: number;
}

/**
 * A sensible, valid default context for an arbitrary uploaded model: the first
 * concrete facet value per dimension, else the dimension's wildcard token.
 * Deterministic and always applicable (see isApplicable in lib/domain/scope.ts);
 * the user refines it in the "New session" screen.
 */
export function seedContextFromFacets(facets: Facets): GenerationContext {
  const pick = (k: keyof GenerationContext) => {
    const dim = DIMS.find((d) => d.key === k)!;
    const vals = facets[k] ?? [];
    return vals.length ? vals[0] : dim.wildcard;
  };
  return {
    brand: pick("brand"),
    locale: pick("locale"),
    contentType: pick("contentType"),
    productCategory: pick("productCategory"),
    productType: pick("productType"),
    field: pick("field"),
  };
}
