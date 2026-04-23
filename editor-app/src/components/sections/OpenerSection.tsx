import type { ReactNode } from "react";

/**
 * OpenerSection — the first section of page 1.
 *
 * Emits: <section class="page-opening">{children}</section>
 *
 * Contains the page's primary headline plus introductory copy. Only one
 * OpenerSection is allowed per document, and only as the first section of
 * page 1 (enforced at the schema layer by
 * SECTION_STRIP_ALLOWLIST + PAGE_SECTION_RULES).
 */
export function OpenerSection({ children }: { children: ReactNode }): JSX.Element {
  return <section className="page-opening">{children}</section>;
}
