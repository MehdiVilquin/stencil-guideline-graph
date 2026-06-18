// LLM client (drafting only). The LLM never decides which rule wins (that is the
// deterministic precedence engine) nor whether a rule is respected (that is the
// deterministic verifier). It is a *pluggable* drafting component — here GLM-4.7
// (Z.ai) over an OpenAI-compatible endpoint, swappable in this one file without
// touching the engine.

import OpenAI from 'openai';

export function hasApiKey(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Strip formatting artifacts models sometimes add despite instructions:
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
 *  (Z.ai/GLM, OpenRouter, Groq, Azure…) without code changes. */
export async function complete(system: string, user: string): Promise<string> {
  const client = new OpenAI({ baseURL: process.env.OPENAI_BASE_URL });
  const model = process.env.OPENAI_MODEL || 'glm-4.7';

  const params = {
    model,
    max_tokens: 1500,
    temperature: 0.3, // low: constrained rewriting, not creative writing
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  } as OpenAI.ChatCompletionCreateParamsNonStreaming & { thinking?: { type: string } };

  // GLM is a reasoning model; for this constrained rewriting task the thinking
  // pass adds ~3× latency (≈90% of tokens) for little gain. Disable it for GLM
  // unless GLM_THINKING=on. The param is ignored by non-GLM providers.
  if (/glm/i.test(model) && process.env.GLM_THINKING !== 'on') {
    params.thinking = { type: 'disabled' };
  }

  const res = await client.chat.completions.create(params);
  return sanitizeCopy(res.choices[0]?.message?.content ?? '');
}

/** Like `complete`, but for structured output: forces a JSON object response and
 *  does NOT sanitize (sanitizeCopy would mangle JSON). Used by the LLM-judge. */
export async function completeJSON(system: string, user: string): Promise<string> {
  const client = new OpenAI({ baseURL: process.env.OPENAI_BASE_URL });
  const model = process.env.OPENAI_MODEL || 'glm-4.7';

  const params = {
    model,
    max_tokens: 1500,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  } as OpenAI.ChatCompletionCreateParamsNonStreaming & { thinking?: { type: string } };

  if (/glm/i.test(model) && process.env.GLM_THINKING !== 'on') {
    params.thinking = { type: 'disabled' };
  }

  const res = await client.chat.completions.create(params);
  return res.choices[0]?.message?.content ?? '';
}
