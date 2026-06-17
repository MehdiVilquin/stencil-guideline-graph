// Generation + provable verification + bounded repair (E3).
//   LLM drafts → deterministic verifier checks each active rule → if a
//   MACHINE-CHECKABLE rule fails, feed the failing local_ids back and retry
//   (max 2). The report IS the proof.

import { complete } from '../llm';
import { directiveSignature, numericBound } from './directive';
import { resolve } from './precedence';
import { verifyAll, verifyLanguage } from './verifiers';
import { AttemptRecord, GenerationContext, GenerationResult, Rule, Verdict } from './types';

const CT_LABEL: Record<string, string> = {
  'lexical-forbidden': 'Termes interdits',
  'lexical-required': 'Termes / formes imposés',
  'format-pattern': 'Format & ponctuation',
  'length-bound': 'Longueur',
  structure: 'Structure',
  'register-tone': 'Registre & ton',
};

const LANG: Record<string, string> = {
  'fr-FR': 'français',
  'de-DE': 'allemand',
  'it-IT': 'italien',
  'ja-JP': 'japonais',
  'en-GB': 'anglais',
  'en-US': 'anglais',
};
/** Human language name for a locale, to harden the "write in X" instruction. */
function langName(locale: string): string {
  return LANG[locale] ?? LANG[locale.split('-')[0]] ?? `la langue du locale « ${locale} »`;
}

/** Turn the active rule set into an explicit, grouped instruction block. */
export function buildSystemPrompt(ctx: GenerationContext, active: Rule[]): string {
  const groups = new Map<string, Rule[]>();
  for (const r of active) {
    const arr = groups.get(r.constraintType) ?? [];
    arr.push(r);
    groups.set(r.constraintType, arr);
  }
  const lines: string[] = [];
  for (const [ct, rules] of groups) {
    lines.push(`\n## ${CT_LABEL[ct] ?? ct}`);
    for (const r of rules) {
      const flag = r.overridable ? '' : ' [INVARIANT — non négociable]';
      lines.push(`- (#${r.localId}) ${r.text}${flag}`);
    }
  }

  return [
    `Tu es un rédacteur de contenu e-commerce pour la marque « ${ctx.brand} ».`,
    `Contexte de génération : locale ${ctx.locale} · type ${ctx.contentType} · champ « ${ctx.field} » · produit ${ctx.productType}.`,
    ``,
    `Tu dois respecter EXACTEMENT toutes les règles ci-dessous. Elles ont déjà été`,
    `résolues (conflits tranchés) par un moteur déterministe — ne les remets pas en cause.`,
    `Les règles [INVARIANT] sont des garde-fous de conformité : jamais d'exception.`,
    lines.join('\n'),
    ``,
    `Écris EXCLUSIVEMENT en ${langName(ctx.locale)}. N'emploie AUCUN mot d'une autre langue`,
    `(pas de franglais) — seuls les noms propres de marque/produit peuvent rester tels quels.`,
    `Réponds UNIQUEMENT par le texte de la copie pour le champ « ${ctx.field} » :`,
    `pas de préambule, pas d'explication, pas de markdown, pas de titres,`,
    `et n'entoure JAMAIS ta réponse de guillemets.`,
  ].join('\n');
}

function userPrompt(ctx: GenerationContext, brief: string, draft: string, rewrite: boolean): string {
  if (rewrite && draft.trim()) {
    return [
      `Réécris la copie ci-dessous pour qu'elle respecte toutes les règles, sans changer son sens commercial.`,
      `Renvoie uniquement la copie réécrite (sans guillemets, sans préambule).`,
      ``,
      `[COPIE À RÉÉCRIRE]`,
      draft,
      `[FIN]`,
    ].join('\n');
  }
  return `Rédige la copie. Brief produit : ${brief || '(produit phare de la marque)'}.`;
}

