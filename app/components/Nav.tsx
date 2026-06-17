import type { Tab } from "./types";
import { ChevronDown } from "./icons";

const TABS: { key: Tab; label: string }[] = [
  { key: "inspector", label: "Inspector" },
  { key: "graph", label: "Graph" },
  { key: "archive", label: "Archive" },
  { key: "doctrine", label: "Doctrine" },
];

export default function Nav({
  tab,
  onTab,
  canPrev,
  canNext,
  onPrev,
  onNext,
}: {
  tab: Tab;
  onTab: (t: Tab) => void;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--border)] p-3">
      {/* iOS-style segmented control */}
      <div role="tablist" aria-label="Vues" className="flex items-center gap-0.5 rounded-[10px] bg-[var(--muted)] p-[3px]">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active ? "true" : "false"}
              onClick={() => onTab(t.key)}
              className={`rounded-[8px] px-3 py-1.5 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/45 ${
                active
                  ? "bg-[var(--card)] text-[var(--foreground)] shadow-[var(--shadow-sm)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex gap-1.5">
        <NavBtn label="Tour précédent" disabled={!canPrev} onClick={onPrev} up />
        <NavBtn label="Tour suivant" disabled={!canNext} onClick={onNext} />
      </div>
    </div>
  );
}

function NavBtn({
  label,
  disabled,
  onClick,
  up = false,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  up?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] transition hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/45 disabled:opacity-30"
    >
      <ChevronDown className={`h-3.5 w-3.5 ${up ? "rotate-180" : ""}`} />
    </button>
  );
}
