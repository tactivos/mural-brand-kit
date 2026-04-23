import type { ReactNode } from "react";

/**
 * Page — the 8.5 x 11 in fixed canvas wrapper.
 *
 * Emits: <section class="page">{children}</section>
 *
 * Pattern library ref: mural-pdf-generator-pattern-library.html `.page`
 * class. Every page in every reskin uses this exact shape. Width, height,
 * and box-shadow all come from brand.css.
 */
export function Page({ children }: { children: ReactNode }): JSX.Element {
  return <section className="page">{children}</section>;
}

/**
 * PageInner — the padded interior of a Page that holds all content
 * except the brand bar (which sits at page-top) and the page footer
 * (which is absolutely positioned).
 *
 * Emits: <div class="page-inner">{children}</div>
 */
export function PageInner({ children }: { children: ReactNode }): JSX.Element {
  return <div className="page-inner">{children}</div>;
}

/**
 * PageMeta — the utilitarian topic label above the top rule.
 *
 * Emits: <header class="page-meta"><div class="left">{label}</div></header>
 *
 * Per PDF-GENERATOR-SPEC.md > Page System: one topic label per document,
 * repeated verbatim on every page, no competing right-side field.
 */
export function PageMeta({ leftLabel }: { leftLabel: string }): JSX.Element {
  return (
    <header className="page-meta">
      <div className="left">{leftLabel}</div>
    </header>
  );
}

/**
 * Document — the outer <main> wrapper that centers pages and provides
 * the dark surround background.
 *
 * Emits: <main class="document">{children}</main>
 */
export function Document({ children }: { children: ReactNode }): JSX.Element {
  return <main className="document">{children}</main>;
}
