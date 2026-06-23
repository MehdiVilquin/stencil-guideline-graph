"use client";

// Salesbook for Stencil — a CLIENT-facing deck (vs /pitch, which is for investors).
// Goal: cover the sale. The buyer recognizes their pain (brain-guideline / rule-book
// / wasted time), sees the market pain, the cost, the benefits, the price — and by
// the last slide, wants it. Reuses the deck scaffolding (1280×720 canvas, fit-scale,
// keyboard nav, bilingual) and globals.css classes. Violet identity to differ from /pitch.

import { useState, useEffect, useRef, type RefObject } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BenefitsGrid } from "@/app/pitch/visuals";

// ─── Virtual slide canvas (same frame as /pitch) ─────────────────────────────
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

// Violet identity — keeps the salesbook visually distinct from the blue pitch deck.
const ACC = "oklch(0.52 0.2 295)";
const ACC_BG = "oklch(0.52 0.2 295 / 0.08)";
const ACC_BORDER = "oklch(0.52 0.2 295 / 0.28)";

// ─── Types ───────────────────────────────────────────────────────────────────
type Lang = "en" | "fr";
type Kind =
  | "cover" | "recognition" | "marketpain" | "cost" | "client"
  | "shift" | "benefits" | "proof" | "pricing" | "teaser" | "close";

interface Src { label: string; href: string }
interface PainCard { icon: "user" | "book" | "clock"; title: string; desc: string }
interface Stat { value: string; label: string; src?: Src[] }
interface Pair { label: string; desc: string }
interface Content {
  kicker: string; title: string; body?: string; quote?: string;
  cards?: PainCard[]; stats?: Stat[]; cols?: Pair[]; tags?: string[];
  before?: string; after?: string; proof?: string;
  cta?: { label: string; href: string };
}
interface Slide { id: string; kind: Kind; en: Content; fr: Content }

