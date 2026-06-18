"use client";

// Pitch deck for Stencil — v2 design system. One role-based type scale
// (.d-title-xl/lg/title, .d-stat …) with constant line-heights, a 12-col grid,
// and named layouts (hero / split / visual-top / grid / stats). Visuals embed
// the REAL product components (Strata, ForceGraph) fed by the REAL resolved
// Maison Lumière graph, plus a REAL deterministic proof. The deck is the proof.

import { useState, useEffect, useRef, type RefObject } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { defaultRawRules } from "@/lib/data";
import { ingest } from "@/lib/domain/ingest";
import { resolve } from "@/lib/domain/precedence";
import { verifyAll, verifyLanguage, verifyForeignTerms, franglaisApplies } from "@/lib/domain/verifiers";
import type { GenerationContext, Verdict } from "@/lib/domain/types";
import type { GraphNode } from "@/app/components/RuleGraphSVG";
import Strata from "@/app/components/graph/Strata";
import ForceGraph from "@/app/components/graph/ForceGraph";
import {
  HookMotif, ProbabilityVsProof, ScopeLattice, PipelineFlow, AlgoPhases,
  IngestionMock, ResolutionPanel, CopyQuote, VerdictList, BenefitsGrid, RoadmapTimeline,
} from "./visuals";

// ─── Virtual slide canvas ────────────────────────────────────────────────────
// A fixed 1280×720 (16:9) "slide", scaled to fit its container. Every slide
// composes inside this known frame → no overflow, consistent framing across
// screens. Type sizes are fixed px (designed for this canvas); the scale handles
// responsiveness.
const STAGE_W = 1280;
const STAGE_H = 720;
function useFitScale(ref: RefObject<HTMLElement | null>, dw: number, dh: number) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(Math.min(el.clientWidth / dw, el.clientHeight / dh));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, dw, dh]);
  return scale;
}

// ─── Real demo data (module scope · deterministic · client-safe) ─────────────
const DEMO_CTX: GenerationContext = {
  brand: "Lumière Paris", locale: "de-DE", contentType: "Product Description",
  productCategory: "Skincare", productType: "SINGLE", field: "title",
};
const GRAPH = ingest(defaultRawRules);
const RESOLVED = resolve(GRAPH.rules, DEMO_CTX);
const ACTIVE = RESOLVED.active;
const ACTIVE_IDS = new Set(ACTIVE.map((r) => r.localId));
const BEATEN_IDS = new Set(RESOLVED.decisions.flatMap((d) => d.beat.map((b) => b.rule.localId)));
const statusOf = (id: string) => (ACTIVE_IDS.has(id) ? "active" : BEATEN_IDS.has(id) ? "suppressed" : "neutral");
const INVARIANTS = ACTIVE.filter((r) => !r.overridable).length;

const SOUP_NODES: GraphNode[] = GRAPH.rules.map((r) => ({ rule: r, status: "neutral" as const }));
const RESOLVED_NODES: GraphNode[] = GRAPH.rules
  .filter((r) => ACTIVE_IDS.has(r.localId) || BEATEN_IDS.has(r.localId))
  .map((r) => ({ rule: r, status: statusOf(r.localId) }));

const CONFLICT = RESOLVED.decisions.find((d) => d.beat.length > 0) ?? RESOLVED.decisions[0] ?? null;

const DEMO_COPY = "Anti-Aging Sérum: für nur €50, sichtbar jüngere Haut!";
const PROOF: Verdict[] = (() => {
  const rep = [...verifyAll(DEMO_COPY, ACTIVE), verifyLanguage(DEMO_COPY, DEMO_CTX.locale)];
  if (franglaisApplies(DEMO_CTX.locale)) rep.push(verifyForeignTerms(DEMO_COPY, ACTIVE, DEMO_CTX.brand));
  return rep;
})();
const CONFLICTS_COUNT = GRAPH.edges.filter((e) => e.type === "conflicts-with").length;

// ─── Types ────────────────────────────────────────────────────────────────────
type Lang = "en" | "fr";
type SlideType = "cover" | "hook" | "problem" | "solution" | "demo" | "product" | "data" | "roadmap" | "business" | "outro";
type Layout = "hero" | "split" | "visual-top" | "grid" | "stats";
type Visual = "hook" | "soup" | "probpred" | "solution" | "pipeline" | "lattice" | "funnel" | "ingest" | "resolution" | "strata";

