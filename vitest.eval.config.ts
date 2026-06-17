import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

// Eval harness config — SEPARATE from the golden suite (vitest.config.ts).
// Run with: npm run eval. Hits live LLM backends, so it has a long timeout and
// is never picked up by `npm test` (different include + config).
export default defineConfig({
  resolve: {
    alias: { "@": resolve(__dirname, ".") },
  },
  test: {
    include: ["eval/**/*.eval.ts"],
    setupFiles: ["./eval/setup-env.ts"],
    environment: "node",
    testTimeout: 3_600_000,
    hookTimeout: 120_000,
  },
});
