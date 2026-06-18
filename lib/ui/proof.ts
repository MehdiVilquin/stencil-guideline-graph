import type { Verdict } from "@/lib/domain/types";

/** Count provable (verifiable) verdicts, how many pass, and the judged split. */
export function proofStats(report: Verdict[]) {
  const provable = report.filter((v) => v.verifiable);
  const greens = provable.filter((v) => v.pass).length;
  const judgedAll = report.filter((v) => !v.verifiable);
  const judgedFail = judgedAll.filter((v) => !v.pass).length;
  return { provable: provable.length, greens, judged: judgedAll.length, judgedFail };
}

export type ProofKind = "conforme" | "alertes";

export interface ProofStatus {
  kind: ProofKind;
  proven: number;
  provable: number;
  judged: number;
  judgedFail: number;
  violations: number;
}

/** Compact status for a turn card / score header. */
export function proofStatus(report: Verdict[]): ProofStatus {
  const { provable, greens, judged, judgedFail } = proofStats(report);
  const violations = report.filter((v) => v.verifiable && !v.pass).length;
  return {
    kind: violations > 0 ? "alertes" : "conforme",
    proven: greens,
    provable,
    judged,
    judgedFail,
    violations,
  };
}