interface Col { label: string; desc: string }
interface Row { tool: string; trait: string; highlight?: boolean }
interface Num { value: string; label: string }
interface Road { q: string; label: string; desc: string }

interface Tech { op: string; detail: string }
interface SlideContent {
  tag: string; title: string; body?: string; quote?: string;
  list?: string[]; cols?: Col[]; rows?: Row[]; nums?: Num[]; roadmap?: Road[];
  tech?: Tech[];
  cta?: { label: string; href: string }; credentials?: string[]; visual?: Visual;
}
interface Slide { id: string; type: SlideType; layout: Layout; en: SlideContent; fr: SlideContent }

// One accent per act + one title tier per type — the system, held everywhere.
const ACCENT: Record<SlideType, string> = {
  cover: "var(--primary)", hook: "var(--judged)", problem: "var(--destructive)",
  solution: "var(--primary)", demo: "var(--ok)", product: "var(--ok)", data: "var(--primary)",
  roadmap: "var(--primary)", business: "var(--primary)", outro: "var(--primary)",
};
const TIER: Record<SlideType, "xl" | "lg" | "md"> = {
  cover: "xl", outro: "xl", hook: "lg", solution: "lg", demo: "lg",
  problem: "md", product: "md", data: "md", roadmap: "md", business: "md",
};
const TITLE_CLASS = { xl: "d-title-xl", lg: "d-title-lg", md: "d-title" } as const;

