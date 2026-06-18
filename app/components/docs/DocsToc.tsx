"use client";

// Right "On this page" list — the sub-sections of the currently-active category.
// Falls back to the first category before any scroll happens.

import { DOCS_TOC } from "./toc";
import { DOCS_ACCENT } from "./prose";

export default function DocsToc({ active }: { active: string }) {
  const current =
    DOCS_TOC.find((c) => c.id === active || c.subs.some((s) => s.id === active)) ?? DOCS_TOC[0];

  return (
    <div className="py-10 pl-4 text-[12.5px]">
      <p className="mb-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
        On this page
      </p>
      <ul className="flex flex-col gap-1.5">
        {current.subs.map((s) => {
          const on = active === s.id;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="block leading-snug transition hover:text-[var(--foreground)]"
                style={{ color: on ? DOCS_ACCENT : "var(--muted-foreground)", fontWeight: on ? 500 : 400 }}
              >
                {s.title}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
