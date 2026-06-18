// Quality eval for the Créer (write) / Corriger (rewrite) pipeline.
// Exercises the REAL pipeline (generate → verify → repair) against live LLM
// backends, scores deterministic compliance PLUS quality heuristics the engine
// can't prove (quote artifacts, markdown fences, preamble, franglais leak), and
// compares models to separate pipeline issues from model issues.
//
//   npm run eval                       # the configured provider (GLM-4.7 via .env.local)
//   EVAL_LOCAL_COMPARE=1 npm run eval  # + local ollama:mistral comparison
//   EVAL_STRONG_KEY=gsk_… npm run eval # + Groq llama-3.3-70b comparison
//
// Writes eval/RESULTS.md and prints a summary. Never part of `npm test`.

import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { generate } from "@/lib/domain/generate";
import { defaultGraph } from "@/lib/domain/store";
import type { GenerationContext, GenerationResult } from "@/lib/domain/types";

const RULES = defaultGraph().rules;

// ── model profiles ─────────────────────────────────────────────────────────
interface Profile {
  id: string;
  baseURL: string;
  key: string;
  model: string;
}
const PROFILES: Profile[] = [
  {
    id: process.env.OPENAI_MODEL || "glm-4.7",
    baseURL: process.env.OPENAI_BASE_URL || "https://api.z.ai/api/paas/v4",
    key: process.env.OPENAI_API_KEY || "",
    model: process.env.OPENAI_MODEL || "glm-4.7",
  },
];
if (process.env.EVAL_LOCAL_COMPARE) {
  PROFILES.push({ id: "ollama:mistral", baseURL: "http://localhost:11434/v1", key: "ollama", model: "mistral" });
}
if (process.env.EVAL_STRONG_KEY) {
  PROFILES.push({
    id: "groq:llama-3.3-70b",
    baseURL: "https://api.groq.com/openai/v1",
    key: process.env.EVAL_STRONG_KEY,
    model: "llama-3.3-70b-versatile",
  });
}

// ── contexts & scenarios ───────────────────────────────────────────────────
const base: GenerationContext = {
  brand: "Lumière Paris",
  locale: "fr-FR",
  contentType: "Product Description",
  productCategory: "Skincare",
  productType: "SINGLE",
  field: "long_description",
};
const ctx = (p: Partial<GenerationContext>): GenerationContext => ({ ...base, ...p });

interface Scenario {
  id: string;
  group: "Créer" | "Corriger";
  mode: "write" | "rewrite";
  ctx: GenerationContext;
  input: string;
}

const FRANGLAIS_SAMPLE =
  '"""""""Vous avez choisi le moment parfait pour réveiller votre énergie intérieure avec Sérum Éclat Absolu de Maison Lumière, une formule qui vous apporte une wave d\'essor de la jeunesse, vous permettant de vous sentir plus vital et énergique, grâce à l\'action de l\'acide hyaluronique."""""""';

