import { compileDoctrine } from '@/lib/domain/doctrine';
import { defaultGraph } from '@/lib/domain/store';

// GET → the compiled doctrine markdown for the default (bundled) graph.
export async function GET() {
  const markdown = compileDoctrine(defaultGraph());
  return Response.json({ markdown });
}
