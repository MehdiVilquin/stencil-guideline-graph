import { useEffect, useRef } from "react";
import type { Turn } from "./types";
import TurnCard from "./TurnCard";

export default function Feed({
  turns,
  selectedId,
  onSelect,
}: {
  turns: Turn[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns.length]);

  if (turns.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="max-w-xs text-sm text-[var(--muted-foreground)]">
          Paste a copy and hit <span className="text-[var(--foreground)]">Correct</span> — the AI brings it into compliance and the proof appears on the right, linked to each rule.
        </p>
        <p className="text-[12px] text-[var(--muted-foreground)]">
          Tip: <span className="text-[var(--foreground)]">✦ Sample</span> loads a copy to correct.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-4">
      {turns.map((t) => (
        <TurnCard key={t.id} turn={t} selected={t.id === selectedId} onSelect={() => onSelect(t.id)} />
      ))}
      <div ref={end} />
    </div>
  );
}