// ─── Slide data (18 · bilingual) ─────────────────────────────────────────────
const SLIDES: Slide[] = [
  { id: "cover", type: "cover", layout: "hero",
    en: { tag: "Introduction", title: "Stencil", body: "Brand rules, made enforceable.",
      credentials: ["Sanofi", "BNP Paribas", "Renault", "SNCF", "Thales", "Dorna AI"] },
    fr: { tag: "Introduction", title: "Stencil", body: "Des règles de marque, rendues applicables.",
      credentials: ["Sanofi", "BNP Paribas", "Renault", "SNCF", "Thales", "Dorna AI"] } },
  { id: "hook", type: "hook", layout: "hero",
    en: { tag: "Hook", title: "AI agents fly blind.",
      body: "The LLM knows the rules. It can't enforce them — it improvises, hallucinates, picks a side, moves on.",
      visual: "hook" },
    fr: { tag: "Accroche", title: "Les agents IA naviguent à vue.",
      body: "Le LLM connaît les règles. Il ne peut pas les appliquer — il improvise, hallucine, choisit un camp, passe à la suite.",
      visual: "hook" } },
  { id: "problem1", type: "problem", layout: "visual-top",
    en: { tag: "Problem · 1/2", title: "The guidelines soup.",
      body: "40–300 rules of mixed strength in one flat file. Invariants buried beside preferences, conflicts with no winner.",
      visual: "soup" },
    fr: { tag: "Problème · 1/2", title: "La soupe de guidelines.",
      body: "40 à 300 règles de force variable dans un fichier plat. Des invariants noyés près de préférences, des conflits sans vainqueur.",
      visual: "soup" } },
  { id: "problem2", type: "problem", layout: "visual-top",
    en: { tag: "Problem · 2/2", title: "Probabilistic ≠ deterministic.",
      body: "Every LLM call is a roll of the dice. Compliance is correlation, not proof. You can't audit a probability.",
      visual: "probpred" },
    fr: { tag: "Problème · 2/2", title: "Probabiliste ≠ déterministe.",
      body: "Chaque appel LLM est un lancer de dés. La conformité est une corrélation, pas une preuve. On ne peut pas auditer une probabilité.",
      visual: "probpred" } },
  { id: "solution", type: "solution", layout: "split",
    en: { tag: "Solution", title: "A semantic rule graph.",
      body: "Every rule becomes a node. Every conflict, an edge. Every resolution, a proof — drawn from your real guidelines.",
      visual: "solution" },
    fr: { tag: "Solution", title: "Un graphe de règles sémantiques.",
      body: "Chaque règle devient un nœud. Chaque conflit, une arête. Chaque résolution, une preuve — tirée de vos vraies guidelines.",
      visual: "solution" } },
  { id: "pipeline", type: "data", layout: "visual-top",
    en: { tag: "How it works", title: "Parse → Graph → Resolve → Prove.",
      body: "Four deterministic steps. No stochastic layer in the resolution path.", visual: "pipeline" },
    fr: { tag: "Comment ça marche", title: "Parser → Graphe → Résoudre → Prouver.",
      body: "Quatre étapes déterministes. Aucune couche stochastique dans la chaîne de résolution.", visual: "pipeline" } },
  { id: "datamodel", type: "data", layout: "split",
    en: { tag: "Data model", title: "Rule node · ScopeVector.",
      body: "A 6-dimension scope lattice + a strength level. Edges encode precedence, conflict, reinforcement.",
      visual: "lattice" },
    fr: { tag: "Modèle de données", title: "Nœud de règle · ScopeVector.",
      body: "Un lattice de périmètre à 6 dimensions + un niveau de force. Les arêtes encodent précédence, conflit, renforcement.",
      visual: "lattice" } },
  { id: "algo", type: "data", layout: "visual-top",
    en: { tag: "Algorithm", title: "Partition → Gate → Rank.",
      body: "Three deterministic steps. No ML.", visual: "funnel" },
    fr: { tag: "Algorithme", title: "Partition → Filtre → Classement.",
      body: "Trois étapes déterministes. Aucun ML.", visual: "funnel" } },
  { id: "demo", type: "demo", layout: "hero",
    en: { tag: "Demo", title: "See it live.",
      body: "Lumière Paris · de-DE · title — resolved live from the real 47-rule sample.",
      cta: { label: "Open the prototype →", href: "/prototype" }, visual: "strata" },
    fr: { tag: "Démo", title: "Voir en direct.",
      body: "Lumière Paris · de-DE · titre — résolu en direct depuis le vrai sample de 47 règles.",
      cta: { label: "Ouvrir le prototype →", href: "/prototype" }, visual: "strata" } },
  { id: "product1", type: "product", layout: "split",
    en: { tag: "Product · 1/3", title: "Ingestion.",
      body: "One file in, a typed rule graph out — in seconds, entirely in the browser.",
      tech: [
        { op: "Parse", detail: "xlsx · csv · json → normalized rows" },
        { op: "Classify", detail: "each rule tagged by strength: invariant · hard · conditional · preference" },
        { op: "Scope", detail: "a 6-dimension ScopeVector extracted per rule" },
        { op: "Diff", detail: "conflict edges where scopes overlap but rules disagree" },
      ],
      visual: "ingest" },
    fr: { tag: "Produit · 1/3", title: "Ingestion.",
      body: "Un fichier en entrée, un graphe de règles typé en sortie — en secondes, dans le navigateur.",
      tech: [
        { op: "Parse", detail: "xlsx · csv · json → lignes normalisées" },
        { op: "Classify", detail: "chaque règle taguée par force : invariant · hard · conditional · preference" },
        { op: "Scope", detail: "un ScopeVector à 6 dimensions extrait par règle" },
        { op: "Diff", detail: "arêtes de conflit là où les périmètres se chevauchent mais divergent" },
      ],
      visual: "ingest" } },
  { id: "product2", type: "product", layout: "split",
    en: { tag: "Product · 2/3", title: "Context & conflict resolution.",
      body: "Pick a context. The engine resolves every conflict by precedence — and tells you why.",
      tech: [
        { op: "Filter", detail: "keep rules whose ScopeVector matches the context" },
        { op: "Score", detail: "precedence = scope specificity → strength → explicitness" },
        { op: "Gate", detail: "invariants are a floor — non-overridable, always win" },
        { op: "Resolve", detail: "winner stays active, losers suppressed with a reason" },
      ],
      visual: "resolution" },
    fr: { tag: "Produit · 2/3", title: "Contexte & résolution de conflits.",
      body: "Choisissez un contexte. Le moteur résout chaque conflit par précédence — et vous dit pourquoi.",
      tech: [
        { op: "Filter", detail: "on garde les règles dont le ScopeVector matche le contexte" },
        { op: "Score", detail: "précédence = spécificité du périmètre → force → explicite" },
        { op: "Gate", detail: "les invariants forment un plancher — non-overridable, priment toujours" },
        { op: "Resolve", detail: "le gagnant reste actif, les perdants écartés avec une raison" },
      ],
      visual: "resolution" } },
  { id: "product3", type: "product", layout: "split",
    en: { tag: "Product · 3/3", title: "Proof panel.",
      body: "Every line is traceable. Which rule passed, which failed, which is only judged — deterministically." },
    fr: { tag: "Produit · 3/3", title: "Panneau de preuves.",
      body: "Chaque ligne est traçable. Quelle règle passe, échoue, ou n'est que jugée — de façon déterministe." } },
  { id: "benefits", type: "business", layout: "grid",
    en: { tag: "Client benefits", title: "Compliance · Cost · Speed · Auditability.",
      cols: [
        { label: "Compliance proof", desc: "Every output is traceable. No more manual audits." },
        { label: "Token cost ↓", desc: "Tighter prompts, fewer retries on hallucinations." },
        { label: "Fast onboarding", desc: "1 file → working rule graph in under 2 minutes." },
        { label: "Full auditability", desc: "Critical for regulated industries: pharma, finance, luxury." },
      ] },
    fr: { tag: "Bénéfices client", title: "Conformité · Coût · Vitesse · Auditabilité.",
      cols: [
        { label: "Preuve de conformité", desc: "Chaque output est traçable. Finis les audits manuels." },
        { label: "Tokens réduits", desc: "Prompts plus courts, moins de retries sur hallucinations." },
        { label: "Onboarding rapide", desc: "1 fichier → graphe opérationnel en moins de 2 minutes." },
        { label: "Auditabilité totale", desc: "Critique pour les secteurs réglementés : pharma, finance, luxe." },
      ] } },
  { id: "competitors", type: "business", layout: "visual-top",
    en: { tag: "Competitors", title: "No direct match.",
      body: "No tool combines ingestion + typed conflict resolution + provable output.",
      rows: [
        { tool: "Writer.ai", trait: "Brand voice — no rule graph" },
        { tool: "Jasper", trait: "Generation — no enforcement" },
        { tool: "Frontify", trait: "Management — no generation" },
        { tool: "Custom RAG", trait: "Retrieval — no conflict resolution" },
        { tool: "Stencil", trait: "Parse → Graph → Resolve → Prove", highlight: true },
      ],
      quote: "Not a copywriting tool. A compliance engine." },
    fr: { tag: "Concurrents", title: "Aucun concurrent direct.",
      body: "Aucun outil ne combine ingestion + résolution de conflits typée + output prouvable.",
      rows: [
        { tool: "Writer.ai", trait: "Brand voice — sans graphe de règles" },
        { tool: "Jasper", trait: "Génération — sans enforcement" },
        { tool: "Frontify", trait: "Gestion — sans génération" },
        { tool: "RAG custom", trait: "Retrieval — sans résolution de conflits" },
        { tool: "Stencil", trait: "Parser → Graphe → Résoudre → Prouver", highlight: true },
      ],
      quote: "Pas un outil de copywriting. Un moteur de conformité." } },
  { id: "market", type: "business", layout: "stats",
    en: { tag: "Market size", title: "$6B and growing.",
      body: "Brand-content software and AI writing tools are converging. The enforcement layer is the overlap — and no one owns it.",
      nums: [
        { value: "$4.5B", label: "Brand content software (+18%/yr)" },
        { value: "$2B", label: "AI content generation (+35%/yr)" },
        { value: "$800M", label: "Addressable: regulated & multi-market" },
      ] },
    fr: { tag: "Taille de marché", title: "6 Md$ et en croissance.",
      body: "Les logiciels brand content et les outils de génération IA convergent. La couche d'enforcement est l'overlap — et personne ne la possède.",
      nums: [
        { value: "4,5 Md$", label: "Logiciels brand content (+18%/an)" },
        { value: "2 Md$", label: "Génération IA (+35%/an)" },
        { value: "800 M$", label: "Adressable : réglementé & multi-marchés" },
      ] } },
  { id: "pricing", type: "business", layout: "visual-top",
    en: { tag: "Pricing & margin", title: "Per-brand SaaS + usage API.",
      cols: [
        { label: "Subscription", desc: "€300–800/month per brand — rule volume & team size" },
        { label: "API usage", desc: "Pay-as-you-go above quota — billed per generation call" },
      ],
      quote: "Serverless → near-zero fixed cost. High margins from the first subscriber." },
    fr: { tag: "Modèle économique", title: "SaaS par marque + API à l'usage.",
      cols: [
        { label: "Abonnement", desc: "€300–800/mois par marque — volume de règles & taille d'équipe" },
        { label: "Usage API", desc: "Pay-as-you-go au-delà du quota — facturation à l'appel" },
      ],
      quote: "Serverless → coût fixe quasi nul. Marges élevées dès le premier abonné." } },
  { id: "roadmap", type: "roadmap", layout: "visual-top",
    en: { tag: "Roadmap", title: "What's next.",
      roadmap: [
        { q: "Q1", label: "Visual rules", desc: "Extend the engine to logo, colour, typography." },
        { q: "Q2", label: "Auto-improve", desc: "Detect weak rules from session feedback." },
        { q: "Q3", label: "Multi-brand", desc: "Many graphs, one workspace, shared policies." },
        { q: "Q4", label: "Public API", desc: "B2B integration — webhooks, SDK, connectors." },
      ] },
    fr: { tag: "Roadmap", title: "Les prochaines étapes.",
      roadmap: [
        { q: "Q1", label: "Règles visuelles", desc: "Étendre le moteur au logo, couleur, typographie." },
        { q: "Q2", label: "Auto-amélioration", desc: "Détecter les règles faibles via le feedback." },
        { q: "Q3", label: "Multi-marque", desc: "Plusieurs graphes, un workspace, politiques partagées." },
        { q: "Q4", label: "API publique", desc: "Intégration B2B — webhooks, SDK, connecteurs." },
      ] } },
  { id: "outro", type: "outro", layout: "hero",
    en: { tag: "Conclusion", title: "Brand rules.\nMade enforceable.",
      body: "Deterministic · Provable · Auditable · Serverless",
      cta: { label: "Try the prototype →", href: "/prototype" } },
    fr: { tag: "Conclusion", title: "Des règles de marque.\nEnfin applicables.",
      body: "Déterministe · Prouvable · Auditable · Serverless",
      cta: { label: "Voir le prototype →", href: "/prototype" } } },
];