const WRITE: Scenario[] = [
  { id: "W1-long-fr", group: "Créer", mode: "write", ctx: ctx({}), input: "Sérum éclat anti-fatigue à l'acide hyaluronique et vitamine C, pour peaux ternes et déshydratées. Texture légère, absorption rapide, fini lumineux. Cible : femmes 30-45 ans, routine matin. Met en avant l'hydratation longue durée et l'éclat naturel." },
  { id: "W2-long-de", group: "Créer", mode: "write", ctx: ctx({ locale: "de-DE" }), input: "Leichtes, schnell einziehendes Glow-Serum mit Hyaluronsäure und Vitamin C für müde, fahle Haut. Langanhaltende Feuchtigkeit, natürlicher Glanz." },
  { id: "W3-mid-en", group: "Créer", mode: "write", ctx: ctx({ locale: "en-GB" }), input: "A lightweight radiance serum with hyaluronic acid for dull, dehydrated skin. Fast absorption, luminous finish." },
  { id: "W4-short-title-fr", group: "Créer", mode: "write", ctx: ctx({ field: "title" }), input: "Sérum éclat" },
  { id: "W5-oneword-title-fr", group: "Créer", mode: "write", ctx: ctx({ field: "title" }), input: "Hydratation" },
  { id: "W6-vague-fr", group: "Créer", mode: "write", ctx: ctx({ field: "short_description" }), input: "un truc qui donne envie, fais au mieux" },
  { id: "W7-slang-fr", group: "Créer", mode: "write", ctx: ctx({ field: "short_description" }), input: "rends ça stylé et jeune, fais court" },
  { id: "W8-trap-fr", group: "Créer", mode: "write", ctx: ctx({ field: "title" }), input: "punchy anti-aging, pas cher !" },
  { id: "W9-enbrief-frout", group: "Créer", mode: "write", ctx: ctx({}), input: "a luxurious anti-aging serum that makes your skin glow, mention hyaluronic acid and a youthful boost" },
  { id: "W10-bullets-it", group: "Créer", mode: "write", ctx: ctx({ locale: "it-IT", productCategory: "Fragrance", field: "bullet_points" }), input: "profumo elegante, note floreali e legnose, lunga tenuta" },
];

const longTitle =
  "Sérum Éclat Absolu Anti-Aging Premium Luxe pour une Peau Visiblement Plus Jeune Lumineuse et Repulpée en Seulement Quelques Jours d'Utilisation Quotidienne Matin et Soir";

const REWRITE: Scenario[] = [
  { id: "R-A-demo", group: "Corriger", mode: "rewrite", ctx: ctx({ locale: "de-DE", field: "title" }), input: "Anti-Aging Serum für €50! Jetzt kaufen!" },
  { id: "R-B-medical", group: "Corriger", mode: "rewrite", ctx: ctx({}), input: "Ce sérum guérit l'acné et est cliniquement prouvé pour effacer définitivement les rides." },
  { id: "R-C-commercial", group: "Corriger", mode: "rewrite", ctx: ctx({ field: "short_description" }), input: "Sérum pas cher, vraie bonne affaire, prix discount incroyable, profitez-en !" },
  { id: "R-D-overlong", group: "Corriger", mode: "rewrite", ctx: ctx({ field: "title" }), input: longTitle },
  { id: "R-E-straightquotes", group: "Corriger", mode: "rewrite", ctx: ctx({}), input: 'Notre "sérum éclat" est tout simplement "incroyable" pour votre peau.' },
  { id: "R-F-wrongform-de", group: "Corriger", mode: "rewrite", ctx: ctx({ locale: "de-DE" }), input: "Ein Serum mit Hyaluron-Saeure für strahlende Haut." },
  { id: "R-G-franglais", group: "Corriger", mode: "rewrite", ctx: ctx({}), input: "Ce serum est un game-changer, un vrai boost de glow pour un look fresh et youthful, vous allez feel la différence." },
  { id: "R-H-clean", group: "Corriger", mode: "rewrite", ctx: ctx({ field: "title" }), input: "Sérum à l'acide hyaluronique pour une peau visiblement plus éclatante" },
  { id: "R-I-kitchensink", group: "Corriger", mode: "rewrite", ctx: ctx({}), input: "Anti-aging miracle pas cher à €30 !!! Guérit les rides, cliniquement prouvé, le meilleur \"deal\" du marché !!!" },
  { id: "R-J-garbage", group: "Corriger", mode: "rewrite", ctx: ctx({ field: "short_description" }), input: "..." },
  { id: "R-K-userexample", group: "Corriger", mode: "rewrite", ctx: ctx({}), input: FRANGLAIS_SAMPLE },
];

const ALL = [...WRITE, ...REWRITE];
const ONLY = process.env.EVAL_IDS?.split(",").map((s) => s.trim());
const SCENARIOS = ONLY ? ALL.filter((s) => ONLY.includes(s.id)) : ALL;

