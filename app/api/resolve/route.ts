import { RawRule } from '@/lib/domain/ingest';
import { resolve } from '@/lib/domain/precedence';
import { graphFrom } from '@/lib/domain/store';
import { GenerationContext } from '@/lib/domain/types';

// POST { context, rows? } → exact active rule set + decision trace + flags.
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { context: GenerationContext; rows?: RawRule[] };
    if (!body.context) return Response.json({ error: 'context required' }, { status: 400 });
    const graph = graphFrom(body.rows);
    const result = resolve(graph.rules, body.context);
    return Response.json(result);
  } catch {
    return Response.json({ error: 'invalid request' }, { status: 400 });
  }
}