// ─── Visual renderer ─────────────────────────────────────────────────────────
function VisualFor({ v, lang }: { v: Visual; lang: Lang }) {
  const isEn = lang === "en";
  switch (v) {
    case "hook": return <HookMotif />;
    case "probpred": return <ProbabilityVsProof isEn={isEn} />;
    case "pipeline": return <PipelineFlow isEn={isEn} />;
    case "lattice": return <ScopeLattice />;
    case "funnel": return <AlgoPhases applicable={RESOLVED.applicableCount} active={ACTIVE.length} invariants={INVARIANTS} isEn={isEn} />;
    case "ingest": return <IngestionMock rules={GRAPH.rules.length} conflicts={CONFLICTS_COUNT} isEn={isEn} />;
    case "resolution": return <ResolutionPanel decision={CONFLICT} isEn={isEn} />;
    case "soup": return <div className="w-full max-w-[720px]">{SOUP_NODES.length ? <ForceGraph nodes={SOUP_NODES} edges={GRAPH.edges} /> : null}</div>;
    case "solution": return <div className="w-full">{RESOLVED_NODES.length ? <ForceGraph nodes={RESOLVED_NODES} edges={GRAPH.edges} /> : null}</div>;
    case "strata": return <Strata active={ACTIVE} />;
    default: return null;
  }
}