// ── quality heuristics (what the deterministic verifier can't prove) ────────
const EN_MARKERS = [
  "the", "you", "your", "with", "and", "for", "this", "our", "boost", "wave", "glow",
  "amazing", "youthful", "feeling", "feel", "forever", "wow", "skincare", "flawless",
  "gorgeous", "stunning", "unlock", "game-changer", "look", "fresh", "vibe", "ageless",
];

function artifacts(copy: string): string[] {
  const t = copy.trim();
  const f: string[] = [];
  if (/^["“”'`]/.test(t) || /["“”'`]$/.test(t)) f.push("wrapping-quote");
  if (/"{3,}|'{3,}/.test(copy)) f.push("triple-quote");
  if (/```/.test(copy)) f.push("md-fence");
  if (/^(voici|bien sûr|bien sur|here is|here's|sure[,:]|d'accord|certainly|of course|as an ai|en tant qu)/i.test(t))
    f.push("preamble");
  if (t.length < 8) f.push("empty");
  return f;
}

function langLeak(copy: string, locale: string): { count: number; tokens: string[] } {
  if (locale.startsWith("en")) return { count: 0, tokens: [] };
  const found = new Set<string>();
  for (const w of EN_MARKERS) {
    // hyphen is literal outside a char class — must NOT be escaped under the u flag
    const re = new RegExp(`(^|[^\\p{L}])${w}([^\\p{L}]|$)`, "iu");
    if (re.test(copy)) found.add(w);
  }
  return { count: found.size, tokens: [...found] };
}

interface Row {
  profile: string;
  id: string;
  group: string;
  locale: string;
  field: string;
  attempts: number;
  greens: number;
  provable: number;
  allGreen: boolean;
  artifacts: string[];
  leak: { count: number; tokens: string[] };
  copy: string;
  error?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let to: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, rej) => {
    to = setTimeout(() => rej(new Error(`timeout ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    clearTimeout(to!);
  }
}

async function runScenario(s: Scenario): Promise<GenerationResult> {
  const opts = s.mode === "write" ? { brief: s.input, mode: "write" as const } : { draft: s.input, mode: "rewrite" as const };
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await withTimeout(generate(RULES, s.ctx, opts), 240_000);
    } catch (e) {
      lastErr = e;
      if (/429|rate|quota/i.test(String(e))) await sleep(4000);
      else break;
    }
  }
  throw lastErr;
}

async function ollamaUp(): Promise<boolean> {
  try {
    const r = await withTimeout(fetch("http://localhost:11434/api/tags"), 4000);
    return r.ok;
  } catch {
    return false;
  }
}

function setProfile(p: Profile) {
  process.env.OPENAI_BASE_URL = p.baseURL;
  process.env.OPENAI_API_KEY = p.key;
  process.env.OPENAI_MODEL = p.model;
}

describe("generation quality eval", () => {
  it("runs scenarios across model profiles and writes a report", async () => {
    const ollamaReachable = await ollamaUp();
    const rows: Row[] = [];

    for (const p of PROFILES) {
      if (p.baseURL.includes("11434") && !ollamaReachable) {
        console.log(`SKIP ${p.id} — Ollama injoignable sur localhost:11434`);
        continue;
      }
      setProfile(p);
      console.log(`\n=== profil ${p.id} (${SCENARIOS.length} cas) ===`);
      for (const s of SCENARIOS) {
        const t0 = Date.now();
        try {
          const r = await runScenario(s);
          const provable = r.report.filter((v) => v.verifiable).length;
          const greens = r.report.filter((v) => v.verifiable && v.pass).length;
          rows.push({
            profile: p.id,
            id: s.id,
            group: s.group,
            locale: s.ctx.locale,
            field: s.ctx.field,
            attempts: r.attempts,
            greens,
            provable,
            allGreen: r.allProvableGreen,
            artifacts: artifacts(r.copy),
            leak: langLeak(r.copy, s.ctx.locale),
            copy: r.copy,
          });
          const flags = [...artifacts(r.copy), langLeak(r.copy, s.ctx.locale).count ? "leak" : ""].filter(Boolean);
          console.log(
            `  ${s.id.padEnd(20)} ${greens}/${provable} green · ${r.attempts} essai · ${((Date.now() - t0) / 1000) | 0}s ${flags.length ? "⚠ " + flags.join(",") : "✓"}`,
          );
        } catch (e) {
          rows.push({
            profile: p.id, id: s.id, group: s.group, locale: s.ctx.locale, field: s.ctx.field,
            attempts: 0, greens: 0, provable: 0, allGreen: false, artifacts: [], leak: { count: 0, tokens: [] },
            copy: "", error: String(e).slice(0, 200),
          });
          console.log(`  ${s.id.padEnd(20)} ERROR ${String(e).slice(0, 80)}`);
        }
      }
    }

    writeFileSync("eval/RESULTS.md", report(rows), "utf8");
    console.log("\n→ eval/RESULTS.md écrit");
    expect(rows.length).toBeGreaterThan(0);
  });
});

// ── report rendering ────────────────────────────────────────────────────────
function report(rows: Row[]): string {
  const L: string[] = [];
  const profiles = [...new Set(rows.map((r) => r.profile))];
  L.push("# Éval qualité génération — résultats");
  L.push("");
  L.push(`Profils : ${profiles.join(" · ") || "(aucun)"}`);
  L.push("");

  for (const prof of profiles) {
    const rs = rows.filter((r) => r.profile === prof);
    const ok = rs.filter((r) => !r.error);
    const allGreen = ok.filter((r) => r.allGreen).length;
    const withArtifacts = ok.filter((r) => r.artifacts.length).length;
    const withLeak = ok.filter((r) => r.leak.count > 0).length;
    const avgAttempts = ok.length ? (ok.reduce((a, r) => a + r.attempts, 0) / ok.length).toFixed(2) : "—";
    const errors = rs.filter((r) => r.error).length;

    L.push(`## ${prof}`);
    L.push("");
    L.push(`- cas OK : **${ok.length}/${rs.length}** (${errors} erreurs)`);
    L.push(`- tout-prouvé-vert : **${allGreen}/${ok.length}**`);
    L.push(`- avec artefacts (quotes/fence/préambule/vide) : **${withArtifacts}/${ok.length}**`);
    L.push(`- avec fuite de langue (franglais) : **${withLeak}/${ok.length}**`);
    L.push(`- essais moyens : **${avgAttempts}**`);
    L.push("");
    L.push("| cas | grp | loc | green | essais | artefacts | leak |");
    L.push("|---|---|---|---|---|---|---|");
    for (const r of rs) {
      if (r.error) {
        L.push(`| ${r.id} | ${r.group} | ${r.locale} | — | — | ERROR: ${r.error.replace(/\|/g, "/")} | — |`);
        continue;
      }
      L.push(
        `| ${r.id} | ${r.group} | ${r.locale} | ${r.greens}/${r.provable} | ${r.attempts} | ${r.artifacts.join(",") || "—"} | ${r.leak.tokens.join(",") || "—"} |`,
      );
    }
    L.push("");
    // worst examples — anything with an artifact or leak
    const worst = rs.filter((r) => !r.error && (r.artifacts.length || r.leak.count));
    if (worst.length) {
      L.push("### Exemples problématiques (copie brute)");
      L.push("");
      for (const r of worst) {
        L.push(`**${r.id}** — artefacts: ${r.artifacts.join(",") || "—"} · leak: ${r.leak.tokens.join(",") || "—"}`);
        L.push("```");
        L.push(r.copy);
        L.push("```");
        L.push("");
      }
    }
  }
  return L.join("\n") + "\n";
}
