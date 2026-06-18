"use client";

// Left category nav (OpenAI-docs style). Each category lists its sub-sections;
// the active item (scrollspy) is highlighted with the docs accent.

import { DOCS_TOC } from "./toc";
import { DOCS_ACCENT } from "./prose";

export default function DocsNav({ active }: { active: string }) {
  return (
    <nav className="flex flex-col gap-6 py-10 pr-4 text-[13px]">
      {DOCS_TOC.map((cat) => {
        const catActive = active === cat.id || cat.subs.some((s) => s.id === active);
        return (
          <div key={cat.id}>
            <a
              href={`#${cat.id}`}
              className="block font-semibold tracking-[-0.01em] transition"
              style={{ color: catActive ? DOCS_ACCENT : "var(--foreground)" }}
            >
              {cat.title}
            </a>
            <ul className="mt-1.5 flex flex-col border-l border-[var(--border)]">
              {cat.subs.map((s) => {
                const on = active === s.id;
                return (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="-ml-px block border-l py-[5px] pl-3 leading-snug transition hover:text-[var(--foreground)]"
                      style={{
                        borderColor: on ? DOCS_ACCENT : "transparent",
                        color: on ? DOCS_ACCENT : "var(--muted-foreground)",
                        fontWeight: on ? 500 : 400,
                      }}
                    >
                      {s.title}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
