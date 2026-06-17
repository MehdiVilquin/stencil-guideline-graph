import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Semantic Guidelines Graph — Maison Lumière",
  description:
    "Conflict resolution moved out of the LLM into a deterministic precedence engine over a typed rule graph. Glass-box, provable.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
