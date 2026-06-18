"use client";

import { useEffect, useState } from "react";

/**
 * Returns the id of the section currently nearest the top of the viewport.
 * Tracks every id via IntersectionObserver; picks the highest visible one,
 * falling back to the last passed when nothing is intersecting. No deps.
 */
export function useScrollSpy(ids: string[], rootMargin = "-80px 0px -70% 0px"): string {
  const [active, setActive] = useState(ids[0] ?? "");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const visible = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.set(e.target.id, e.boundingClientRect.top);
          else visible.delete(e.target.id);
        }
        if (visible.size === 0) return;
        // closest to the top wins
        const top = [...visible.entries()].sort((a, b) => a[1] - b[1])[0];
        if (top) setActive(top[0]);
      },
      { rootMargin, threshold: [0, 1] },
    );

    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    els.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [ids, rootMargin]);

  return active;
}
