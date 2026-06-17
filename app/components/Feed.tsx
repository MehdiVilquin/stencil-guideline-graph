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
          Colle une copie et lance <span className="text-[var(--foreground)]">Corriger</span> — l’IA la met au
          vert et la preuve apparaît à droite, liée à chaque règle.
        </p>
        <p className="text-[12px] text-[var(--muted-foreground)]">
          Astuce : <span className="text-[var(--foreground)]">✦ Exemple</span> charge une copie à corriger.
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
