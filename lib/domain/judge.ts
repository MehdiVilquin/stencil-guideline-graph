// LLM-judge for the rules the deterministic engine CANNOT prove (register-tone,
// structure, non-mechanized formats). This is an explicit, separate "confidence"
// layer — it never decides which rule wins (that stays the precedence engine) and
// never feeds allProvableGreen (that stays deterministic). It only replaces the
// previous "assumed pass" with an honest, labeled opinion.

import { completeJSON } from '../llm';
import { GenerationContext, Rule, Verdict } from './types';

export interface Judgment {
  pass: boolean;
  reason: string;
}

/** Judge every non-verifiable verdict in the report against the actual copy.
 *  Returns a map localId → {pass, reason}. On any failure (parse/LLM), returns an
 *  empty map so the caller keeps the original verdicts (fail-open, never crashes). */
export async function judgeUnverifiable(
  copy: string,
  report: Verdict[],
  rules: Rule[],
  ctx: GenerationContext,
): Promise<Map<string, Judgment>> {
  const out = new Map<string, Judgment>();
  const toJudge = report.filter((v) => !v.verifiable);
  if (!toJudge.length || !copy.trim()) return out;

  const byId = new Map(rules.map((r) => [r.localId, r]));
  const lines = toJudge.map((v) => `#${v.localId} (${v.ruleName}) : ${byId.get(v.localId)?.text ?? v.ruleName}`);

  const system = [
    `Tu es un évaluateur qualité de copies e-commerce (marque « ${ctx.brand} », locale ${ctx.locale}).`,
    `On te donne une copie et des règles qui NE sont PAS vérifiables mécaniquement`,
    `(registre, ton, structure). Pour CHAQUE règle, juge si la copie la respecte vraiment.`,
    `Sois strict : une règle de structure (ex. « hook → bénéfice → comment utiliser ») n'est`,
    `respectée que si TOUS ses éléments sont présents. Ne donne pas le bénéfice du doute.`,
    `Réponds UNIQUEMENT par un objet JSON, sans texte autour, de la forme :`,
    `{ "<localId>": { "pass": true|false, "reason": "<raison courte en français>" } }`,
  ].join('\n');
  const user = ['[COPIE]', copy, '[FIN COPIE]', '', '[RÈGLES À JUGER]', ...lines].join('\n');

  try {
    const raw = await completeJSON(system, user);
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start < 0 || end <= start) return out;
    const parsed = JSON.parse(raw.slice(start, end + 1)) as Record<
      string,
      { pass?: unknown; reason?: unknown }
    >;
    for (const v of toJudge) {
      const j = parsed[v.localId] ?? parsed[`#${v.localId}`];
      if (j && typeof j.pass === 'boolean') {
        out.set(v.localId, { pass: j.pass, reason: typeof j.reason === 'string' ? j.reason : '' });
      }
    }
  } catch {
    // parse/LLM failure → empty map; caller keeps the original verdicts.
  }
  return out;
}
