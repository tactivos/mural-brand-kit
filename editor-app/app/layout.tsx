import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mural PDF Generator — Editor",
  description: "Puck-based visual editor for on-brand Mural PDFs.",
};

/**
 * Root layout for editor-app.
 *
 * brand.css is intentionally NOT imported here — it is scoped to the
 * /preview/* routes via app/preview/layout.tsx. That keeps the landing
 * page and future editor UI free from the reskin-quality print styles
 * (dark body background, fixed 8.5x11 page, serif headline cascade, etc.)
 * that those styles impose.
 *
 * If an editor UI surface later needs to render a mini-preview inline
 * (e.g. thumbnails, inspector previews), it should import brand.css
 * locally in its own scope — never globally here.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