// ─── Slide data (11 · bilingual) ─────────────────────────────────────────────
const SLIDES: Slide[] = [
  { id: "cover", kind: "cover",
    en: { kicker: "Stencil · Salesbook", title: "Your brand has rules.\nYour content breaks them.",
      body: "What if every word your team ships was on-brand — automatically?" },
    fr: { kicker: "Stencil · Salesbook", title: "Votre marque a des règles.\nVos contenus les cassent.",
      body: "Et si chaque mot publié par vos équipes était on-brand — automatiquement ?" } },

  { id: "recognition", kind: "recognition",
    en: { kicker: "Does this sound familiar?", title: "You already live this.",
      cards: [
        { icon: "user", title: "The guideline lives in one person's head", desc: "The day they're not around, no one can say what's on-brand." },
        { icon: "book", title: "A 60-page brand book nobody reads", desc: "By page 12, everyone is improvising." },
        { icon: "clock", title: "Every copy goes through 3 review rounds", desc: "Hours lost catching the same mistakes, again." },
      ] },
    fr: { kicker: "Ça vous parle ?", title: "Vous vivez déjà ça.",
      cards: [
        { icon: "user", title: "La guideline vit dans la tête d'une seule personne", desc: "Le jour où elle n'est pas là, plus personne ne sait trancher." },
        { icon: "book", title: "Un brand book de 60 pages que personne ne lit", desc: "Dès la page 12, tout le monde improvise." },
        { icon: "clock", title: "Chaque texte passe par 3 tours de relecture", desc: "Des heures à rattraper les mêmes erreurs." },
      ] } },

  { id: "marketpain", kind: "marketpain",
    en: { kicker: "It's not just you", title: "The whole market leaks brand.",
      stats: [
        { value: "81%", label: "of companies struggle to keep content on-brand",
          src: [{ label: "Lucidpress", href: "https://www.prnewswire.com/news-releases/study-finds-companies-with-consistent-branding-can-see-up-to-33-increase-in-revenue-300967219.html" }] },
        { value: "95% → 25%", label: "have brand guidelines — only 25% enforce them",
          src: [
            { label: "Renderforest", href: "https://www.renderforest.com/blog/brand-statistics" },
            { label: "GitNux", href: "https://gitnux.org/brand-consistency-statistics/" },
          ] },
        { value: "+50%/yr", label: "content volume climbs every single year",
          src: [{ label: "Lucidpress", href: "https://www.prnewswire.com/news-releases/study-finds-companies-with-consistent-branding-can-see-up-to-33-increase-in-revenue-300967219.html" }] },
      ] },
    fr: { kicker: "Ce n'est pas que vous", title: "Tout le marché fuit sa marque.",
      stats: [
        { value: "81 %", label: "des entreprises galèrent à rester on-brand",
          src: [{ label: "Lucidpress", href: "https://www.prnewswire.com/news-releases/study-finds-companies-with-consistent-branding-can-see-up-to-33-increase-in-revenue-300967219.html" }] },
        { value: "95 % → 25 %", label: "ont des guidelines — 25 % seulement les appliquent",
          src: [
            { label: "Renderforest", href: "https://www.renderforest.com/blog/brand-statistics" },
            { label: "GitNux", href: "https://gitnux.org/brand-consistency-statistics/" },
          ] },
        { value: "+50 %/an", label: "le volume de contenu grimpe, chaque année",
          src: [{ label: "Lucidpress", href: "https://www.prnewswire.com/news-releases/study-finds-companies-with-consistent-branding-can-see-up-to-33-increase-in-revenue-300967219.html" }] },
      ] } },

  { id: "cost", kind: "cost",
    en: { kicker: "The real cost", title: "Off-brand isn't free.",
      cols: [
        { label: "Wasted hours", desc: "Reviews that should take minutes take days." },
        { label: "Inconsistency", desc: "Every channel sounds like a different company." },
        { label: "Compliance risk", desc: "One wrong claim in pharma or finance is a fine." },
        { label: "Revenue left behind", desc: "Consistent brands earn up to +33% more." },
      ] },
    fr: { kicker: "Le vrai coût", title: "Le off-brand n'est pas gratuit.",
      cols: [
        { label: "Heures perdues", desc: "Des relectures qui devraient prendre des minutes prennent des jours." },
        { label: "Incohérence", desc: "Chaque canal sonne comme une autre entreprise." },
        { label: "Risque conformité", desc: "Une mauvaise allégation en pharma ou finance, c'est une amende." },
        { label: "Revenus laissés", desc: "Les marques cohérentes gagnent jusqu'à +33 %." },
      ] } },

  { id: "client", kind: "client",
    en: { kicker: "Built for you", title: "If your brand can't afford to drift.",
      body: "Regulated, multi-market, high-volume — the brands where every word is checked.",
      tags: ["Beauty & cosmetics", "Pharma & health", "Luxury & fashion", "Multi-market brands", "Content & social teams", "Agencies at scale"] },
    fr: { kicker: "Pensé pour vous", title: "Si votre marque ne peut pas se permettre de dériver.",
      body: "Régulées, multi-marchés, gros volume — les marques où chaque mot est vérifié.",
      tags: ["Beauté & cosmétique", "Pharma & santé", "Luxe & mode", "Marques multi-marchés", "Équipes contenu & social", "Agences à l'échelle"] } },

  { id: "shift", kind: "shift",
    en: { kicker: "The shift", title: "Your rules, enforced automatically.",
      body: "Stencil turns your guidelines into a living rule engine. Every piece of copy is checked, fixed, and proven on-brand — before it ever reaches review." },
    fr: { kicker: "Le basculement", title: "Vos règles, appliquées automatiquement.",
      body: "Stencil transforme vos guidelines en un moteur de règles vivant. Chaque texte est vérifié, corrigé et prouvé on-brand — avant même la relecture." } },

  { id: "benefits", kind: "benefits",
    en: { kicker: "What you get", title: "From 3 review rounds to zero.",
      cols: [
        { label: "Time back", desc: "Reviews in seconds, not days." },
        { label: "Always on-brand", desc: "Every output, provably consistent." },
        { label: "Never out of compliance", desc: "Legal & medical rules simply can't be broken." },
        { label: "Defend any choice", desc: "Every decision is traced and explainable." },
      ] },
    fr: { kicker: "Ce que vous gagnez", title: "De 3 tours de relecture à zéro.",
      cols: [
        { label: "Du temps rendu", desc: "Relecture en secondes, pas en jours." },
        { label: "Toujours on-brand", desc: "Chaque sortie, cohérente et prouvée." },
        { label: "Jamais hors-conformité", desc: "Les règles légales & médicales ne peuvent pas être cassées." },
        { label: "Défendez chaque choix", desc: "Chaque décision est tracée et explicable." },
      ] } },

  { id: "proof", kind: "proof",
    en: { kicker: "See the difference", title: "Same brief. On-brand, proven.",
      before: "Anti-Aging Serum: now only €50 — visibly younger skin!!!",
      after: "Radiance Serum — visible luminosity, the science of light.",
      proof: "✓ no forbidden claim   ✓ tone respected   ✓ length within bound",
      cta: { label: "Try it yourself →", href: "/prototype" } },
    fr: { kicker: "Voyez la différence", title: "Même brief. On-brand, prouvé.",
      before: "Sérum Anti-Âge : maintenant à 50 € — peau visiblement plus jeune !!!",
      after: "Sérum Éclat — luminosité visible, la science de la lumière.",
      proof: "✓ aucune allégation interdite   ✓ ton respecté   ✓ longueur dans la borne",
      cta: { label: "Essayez vous-même →", href: "/prototype" } } },

  { id: "pricing", kind: "pricing",
    en: { kicker: "Pricing", title: "Start as a design partner.",
      cols: [
        { label: "Beta subscription", desc: "€49–149 / month per brand" },
        { label: "API usage", desc: "Pay-as-you-go above quota" },
      ],
      quote: "Early partners shape the product and lock in beta pricing. Against the hours you save and the +33% consistency upside, it pays for itself." },
    fr: { kicker: "Tarif", title: "Démarrez en design partner.",
      cols: [
        { label: "Abonnement beta", desc: "49–149 € / mois par marque" },
        { label: "Usage API", desc: "Pay-as-you-go au-delà du quota" },
      ],
      quote: "Les premiers partenaires façonnent le produit et verrouillent le tarif beta. Rapporté aux heures gagnées et au +33 % de cohérence, ça se rembourse tout seul." } },

  { id: "teaser", kind: "teaser",
    en: { kicker: "This is just feature one", title: "Next: on-brand images & video.",
      body: "The same rule engine, extended to visuals — generate images and video that obey your brand, automatically. Your guidelines, in every medium." },
    fr: { kicker: "Ce n'est que la feature 1", title: "La suite : images & vidéos on-brand.",
      body: "Le même moteur de règles, étendu au visuel — générez images et vidéos qui respectent votre marque, automatiquement. Vos guidelines, dans chaque média." } },

  { id: "close", kind: "close",
    en: { kicker: "Let's talk", title: "Your brand, finally\nimpossible to break.",
      cta: { label: "See the live prototype →", href: "/prototype" } },
    fr: { kicker: "Parlons-en", title: "Votre marque, enfin\nimpossible à casser.",
      cta: { label: "Voir le prototype en direct →", href: "/prototype" } } },
];