function repairPrompt(prevCopy: string, failing: Verdict[]): string {
  const issues = failing
    .map((v) => {
      // Make length failures actionable: give the exact character budget.
      const m = v.evidence.match(/(\d+)\/(\d+)\s*caract/);
      // Bullet count: spell out the exact item range expected.
      const b = v.evidence.match(/éléments\s*\(borne\s*(\d+)[–-](\d+)\)/);
      const extra = m
        ? ` → RÉDUIS le texte à ${m[2]} caractères MAXIMUM (actuellement ${m[1]})`
        : b
          ? ` → produis EXACTEMENT ${b[1]} à ${b[2]} puces, une par ligne, sans point final`
          : '';
      return `- règle #${v.localId} (${v.ruleName}) : ${v.evidence}${extra}`;
    })
    .join('\n');
  return [
    `Ta copie précédente viole ces règles vérifiées mécaniquement :`,
    issues,
    ``,
    `[COPIE PRÉCÉDENTE]`,
    prevCopy,
    `[FIN]`,
    ``,
    `Corrige UNIQUEMENT ces violations, garde le reste, et reste dans la langue demandée.`,
    `Renvoie uniquement la copie corrigée, sans guillemets ni préambule.`,
  ].join('\n');
}

const stillFailing = (report: Verdict[]) => report.filter((v) => v.verifiable && !v.pass);

/** Deterministic, on-thesis formatting fixes the small LLM keeps failing:
 *  exclamation marks (strip / cap at one, per the resolved rule). Meaning is
 *  untouched — this is pure formatting, like the verifier's own channels. */
export function mechanicalFix(copy: string, active: Rule[]): string {
  const ex = active.find((r) => r.subject === 'exclamation-mark');
  if (ex) {
    const sig = directiveSignature(ex);
    if (sig === 'exclaim:forbid') {
      copy = copy.replace(/\s*[!！]+/g, '');
    } else if (sig === 'exclaim:allow-one') {
      let kept = false;
      copy = copy.replace(/[!！]+/g, () => (kept ? '' : ((kept = true), '!')));
    }
  }

  // Bullet OVER-count: if a bullet/item rule caps the list, keep the first N
  // non-empty lines. (Under-count is left to the LLM — we don't fabricate items.)
  const bulletRule = active.find((r) => r.constraintType === 'length-bound' && /item|bullet/i.test(r.text));
  if (bulletRule) {
    const max = numericBound(bulletRule);
    const lines = copy.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    if (max != null && lines.length > max) copy = lines.slice(0, max).join('\n');
  }

  return copy.replace(/[ \t]+\n/g, '\n').trim();
}

/** Last-resort: truncate to the tightest character bound at a word boundary
 *  (item/bullet bounds are left to the LLM). Lossy but guarantees the length
 *  proof; the report is re-run afterwards so it stays honest. */
function truncateToBounds(copy: string, active: Rule[]): string {
  const bounds = active
    .filter((r) => r.constraintType === 'length-bound' && !/item|bullet/i.test(r.text))
    .map((r) => numericBound(r))
    .filter((n): n is number => n != null);
  if (!bounds.length) return copy;
  const bound = Math.min(...bounds);
  if (copy.length <= bound) return copy;
  const cut = copy.slice(0, bound);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > bound * 0.6 ? cut.slice(0, lastSpace) : cut).trim();
}

/** Full report = per-rule verdicts + the language meta-check. */
function fullReport(copy: string, active: Rule[], ctx: GenerationContext): Verdict[] {
  return [...verifyAll(copy, active), verifyLanguage(copy, ctx.locale)];
}

/** Snapshot the failing (machine-checkable) verdicts of one attempt for the trace. */
function snapshot(attempt: number, report: Verdict[]): AttemptRecord {
  return {
    attempt,
    failing: stillFailing(report).map((v) => ({
      localId: v.localId,
      ruleName: v.ruleName,
      evidence: v.evidence,
    })),
  };
}

