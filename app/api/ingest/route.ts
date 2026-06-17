import { ingest, RawRule } from '@/lib/domain/ingest';
import { facets } from '@/lib/domain/store';

// POST { rows } → build a graph from any uploaded set (same pipeline as default).
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { rows?: RawRule[] };
    if (!body.rows?.length) {
      return Response.json({ error: 'rows[] required' }, { status: 400 });
    }
    const graph = ingest(body.rows);
    return Response.json({ graph, facets: facets(graph) });
  } catch {
    return Response.json({ error: 'invalid request' }, { status: 400 });
  }
}