// ─── Atoms ───────────────────────────────────────────────────────────────────
function CardIcon({ name }: { name: PainCard["icon"] }) {
  const p = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: ACC, strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "user") return <svg {...p}><circle cx="12" cy="8" r="4" /><path d="M5 21c0-4 3.5-6 7-6s7 2 7 6" /></svg>;
  if (name === "book") return <svg {...p}><path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19v15H7.5A2.5 2.5 0 0 0 5 19.5z" /><path d="M5 19.5A2.5 2.5 0 0 0 7.5 22H19" /></svg>;
  return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>;
}

function SrcLinks({ src }: { src?: Src[] }) {
  if (!src) return null;
  return (
    <div className="mt-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1 pt-3">
      {src.map((s) => (
        <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer"
          className="d-mono text-[10px] text-[var(--muted-foreground)] underline decoration-dotted underline-offset-2 transition hover:text-[var(--foreground)]">
          {s.label} ↗
        </a>
      ))}
    </div>
  );
}

function Cta({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="rounded-full px-10 py-4 text-[16px] font-semibold text-white shadow-[0_4px_24px_oklch(0.52_0.2_295/0.4)] transition hover:opacity-90"
      style={{ background: ACC }}>
      {label}
    </button>
  );
}

function Header({ c, big }: { c: Content; big?: boolean }) {
  return (
    <div className="text-center">
      <p className="d-kicker mb-3" style={{ color: ACC }}>{c.kicker}</p>
      <h2 className={`${big ? "d-title-xl" : "d-title-lg"} text-[var(--foreground)] ${c.title.includes("\n") ? "whitespace-pre-line" : ""}`}>
        {c.title}
      </h2>
      {c.body && <p className="d-body mt-4 mx-auto max-w-2xl text-[var(--muted-foreground)]">{c.body}</p>}
    </div>
  );
}

