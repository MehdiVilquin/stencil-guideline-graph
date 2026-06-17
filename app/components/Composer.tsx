import type { ResolveResult } from "@/lib/domain/types";
import type { Mode } from "./types";
import { KIND_LABEL } from "./types";
import { ArrowUp, ChevronDown, Sparkle, StopSquare } from "./icons";

/** Unified prompt dock: textarea + actions (wand · mode selector · send/stop). */
export default function Composer({
  text,
  mode,
  busy,
  busyWand,
  notice,
  resolved,
  onMode,
  onText,
  onRun,
  onStop,
  onWand,
}: {
  text: string;
  mode: Mode;
  busy: Mode | null;
  busyWand: boolean;
  notice: string | null;
  resolved: ResolveResult | null;
  onMode: (m: Mode) => void;
  onText: (v: string) => void;
  onRun: (m: Mode) => void;
  onStop: () => void;
  onWand: () => void;
}) {
  const hasText = text.trim().length > 0;
  const running = busy !== null;
  const placeholder = mode === "write" ? "Écrivez un brief ou une description" : "Coller le texte à corriger";

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onRun(mode);
    } else if (e.key === "Escape" && running) {
      e.preventDefault();
      onStop();
    }
  };

  return (
    <div className="shrink-0 p-3">
      <div className="rounded-[16px] bg-[var(--surface-composer)] p-3">
        {/* header — live rules counter */}
        <div className="mb-2 flex items-center gap-2">
          <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-[var(--primary)]" aria-hidden />
          {resolved ? (
            <span className="font-mono text-[11px] tabular-nums text-[var(--muted-foreground)]">
              {resolved.active.length} / {resolved.applicableCount} règles actives
            </span>
          ) : (
            <span className="font-mono text-[11px] text-[var(--muted-foreground)]">…</span>
          )}
        </div>

        {/* textarea */}
        <textarea
          value={text}
          onChange={(e) => onText(e.target.value)}
          onKeyDown={onKeyDown}
          rows={3}
          placeholder={placeholder}
          aria-label="Texte à générer ou corriger"
          className="composer-textarea w-full resize-none bg-transparent px-1 text-[14px] leading-snug text-[var(--foreground)] outline-none"
        />

        {/* action row */}
        <div className="mt-2 flex items-center gap-2">
          {/* wand */}
          <button
            type="button"
            onClick={onWand}
            disabled={busyWand}
            aria-busy={busyWand}
            aria-label="Charger un exemple à corriger"
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-[12px] font-medium text-[var(--foreground)] transition hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/45 disabled:opacity-40"
          >
            <Sparkle className="h-[15px] w-[15px] text-[var(--muted-foreground)]" />
            {busyWand ? "Génération…" : "Exemple"}
          </button>

          <span className="flex-1" />

          {/* mode selector */}
          <button
            type="button"
            onClick={() => onMode(mode === "write" ? "rewrite" : "write")}
            title="Basculer Créer / Corriger"
            className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)] py-1.5 pl-3 pr-2 text-[13px] font-medium text-[var(--foreground)] transition hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/45"
          >
            {KIND_LABEL[mode]}
            <ChevronDown className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
          </button>

          {/* send / stop */}
          <button
            type="button"
            onClick={() => (running ? onStop() : onRun(mode))}
            disabled={!running && !hasText}
            aria-busy={running}
            aria-label={running ? "Arrêter la génération" : "Lancer la génération"}
            className={`flex h-10 w-10 items-center justify-center rounded-full text-[var(--primary-foreground)] shadow-[var(--shadow-sm)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/45 disabled:opacity-35 ${
              running ? "bg-[var(--foreground)]" : "bg-[var(--primary)]"
            }`}
          >
            {running ? <StopSquare className="h-5 w-5" /> : <ArrowUp className="h-5 w-5" />}
          </button>
        </div>

        {notice && (
          <div className="mt-2 rounded-[8px] border border-[var(--destructive)]/25 bg-[var(--destructive)]/8 px-3 py-2 text-[11px] text-[var(--destructive)]">
            {notice}
          </div>
        )}
      </div>
    </div>
  );
}
