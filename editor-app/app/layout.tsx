import type { ReactNode } from "react";
import type { Metadata } from "next";
import "../styles/brand.css";

export const metadata: Metadata = {
  title: "Mural PDF Generator — Editor",
  description: "Puck-based visual editor for on-brand Mural PDFs.",
};

/**
 * Root layout for editor-app.
 *
 * Loads brand.css once so every page — edit UI and /preview print route
 * alike — sees the same CSS that the static HTML kit uses. This is the
 * "one CSS, two render surfaces" architecture described in
 * PDF-GENERATOR-SPEC.md > Editor Architecture.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
