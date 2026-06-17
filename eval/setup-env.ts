// Load .env.local into process.env BEFORE the module graph imports lib/llm.
// vitest does not auto-load .env.local for non-Next code. Simple KEY=VALUE parse.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

try {
  const txt = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const raw of txt.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    const [, k, v] = m;
    if (!process.env[k]) process.env[k] = v.replace(/^["']|["']$/g, "");
  }
} catch {
  // no .env.local — rely on process.env as-is
}
