"use client";

// 3-column documentation shell: sticky header, left category nav, center
// content, right "on this page" TOC. Mirrors the OpenAI docs layout, on our DS.

import Link from "next/link";
import { StencilIcon } from "../icons";
import DocsNav from "./DocsNav";
import DocsToc from "./DocsToc";
import { ALL_SECTION_IDS } from "./toc";
import { useScrollSpy } from "./useScrollSpy";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const active = useScrollSpy(ALL_SECTION_IDS);

  return (
    <div className="min-h-dvh bg-[var(--background)]">
      {/* header */}
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[color-mix(in_oklch,var(--background)_85%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-3 px-6">
          <Link href="/" aria-label="Back to hub" className="flex items-center gap-2.5">
            <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[8px] bg-gradient-to-br from-[var(--primary)] to-[oklch(0.5_0.2_290)] text-white shadow-[var(--shadow-sm)]">
              <StencilIcon className="h-[15px] w-[15px]" />
            </span>
            <span className="text-[13.5px] font-semibold tracking-[-0.01em]">Stencil</span>
          </Link>
          <span className="text-[var(--border)]">/</span>
          <span className="text-[13.5px] font-medium text-[var(--muted-foreground)]">
            Documentation
          </span>
          <Link
            href="/prototype"
            className="ml-auto rounded-full border border-[var(--border)] bg-[var(--card)] px-3.5 py-1.5 text-[12.5px] font-medium transition hover:bg-[var(--muted)]"
          >
            Open prototype →
          </Link>
        </div>
      </header>

      {/* 3-column body */}
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-x-8 px-6 lg:grid-cols-[212px_minmax(0,1fr)] xl:grid-cols-[212px_minmax(0,1fr)_200px]">
        {/* left nav */}
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] overflow-y-auto lg:block">
          <DocsNav active={active} />
        </aside>

        {/* center content */}
        <main className="min-w-0 max-w-[768px] py-12">{children}</main>

        {/* right toc */}
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] overflow-y-auto xl:block">
          <DocsToc active={active} />
        </aside>
      </div>
    </div>
  );
}
