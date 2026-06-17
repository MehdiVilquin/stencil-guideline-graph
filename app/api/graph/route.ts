import { defaultGraph, facets } from '@/lib/domain/store';

// GET → the default ingested graph + selector facets.
export async function GET() {
  const graph = defaultGraph();
  return Response.json({ graph, facets: facets(graph) });
}
