// GLM-4.7 smoke eval — 25 generations, 5 per language across 5 locales.
// Goal: check the (French) system prompt is well-adapted to a much stronger
// model. Exercises the REAL write pipeline (generate → verify → repair) and
// scores each output with the DETERMINISTIC verifier (the report IS the proof),
// plus quality heuristics the engine can't prove (formatting artifacts, EN leak).
//
//   npx vitest run --config vitest.eval.config.ts eval/glm-smoke.eval.ts
//
// Writes eval/RESULTS_GLM.md and prints a per-language summary.

import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { generate } from "@/lib/domain/generate";
import { defaultGraph } from "@/lib/domain/store";
import type { GenerationContext, GenerationResult, Verdict } from "@/lib/domain/types";

const RULES = defaultGraph().rules;

const base: Omit<GenerationContext, "locale" | "field"> = {
  brand: "Lumière Paris",
  contentType: "Product Description",
  productCategory: "Skincare",
  productType: "SINGLE",
};

interface Case {
  id: string;
  locale: string;
  field: string;
  brief: string;
}

// 5 locales × 5 fields → 25 distinct briefs (different sentence each), so we
// exercise every length/structure channel in every language.
const LOCALES: { locale: string; label: string; briefs: [string, string, string, string, string] }[] = [
  {
    locale: "fr-FR",
    label: "FR",
    briefs: [
      "Sérum éclat anti-fatigue à l'acide hyaluronique et vitamine C pour peaux ternes, texture légère, fini lumineux.",
      "Crème hydratante de jour à l'aloe vera, absorption rapide, peau repulpée toute la journée.",
      "Sérum éclat à l'acide hyaluronique pour peaux ternes.",
      "Masque de nuit régénérant : rétinol doux, beurre de karité, lisse les ridules, réveille la peau.",
      "Huile démaquillante douce visage et yeux, élimine le maquillage waterproof sans agresser.",
    ],
  },
  {
    locale: "de-DE",
    label: "DE",
    briefs: [
      "Leichtes Glow-Serum mit Hyaluronsäure und Vitamin C für müde, fahle Haut, natürlicher Glanz.",
      "Feuchtigkeitscreme mit Aloe Vera, zieht schnell ein, den ganzen Tag aufgepolsterte Haut.",
      "Glow-Serum mit Hyaluronsäure für fahle Haut.",
      "Regenerierende Nachtmaske: mildes Retinol, Sheabutter, glättet feine Linien, weckt die Haut.",
      "Sanftes Reinigungsöl für Gesicht und Augen, entfernt wasserfestes Make-up schonend.",
    ],
  },
  {
    locale: "it-IT",
    label: "IT",
    briefs: [
      "Siero illuminante all'acido ialuronico e vitamina C per pelli spente, texture leggera, finish luminoso.",
      "Crema idratante giorno all'aloe vera, assorbimento rapido, pelle rimpolpata tutto il giorno.",
      "Siero illuminante all'acido ialuronico per pelli spente.",
      "Maschera notte rigenerante: retinolo delicato, burro di karité, leviga le rughe sottili.",
      "Olio detergente delicato viso e occhi, rimuove il trucco waterproof senza aggredire.",
    ],
  },
  {
    locale: "ja-JP",
    label: "JA",
    briefs: [
      "ヒアルロン酸とビタミンC配合の艶肌美容液。くすんだ肌に、軽いテクスチャーで明るい仕上がり。",
      "アロエベラ配合のデイモイスチャークリーム。すばやくなじみ、一日中うるおいハリ肌。",
      "くすみ肌のためのヒアルロン酸艶肌美容液。",
      "夜用再生マスク：マイルドなレチノール、シアバター、小じわをなめらかに、肌を目覚めさせる。",
      "敏感肌にやさしいクレンジングオイル。ウォータープルーフのメイクもやさしくオフ。",
    ],
  },
  {
    locale: "en-GB",
    label: "EN",
    briefs: [
      "Lightweight radiance serum with hyaluronic acid and vitamin C for dull, dehydrated skin, luminous finish.",
      "Daily moisturiser with aloe vera, fast absorption, plump skin all day.",
      "Radiance serum with hyaluronic acid for dull skin.",
      "Regenerating night mask: gentle retinol, shea butter, smooths fine lines, wakes up the skin.",
      "Gentle cleansing oil for face and eyes, removes waterproof make-up without stripping.",
    ],
  },
];

const FIELDS = ["long_description", "short_description", "title", "bullet_points", "seo_meta"];

const CASES: Case[] = LOCALES.flatMap((L) =>
  FIELDS.map((field, i) => ({
    id: `${L.label}-${field}`,
    locale: L.locale,
    field,
    brief: L.briefs[i],
  })),
);

// ── quality heuristics (what the deterministic verifier can't prove) ─────────
const EN_MARKERS = [
  "the", "you", "your", "with", "and", "for", "this", "our", "boost", "glow",
  "amazing", "youthful", "feel", "wow", "skincare", "flawless", "gorgeous",
  "stunning", "unlock", "game-changer", "look", "fresh", "vibe", "ageless", "radiance",
];