// ─── Shared header ───────────────────────────────────────────────────────────
function SlideHeader({ content, tier, accent, align }: {
  content: SlideContent; tier: "xl" | "lg" | "md"; accent: string; align: "center" | "left";
}) {
  const center = align === "center";
  return (
    <div className={center ? "text-center" : ""}>
      <p className="d-kicker mb-3" style={{ color: accent }}>{content.tag}</p>
      <h2 className={`${TITLE_CLASS[tier]} text-[var(--foreground)] ${content.title.includes("\n") ? "whitespace-pre-line" : ""}`}>
        {content.title}
      </h2>
      {content.body && (
        <p className={`d-body mt-4 text-[var(--muted-foreground)] ${center ? "mx-auto max-w-2xl" : "max-w-xl"}`}>{content.body}</p>
      )}
    </div>
  );
}

function CtaButton({ label, onClick, large }: { label: string; onClick: () => void; large?: boolean }) {
  return (
    <button type="button" onClick={onClick}
      className={`rounded-full bg-[var(--primary)] font-semibold text-[var(--primary-foreground)] shadow-[0_4px_24px_oklch(0.56_0.2_257/0.35)] transition hover:opacity-90 ${large ? "px-10 py-4 text-[16px]" : "px-6 py-3 text-[14px]"}`}>
      {label}
    </button>
  );
}

