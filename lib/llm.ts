// LLM client (drafting only). The LLM never decides which rule wins (that is the
// deterministic precedence engine) nor whether a rule is respected (that is the
// deterministic verifier). It is a *pluggable* drafting component — here OpenAI,
// swappable in this one file without touching the engine.

import OpenAI from 'openai';

export function hasApiKey(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Strip formatting artifacts small models add despite instructions:
 * wrapping quote runs (`"""…"""`, `'…'`), markdown code fences, and a leading
 * preamble line ("Voici la copie :"). Conservative — only touches the very
 * start/end, and PRESERVES internal punctuation and French guillemets « ».
 */
export function sanitizeCopy(raw: string): string {
  let t = (raw ?? '').trim();

  // 1) whole answer wrapped in a markdown code fence
  const fence = t.match(/^```[a-zA-Z]*\s*\n([\s\S]*?)\n?```$/);
  if (fence) t = fence[1].trim();

  // 2) leading meta/preamble line ending with a colon
  const nl = t.indexOf('\n');
  if (nl > 0) {
    const first = t.slice(0, nl);
    if (
      /^(voici|bien s[ûu]r|here(?:'s| is)|sure\b|certainly|of course|d'accord|en tant qu|as an ai)/i.test(first) &&
      /[:：]\s*$/.test(first)
    ) {
      t = t.slice(nl + 1).trim();
    }
  }

  // 3) wrapping quote/backtick runs (straight + smart doubles). Keep « » and ’.
  t = t.replace(/^["“”'`]+/, '').replace(/["“”'`]+$/, '').trim();

  return t;
}

/** One constrained completion: system = the active rule set, user = the task.
 *  OPENAI_BASE_URL / OPENAI_MODEL let you point at any OpenAI-compatible endpoint
 *  (OpenRouter, Groq, Azure, a local Ollama…) without code changes. */
export async function complete(system: string, user: string): Promise<string> {
  const client = new OpenAI({ baseURL: process.env.OPENAI_BASE_URL });
  const res = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    max_tokens: 1000,
    temperature: 0.3, // low: constrained rewriting, not creative writing
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });
  return sanitizeCopy(res.choices[0]?.message?.content ?? '');
}