function artifacts(copy: string): string[] {
  const t = copy.trim();
  const f: string[] = [];
  if (/^["“”'`]/.test(t) || /["“”'`]$/.test(t)) f.push("wrapping-quote");
  if (/"{3,}|'{3,}/.test(copy)) f.push("triple-quote");
  if (/```/.test(copy)) f.push("md-fence");
  if (/^(voici|bien sûr|bien sur|here is|here's|sure[,:]|d'accord|certainly|of course|as an ai|en tant qu)/i.test(t))
    f.push("preamble");
  if (t.length < 6) f.push("empty");
  return f;
}

function enLeak(copy: string, locale: string): string[] {
  if (locale.startsWith("en") || locale.startsWith("ja")) return [];
  const found = new Set<string>();
  for (const w of EN_MARKERS) {
    const re = new RegExp(`(^|[^\\p{L}])${w}([^\\p{L}]|$)`, "iu");
    if (re.test(copy)) found.add(w);
  }
  return [...found];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Row {
  id: string;
  locale: string;
  field: string;
  attempts: number;
  greens: number;
  provable: number;
  allGreen: boolean;
  langOk: boolean;
  artifacts: string[];
  leak: string[];
  chars: number;
  copy: string;
  error?: string;
}

async function runOne(c: Case): Promise<Row> {
  const ctx: GenerationContext = { ...base, locale: c.locale, field: c.field };
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const res: GenerationResult = await generate(RULES, ctx, { brief: c.brief, mode: "write" });
      const provable = res.report.filter((v) => v.verifiable);
      const greens = provable.filter((v) => v.pass);
      const lang = res.report.find((v) => v.localId === "lang");
      return {
        id: c.id, locale: c.locale, field: c.field,
        attempts: res.attempts,
        greens: greens.length,
        provable: provable.length,
        allGreen: res.allProvableGreen,
        langOk: lang ? lang.pass : true,
        artifacts: artifacts(res.copy),
        leak: enLeak(res.copy, c.locale),
        chars: res.copy.trim().length,
        copy: res.copy,
      };
    } catch (e) {
      if (/429|rate|quota/i.test(String(e)) && attempt < 5) { await sleep(15000); continue; }
      return {
        id: c.id, locale: c.locale, field: c.field, attempts: 0, greens: 0, provable: 0,
        allGreen: false, langOk: false, artifacts: [], leak: [], chars: 0, copy: "",
        error: String(e),
      };
    }
  }
  throw new Error("unreachable");
}

describe("GLM-4.7 smoke eval (25 generations)", () => {
  it("runs 25 cases (5 per language) and reports", async () => {
    // Sequential + per-case spacing: z.ai's tier rate-limits bursts (429).
    const rows: Row[] = [];
    for (const c of CASES) {
      rows.push(await runOne(c));
      await sleep(1500);
    }

    // ── per-language aggregate ──
    const byLang = new Map<string, Row[]>();
    for (const r of rows) (byLang.get(r.locale) ?? byLang.set(r.locale, []).get(r.locale)!).push(r);

    const md: string[] = ["# GLM-4.7 smoke eval — 25 generations (5 / language)\n"];
    md.push(`Model: \`${process.env.OPENAI_MODEL}\` @ \`${process.env.OPENAI_BASE_URL}\`\n`);

    console.log("\n================ GLM-4.7 SMOKE EVAL ================\n");
    const head = "lang | green | allGreen | avgTry | artifacts | EN-leak | langOk";
    console.log(head);
    console.log("-".repeat(head.length));
    md.push("## Summary\n");
    md.push("| lang | provable green | allGreen | avg attempts | artifacts | EN leak | langOk |");
    md.push("|---|---|---|---|---|---|---|");

    for (const [locale, rs] of byLang) {
      const greens = rs.reduce((a, r) => a + r.greens, 0);
      const provable = rs.reduce((a, r) => a + r.provable, 0);
      const allGreen = rs.filter((r) => r.allGreen).length;
      const avgTry = (rs.reduce((a, r) => a + r.attempts, 0) / rs.length).toFixed(2);
      const arts = rs.reduce((a, r) => a + r.artifacts.length, 0);
      const leaks = rs.reduce((a, r) => a + r.leak.length, 0);
      const langOk = rs.filter((r) => r.langOk).length;
      console.log(
        `${locale} | ${greens}/${provable} | ${allGreen}/${rs.length} | ${avgTry} | ${arts} | ${leaks} | ${langOk}/${rs.length}`,
      );
      md.push(`| ${locale} | ${greens}/${provable} | ${allGreen}/${rs.length} | ${avgTry} | ${arts} | ${leaks} | ${langOk}/${rs.length} |`);
    }

    // ── per-case detail (markdown) ──
    md.push("\n## Per-case detail\n");
    md.push("| id | attempts | green | allGreen | langOk | artifacts | EN leak | chars | copy |");
    md.push("|---|---|---|---|---|---|---|---|---|");
    for (const r of rows) {
      const copy = r.error ? `⚠️ ${r.error}` : r.copy.replace(/\n+/g, " ⏎ ").slice(0, 140);
      md.push(
        `| ${r.id} | ${r.attempts} | ${r.greens}/${r.provable} | ${r.allGreen ? "✅" : "❌"} | ${r.langOk ? "✅" : "❌"} | ${r.artifacts.join(",") || "—"} | ${r.leak.join(",") || "—"} | ${r.chars} | ${copy} |`,
      );
    }

    const totalAllGreen = rows.filter((r) => r.allGreen).length;
    const totalArts = rows.reduce((a, r) => a + r.artifacts.length, 0);
    const totalLeak = rows.reduce((a, r) => a + r.leak.length, 0);
    const errored = rows.filter((r) => r.error).length;
    console.log(
      `\nTOTAL: ${totalAllGreen}/${rows.length} fully green · artifacts=${totalArts} · EN-leak=${totalLeak} · errors=${errored}\n`,
    );
    md.push(`\n**Total:** ${totalAllGreen}/${rows.length} fully green · artifacts=${totalArts} · EN-leak=${totalLeak} · errors=${errored}\n`);

    writeFileSync("eval/RESULTS_GLM.md", md.join("\n"));
    console.log("→ wrote eval/RESULTS_GLM.md\n");

    expect(rows.length).toBe(25);
    expect(errored).toBe(0);
  }, 3_600_000);
});
