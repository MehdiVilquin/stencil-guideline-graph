import OpenAI from 'openai';
import { generate, generateSabotaged, verifyDraft } from '@/lib/domain/generate';
import { RawRule } from '@/lib/domain/ingest';
import { graphFrom } from '@/lib/domain/store';
import { hasApiKey } from '@/lib/llm';
import { GenerationContext } from '@/lib/domain/types';

/** Turn an SDK/runtime error into a clean, user-facing message (no raw JSON). */
function cleanError(e: unknown): { message: string; status: number } {
  if (e instanceof OpenAI.APIError) {
    const msg = e.message || 'Erreur du fournisseur LLM.';
    if (e.status === 401) return { message: 'Clé API invalide.', status: 502 };
    if (e.status === 429 || /quota|insufficient/i.test(msg))
      return {
        message:
          'Quota insuffisant ou limite atteinte — vérifie ton crédit chez ton fournisseur LLM (Z.ai). (Le mode « Vérifier » prouve une copie sans appeler le LLM.)',
        status: 502,
      };
    return { message: msg, status: 502 };
  }
  return { message: String(e), status: 500 };
}

// POST { context, mode, brief?, draft?, rows? }
//   mode "verify"           → deterministic proof of a pasted draft (no LLM, no key needed)
//   mode "write" | "rewrite"→ LLM drafts → verify → bounded repair (needs OPENAI_API_KEY)
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      context: GenerationContext;
      mode?: 'write' | 'rewrite' | 'verify' | 'sabotage';
      brief?: string;
      draft?: string;
      rows?: RawRule[];
    };
    if (!body.context) return Response.json({ error: 'context required' }, { status: 400 });
    const graph = graphFrom(body.rows);

    if (body.mode === 'verify') {
      return Response.json(verifyDraft(graph.rules, body.context, body.draft ?? ''));
    }

    if (!hasApiKey()) {
      if (body.mode === 'sabotage') {
        return Response.json(
          { error: 'no_api_key', message: 'OPENAI_API_KEY non configurée.' },
          { status: 503 },
        );
      }
      return Response.json(
        { error: 'no_api_key', message: 'OPENAI_API_KEY non configurée — utilisez le mode « Vérifier » pour prouver une copie collée.' },
        { status: 503 },
      );
    }

    if (body.mode === 'sabotage') {
      const result = await generateSabotaged(graph.rules, body.context);
      return Response.json(result);
    }

    const result = await generate(graph.rules, body.context, {
      brief: body.brief,
      draft: body.draft,
      mode: body.mode === 'rewrite' ? 'rewrite' : 'write',
    });
    return Response.json(result);
  } catch (e) {
    const { message, status } = cleanError(e);
    return Response.json({ error: 'generation_failed', message }, { status });
  }
}