/** Deterministic, no-LLM path: verify a pasted draft against the active rules. */
export function verifyDraft(allRules: Rule[], ctx: GenerationContext, draft: string): GenerationResult {
  const { active } = resolve(allRules, ctx);
  const report = fullReport(draft, active, ctx);
  return {
    context: ctx,
    copy: draft,
    report,
    attempts: 0,
    allProvableGreen: stillFailing(report).length === 0,
  };
}

/** Generate a deliberately rule-violating draft for demo purposes.
 *  The LLM writes realistic-looking copy that naturally breaks several
 *  mechanically-checkable rules — so the "Corriger & prouver" flow has
 *  something to catch and fix in front of an audience. */
export async function generateSabotaged(
  allRules: Rule[],
  ctx: GenerationContext,
): Promise<{ copy: string }> {
  const { active } = resolve(allRules, ctx);

  const violationLines = active.map((r) => {
    const hint: Record<string, string> = {
      'lexical-forbidden': 'utilise l\'un des termes interdits de cette règle',
      'lexical-required': 'utilise la forme incorrecte (pas la forme canonique)',
      'length-bound': 'dépasse légèrement la borne',
      'format-pattern': 'applique le mauvais format (ponctuation, devise, guillemets…)',
      'register-tone': 'adopte le mauvais registre / ton',
      structure: 'ignore la structure attendue',
    };
    return `- #${r.localId} ${r.name} : ${r.text} → ${hint[r.constraintType] ?? 'viole-la naturellement'}`;
  });

  const system = [
    `Tu es un rédacteur junior pour « ${ctx.brand} » qui ne connaît pas encore les guidelines.`,
    `Contexte : locale ${ctx.locale} · type ${ctx.contentType} · champ « ${ctx.field} » · produit ${ctx.productType}.`,
    '',
    `Écris une copie commerciale RÉALISTE pour ce champ, mais qui viole NATURELLEMENT plusieurs règles`,
    `ci-dessous — comme si tu ne les connaissais pas. La copie doit sembler sincère, pas absurde.`,
    `Viole au moins 3 règles mécaniquement vérifiables (lexical, longueur, format).`,
    '',
    `Règles à violer :`,
    ...violationLines,
    '',
    `Écris dans la langue du locale (${ctx.locale}). Réponds UNIQUEMENT par le texte de la copie — sans préambule.`,
  ].join('\n');

  const copy = await complete(
    system,
    `Rédige la copie (champ « ${ctx.field} »), en violant naturellement les règles listées.`,
  );
  return { copy };
}

/** Full generation with bounded generate→verify→repair loop (needs an API key). */
export async function generate(
  allRules: Rule[],
  ctx: GenerationContext,
  opts: { brief?: string; draft?: string; mode?: 'write' | 'rewrite' },
): Promise<GenerationResult> {
  const { active } = resolve(allRules, ctx);
  const system = buildSystemPrompt(ctx, active);
  const rewrite = opts.mode === 'rewrite';

  let copy = mechanicalFix(await complete(system, userPrompt(ctx, opts.brief ?? '', opts.draft ?? '', rewrite)), active);
  let report = fullReport(copy, active, ctx);
  let attempts = 1;
  const history: AttemptRecord[] = [snapshot(attempts, report)];

  while (stillFailing(report).length > 0 && attempts <= 2) {
    copy = mechanicalFix(await complete(system, repairPrompt(copy, stillFailing(report))), active);
    report = fullReport(copy, active, ctx);
    attempts++;
    history.push(snapshot(attempts, report));
  }

  // Last resort for character-length bounds the LLM couldn't hit: deterministic
  // truncation, then re-verify so the report reflects the truncated copy.
  if (stillFailing(report).some((v) => v.evidence.includes('caractères'))) {
    copy = truncateToBounds(copy, active);
    report = fullReport(copy, active, ctx);
  }

  return {
    context: ctx,
    copy,
    report,
    attempts,
    allProvableGreen: stillFailing(report).length === 0,
    history,
  };
}