// ─── Slide renderer ──────────────────────────────────────────────────────────
function SlideView({ slide, c, onCta }: { slide: Slide; c: Content; onCta: (href: string) => void }) {
  switch (slide.kind) {
    case "cover":
      return (
        <div className="deck-hero">
          <span className="mb-7 flex h-16 w-16 items-center justify-center rounded-[18px] text-white shadow-[var(--shadow-sm)]" style={{ background: ACC }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
              <line x1="3" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="15" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="12" y1="3" x2="12" y2="9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="12" y1="15" x2="12" y2="21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <h1 className="d-title-xl whitespace-pre-line text-[var(--foreground)]">{c.title}</h1>
          {c.body && <p className="d-subtitle mt-5 max-w-xl" style={{ color: ACC }}>{c.body}</p>}
        </div>
      );

    case "close":
      return (
        <div className="deck-hero">
          <Header c={c} big />
          {c.cta && <Cta label={c.cta.label} onClick={() => onCta(c.cta!.href)} />}
        </div>
      );

    case "recognition":
      return (
        <div className="deck-visual-top">
          <Header c={c} />
          <div className="flex w-full max-w-[940px] items-stretch justify-center gap-4">
            {c.cards?.map((card) => (
              <div key={card.title} className="flex flex-1 flex-col rounded-[var(--radius-sm)] border bg-[var(--card)] p-6 text-left" style={{ borderColor: ACC_BORDER }}>
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-[12px]" style={{ background: ACC_BG }}>
                  <CardIcon name={card.icon} />
                </span>
                <p className="text-[16px] font-semibold leading-snug text-[var(--foreground)]">{card.title}</p>
                <p className="d-body mt-2 text-[var(--muted-foreground)]">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case "marketpain":
      return (
        <div className="deck-visual-top">
          <Header c={c} />
          <div className="flex w-full max-w-[940px] flex-wrap justify-center gap-4">
            {c.stats?.map((s) => (
              <div key={s.value} className="flex min-w-[240px] flex-1 flex-col rounded-[var(--radius-sm)] border bg-[var(--card)] px-6 py-6 text-center" style={{ borderColor: ACC_BORDER }}>
                <p className="text-[34px] font-bold leading-none tracking-[-0.02em] tabular-nums" style={{ color: ACC }}>{s.value}</p>
                <p className="d-body mt-3 text-[var(--muted-foreground)]">{s.label}</p>
                <SrcLinks src={s.src} />
              </div>
            ))}
          </div>
        </div>
      );

    case "cost":
      return (
        <div className="deck-visual-top">
          <Header c={c} />
          <div className="grid w-full max-w-[820px] grid-cols-2 gap-4">
            {c.cols?.map((col) => (
              <div key={col.label} className="rounded-[var(--radius-sm)] border-l-2 bg-[var(--card)] py-3 pl-5 pr-4" style={{ borderColor: ACC }}>
                <p className="d-subtitle text-[var(--foreground)]">{col.label}</p>
                <p className="d-body mt-1 text-[var(--muted-foreground)]">{col.desc}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case "client":
      return (
        <div className="deck-hero">
          <Header c={c} />
          <div className="flex max-w-[820px] flex-wrap justify-center gap-2.5">
            {c.tags?.map((t) => (
              <span key={t} className="rounded-full border bg-[var(--card)] px-4 py-2 text-[14px] font-medium text-[var(--foreground)]" style={{ borderColor: ACC_BORDER }}>{t}</span>
            ))}
          </div>
        </div>
      );

    case "shift":
      return (
        <div className="deck-hero">
          <Header c={c} big />
        </div>
      );

    case "benefits":
      return (
        <div className="deck-visual-top">
          <Header c={c} />
          {c.cols && <BenefitsGrid cols={c.cols} accent={ACC} />}
        </div>
      );

    case "proof":
      return (
        <div className="deck-visual-top">
          <Header c={c} />
          <div className="flex w-full max-w-[720px] flex-col gap-3">
            <div className="rounded-[var(--radius-sm)] border border-[var(--destructive)] bg-[oklch(0.63_0.2_25/0.05)] px-5 py-3.5">
              <p className="d-kicker mb-1.5 text-[var(--destructive)]">✗ off-brand</p>
              <p className="d-mono text-[var(--foreground)]">“{c.before}”</p>
            </div>
            <div className="rounded-[var(--radius-sm)] border px-5 py-3.5" style={{ borderColor: ACC, background: ACC_BG }}>
              <p className="d-kicker mb-1.5" style={{ color: ACC }}>✓ on-brand · proven</p>
              <p className="d-mono text-[var(--foreground)]">“{c.after}”</p>
              {c.proof && <p className="d-mono mt-2 text-[var(--muted-foreground)]">{c.proof}</p>}
            </div>
          </div>
          {c.cta && <Cta label={c.cta.label} onClick={() => onCta(c.cta!.href)} />}
        </div>
      );

    case "pricing":
      return (
        <div className="deck-visual-top">
          <Header c={c} />
          <div className="grid w-full max-w-[680px] grid-cols-2 gap-3">
            {c.cols?.map((col) => (
              <div key={col.label} className="rounded-[var(--radius-sm)] border bg-[var(--card)] p-5" style={{ borderColor: ACC_BORDER }}>
                <p className="d-subtitle text-[var(--foreground)]">{col.label}</p>
                <p className="mt-2 text-[20px] font-bold tracking-[-0.01em]" style={{ color: ACC }}>{col.desc}</p>
              </div>
            ))}
          </div>
          {c.quote && (
            <blockquote className="max-w-[680px] border-l-2 py-0.5 pl-4" style={{ borderColor: ACC }}>
              <p className="text-[15px] font-medium italic text-[var(--foreground)]">{c.quote}</p>
            </blockquote>
          )}
        </div>
      );

    case "teaser":
      return (
        <div className="deck-hero">
          <Header c={c} />
          <div className="flex items-center gap-3">
            <span className="rounded-full border px-5 py-2.5 text-[14px] font-semibold" style={{ borderColor: ACC, color: ACC, background: ACC_BG }}>Text ✓</span>
            <span className="font-mono text-[var(--muted-foreground)]" aria-hidden>→</span>
            <span className="rounded-full border border-[var(--border)] bg-[var(--card)] px-5 py-2.5 text-[14px] font-medium text-[var(--muted-foreground)]">Image · soon</span>
            <span className="rounded-full border border-[var(--border)] bg-[var(--card)] px-5 py-2.5 text-[14px] font-medium text-[var(--muted-foreground)]">Video · soon</span>
          </div>
        </div>
      );
  }
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function SalesbookPage() {
  const [slide, setSlide] = useState(0);
  const [lang, setLang] = useState<Lang>("fr");
  const router = useRouter();
  const mainRef = useRef<HTMLElement | null>(null);
  const scale = useFitScale(mainRef, STAGE_W, STAGE_H);

  const total = SLIDES.length;
  const current = SLIDES[slide];
  const c = current[lang];
  const hero = current.kind === "cover" || current.kind === "close" || current.kind === "teaser";

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
          <span className="d-kicker text-[var(--muted-foreground)]">{c.kicker}</span>
        </div>
        <button type="button" onClick={() => setLang((l) => (l === "en" ? "fr" : "en"))}
          className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 d-mono text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]">
          {lang === "en" ? "FR" : "EN"}
        </button>
      </header>

      <main ref={mainRef} className="flex flex-1 items-center justify-center overflow-hidden p-6">
        <div
          className="deck-stage"
          style={{
            width: STAGE_W, height: STAGE_H, transform: `scale(${scale})`, transformOrigin: "center center",
            background: hero
              ? "linear-gradient(150deg, var(--card) 0%, oklch(0.52 0.2 295 / 0.10) 100%)"
              : "var(--background)",
          }}
        >
          <SlideView slide={current} c={c} onCta={(href) => router.push(href)} />
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
