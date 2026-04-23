import type { SubHeadingProps, SectionHeadingProps } from "../../schema/mural-doc.js";

/**
 * SubHeading — a small serif subordinate heading, typically used inside
 * narrow columns or feature pillars.
 *
 * Emits: <h4>{text}</h4>
 *
 * Typography from brand.css: h4 is 11.5pt / 1.2 / -0.12px tracking.
 */
export function SubHeading({ text }: SubHeadingProps): JSX.Element {
  return <h4>{text}</h4>;
}

/**
 * SectionHeading — a mid-weight serif heading used for section titles
 * within a page (e.g. "95% of the Fortune 100 partner with us").
 *
 * Emits: <h3>{text}</h3>
 *
 * Typography from brand.css: h3 is 15pt / 1.08 / -0.3px tracking.
 */
export function SectionHeading({ text }: SectionHeadingProps): JSX.Element {
  return <h3>{text}</h3>;
}