// ─── Slide renderer ──────────────────────────────────────────────────────────
function SlideView({ slide, content, lang, onCta }: {
  slide: Slide; content: SlideContent; lang: Lang; onCta: (href: string) => void;
}) {
  const accent = ACCENT[slide.type];
  const tier = TIER[slide.type];

  // — Cover —
  if (slide.type === "cover") {
    return (
      <div className="deck-hero">
        <span className="mb-7 flex h-16 w-16 items-center justify-center rounded-[18px] bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
            <line x1="3" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="15" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="12" y1="3" x2="12" y2="9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="12" y1="15" x2="12" y2="21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </span>
        <h1 className="d-title-xl text-[var(--foreground)]">{content.title}</h1>
        <p className="d-subtitle mt-3" style={{ color: accent }}>{content.body}</p>
        <div className="my-9 h-px w-72 bg-[var(--border)]" />
        <p className="text-[15px] font-semibold text-[var(--foreground)]">Mehdi Vilquin</p>
        <p className="mt-1 text-[13px] text-[var(--muted-foreground)]">
          {lang === "en" ? "Fractional Design Lead · AI Product Builder" : "Fractional Design Lead · Builder produit IA"}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          {content.credentials?.map((c) => (
            <span key={c} className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-[11px] font-medium text-[var(--muted-foreground)]">{c}</span>
          ))}
        </div>
      </div>
    );
  }

  // — Outro —
  if (slide.type === "outro") {
    return (
      <div className="deck-hero">
        <SlideHeader content={content} tier="xl" accent={accent} align="center" />
        {content.cta && <CtaButton label={content.cta.label} onClick={() => onCta(content.cta!.href)} large />}
      </div>
    );
  }

  // — Hero (hook, demo) —
  if (slide.layout === "hero") {
    return (
      <div className="deck-hero">
        <SlideHeader content={content} tier={tier} accent={accent} align="center" />
        {content.visual && (
          <div className="flex justify-center"><VisualFor key={slide.id} v={content.visual} lang={lang} /></div>
        )}
        {content.cta && <CtaButton label={content.cta.label} onClick={() => onCta(content.cta!.href)} large />}
      </div>
    );
  }

  // — Split (solution, datamodel, product 1/2/3) —
  if (slide.layout === "split") {
    return (
      <div className="deck-split">
        <div>
          <SlideHeader content={content} tier={tier} accent={accent} align="left" />
          {content.tech && (
            <ul className="mt-5 flex flex-col gap-2.5">
              {content.tech.map((t) => (
                <li key={t.op} className="flex items-baseline gap-3">
                  <span className="d-mono w-[64px] shrink-0 text-[11px] font-semibold" style={{ color: accent }}>{t.op}</span>
                  <span className="text-[12px] leading-snug text-[var(--muted-foreground)]">{t.detail}</span>
                </li>
              ))}
            </ul>
          )}
          {slide.id === "product3" && <div className="mt-5"><CopyQuote copy={DEMO_COPY} /></div>}
        </div>
        <div className="min-h-0">
          {slide.id === "product3" ? (
            <VerdictList report={PROOF} isEn={lang === "en"} />
          ) : content.visual ? (
            <VisualFor key={slide.id} v={content.visual} lang={lang} />
          ) : null}
        </div>
      </div>
    );
  }

  // — Grid (benefits) —
  if (slide.layout === "grid") {
    return (
      <div className="deck-visual-top">
        <SlideHeader content={content} tier={tier} accent={accent} align="center" />
        {content.cols && <BenefitsGrid cols={content.cols} accent={accent} />}
      </div>
    );
  }

  // — Stats (market) —
  if (slide.layout === "stats") {
    return (
      <div className="deck-visual-top">
        <SlideHeader content={content} tier={tier} accent={accent} align="center" />
        <div className="flex w-full max-w-[820px] flex-wrap justify-center gap-4">
          {content.nums?.map((num) => (
            <div key={num.value} className="min-w-[200px] flex-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-6 py-6 text-center">
              <p className="d-stat text-[var(--primary)]">{num.value}</p>
              <p className="d-body mt-3 text-[var(--muted-foreground)]">{num.label}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // — Visual-top (problem, pipeline, algo, competitors, pricing, roadmap) —
  return (
    <div className="deck-visual-top">
      <SlideHeader content={content} tier={tier} accent={accent} align="center" />
      {content.visual && <VisualFor key={slide.id} v={content.visual} lang={lang} />}

      {content.rows && (
        <div className="flex w-full max-w-[680px] flex-col gap-1.5">
          {content.rows.map((row) => (
            <div key={row.tool} className={`flex items-center gap-4 rounded-[10px] border px-4 py-2.5 ${row.highlight ? "border-[var(--primary)] bg-[oklch(0.56_0.2_257/0.06)]" : "border-[var(--border)] bg-[var(--card)]"}`}>
              <span className={`w-28 shrink-0 d-mono text-[12px] font-semibold ${row.highlight ? "text-[var(--primary)]" : "text-[var(--foreground)]"}`}>{row.tool}</span>
              <span className={`text-[12px] ${row.highlight ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"}`}>{row.trait}</span>
            </div>
          ))}
        </div>
      )}

      {content.cols && (
        <div className="grid w-full max-w-[680px] grid-cols-2 gap-3">
          {content.cols.map((col) => (
            <div key={col.label} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] p-5">
              <p className="d-subtitle text-[var(--foreground)]">{col.label}</p>
              <p className="d-body mt-1 text-[var(--muted-foreground)]">{col.desc}</p>
            </div>
          ))}
        </div>
      )}

      {content.roadmap && <RoadmapTimeline items={content.roadmap} />}

      {content.quote && (
        <blockquote className="max-w-[680px] border-l-2 py-0.5 pl-4" style={{ borderColor: accent }}>
          <p className="text-[15px] font-medium italic text-[var(--foreground)]">{content.quote}</p>
        </blockquote>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function PitchPage() {
  const [slide, setSlide] = useState(0);
  const [lang, setLang] = useState<Lang>("fr");
  const router = useRouter();
  const mainRef = useRef<HTMLElement | null>(null);
  const scale = useFitScale(mainRef, STAGE_W, STAGE_H);

  const total = SLIDES.length;
  const current = SLIDES[slide];
  const content = current[lang];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setSlide((s) => Math.max(0, s - 1));
      if (e.key === "ArrowRight") setSlide((s) => Math.min(SLIDES.length - 1, s + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[var(--background)]">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] px-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="d-mono text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]">← Hub</Link>
          <span className="h-3 w-px bg-[var(--border)]" />
          <span className="d-kicker text-[var(--muted-foreground)]">{content.tag}</span>
        </div>
        <button type="button" onClick={() => setLang((l) => (l === "en" ? "fr" : "en"))}
          className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 d-mono text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]">
          {lang === "en" ? "FR" : "EN"}
        </button>
      </header>

      <main ref={mainRef} className="flex flex-1 items-center justify-center overflow-hidden p-6">
        <div
          className="deck-stage"
          data-slide-bg={current.type}
          style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})`, transformOrigin: "center center" }}
        >
          <SlideView slide={current} content={content} lang={lang} onCta={(href) => router.push(href)} />
        </div>
      </main>

      <footer className="flex h-14 shrink-0 items-center justify-between border-t border-[var(--border)] px-8">
        <button type="button" onClick={() => setSlide((s) => Math.max(0, s - 1))} disabled={slide === 0}
          className="d-mono text-[var(--muted-foreground)] transition hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-30">
          {lang === "en" ? "← Prev" : "← Préc."}
        </button>
        <span className="d-mono text-[var(--muted-foreground)]">{String(slide + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
        <button type="button" onClick={() => setSlide((s) => Math.min(SLIDES.length - 1, s + 1))} disabled={slide === total - 1}
          className="d-mono text-[var(--muted-foreground)] transition hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-30">
          {lang === "en" ? "Next →" : "Suiv. →"}
        </button>
      </footer>
    </div>
  );
}
