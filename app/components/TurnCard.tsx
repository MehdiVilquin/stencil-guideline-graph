import type { Turn } from "./types";
import { KIND_LABEL } from "./types";
import { fieldLabel } from "@/lib/ui/labels";
import { proofStatus, type ProofStatus } from "@/lib/ui/proof";
import { Check, Triangle } from "./icons";

/** Metadata-led turn card: kind · field · proof status · scope · original-text preview. */
export default function TurnCard({
  turn,
  selected,
  onSelect,
}: {
  turn: Turn;
  selected: boolean;
  onSelect: () => void;
}) {
  const isCreate = turn.kind === "write";
  const st = proofStatus(turn.result.report);
  const field = fieldLabel(turn.result.context.field);
  const scope = [turn.result.context.brand, turn.result.context.locale].filter(Boolean).join(" · ");
  const attempts = turn.result.attempts;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-[14px] border p-3.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/40 ${
        selected
          ? "border-[var(--primary)] bg-[var(--primary)]/[0.04]"
          : "border-[var(--border)] bg-[var(--card)] hover:border-black/15"
      }`}
    >
      {/* identity */}
      <div className="flex items-center gap-2">
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            isCreate ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "bg-[var(--accent)] text-[var(--foreground)]"
          }`}
        >
          {KIND_LABEL[turn.kind]}
        </span>
        <span className="truncate text-[12px] font-medium text-[var(--foreground)]">{field}</span>
        <span className="flex-1" />
        <StatusChip st={st} />
      </div>

      {/* scope */}
      <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-[var(--muted-foreground)]">
        <span className="truncate">{scope}</span>
        <span className="shrink-0 tabular-nums">
          {attempts} essai{attempts > 1 ? "s" : ""}
        </span>
      </div>

      {/* preview — original text submitted (the corrected copy lives in the inspector) */}
      <p className="mt-2 whitespace-pre-wrap text-[13px] leading-snug text-[var(--muted-foreground)]">
        {turn.input || turn.result.copy}
      </p>
    </button>
  );
}

function StatusChip({ st }: { st: ProofStatus }) {
  if (st.kind === "conforme") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--ok)]/12 px-2 py-0.5 text-[11px] font-medium text-[var(--ok)]">
        <Check className="h-3.5 w-3.5" />
        <span className="tabular-nums">
          {st.proven}/{st.provable}
        </span>
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--judged)]/15 px-2 py-0.5 text-[11px] font-medium text-[var(--judged)]">
      <Triangle className="h-3.5 w-3.5" />
      <span className="tabular-nums">
        {st.violations} alerte{st.violations > 1 ? "s" : ""}
      </span>
    </span>
  );
}
