// Single source of truth for the docs table of contents.
// Drives the left category nav, the right "on this page" list, and the
// anchored <Section>/<Sub> ids. Keep ids kebab-case and stable (URL hashes).

export interface TocSub {
  id: string;
  title: string;
}

export interface TocCategory {
  id: string;
  title: string;
  /** short label shown above the category title (OpenAI-style group label) */
  kicker?: string;
  subs: TocSub[];
}

export const DOCS_TOC: TocCategory[] = [
  {
    id: "introduction",
    title: "Introduction",
    kicker: "Overview",
    subs: [
      { id: "thesis", title: "The thesis" },
      { id: "architecture", title: "Architecture at a glance" },
      { id: "core-ideas", title: "Core ideas" },
    ],
  },
  {
    id: "data",
    title: "Data",
    kicker: "The input",
    subs: [
      { id: "file-format", title: "Guidelines file format" },
      { id: "scope-dimensions", title: "The 6 scope dimensions" },
      { id: "constraint-types", title: "Constraint types" },
      { id: "strength-levels", title: "Strength levels" },
      { id: "data-hygiene", title: "Data hygiene" },
    ],
  },
  {
    id: "model",
    title: "Model",
    kicker: "Build the graph, once",
    subs: [
      { id: "scope-vector", title: "ScopeVector — a rule's address" },
      { id: "scope-lattice", title: "The scope lattice" },
      { id: "classification", title: "Classification — 3 labels" },
      { id: "subjects-rings", title: "Subjects & rings" },
      { id: "contradiction", title: "Contradiction vs. reinforcement" },
      { id: "edge-types", title: "Edge types" },
    ],
  },
  {
    id: "resolution",
    title: "Resolution",
    kicker: "Query by context",
    subs: [
      { id: "context-selector", title: "The context selector" },
      { id: "ranking", title: "Filter → gate → ranking" },
      { id: "invariant-floor", title: "Force ≠ overridability" },
      { id: "flag-for-human", title: "flag_for_human" },
      { id: "decision-trace", title: "The decision trace" },
    ],
  },
  {
    id: "generation",
    title: "Generation & Proof",
    kicker: "Write, then prove",
    subs: [
      { id: "active-injection", title: "Active-rules injection" },
      { id: "verifiers", title: "The verifiers" },
      { id: "provable-judged", title: "Provable vs. judged" },
      { id: "repair-loop", title: "The repair loop" },
      { id: "verify-only", title: "Verify-only mode" },
    ],
  },
  {
    id: "architecture",
    title: "Architecture & Decisions",
    kicker: "The why",
    subs: [
      { id: "lattice-vs-tree", title: "Lattice vs. tree vs. alternatives" },
      { id: "graph-cost", title: "When a graph earns its cost" },
      { id: "stack", title: "Stack" },
    ],
  },
];

/** Flat list of every sub-section id, in document order (for scrollspy). */
export const ALL_SECTION_IDS: string[] = DOCS_TOC.flatMap((c) => [
  c.id,
  ...c.subs.map((s) => s.id),
]);
