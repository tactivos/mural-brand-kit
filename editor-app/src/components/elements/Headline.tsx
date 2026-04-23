import type { HeadlineProps } from "../../schema/mural-doc.js";

/**
 * Headline — the primary display headline.
 *
 * Emits: <h1>{text}</h1>  (level=1, default)
 *        <h2>{text}</h2>  (level=2, subordinate pages)
 *
 * Typography comes from brand.css: h1 is 31pt / 1.08 / -1.5px tracking,
 * h2 is 23pt / 1.1 / -1px tracking.
 *
 * Constraint (from CONSTRAINTS.Headline): 2-4 lines. Validator runs
 * at save time; this component does not enforce at render.
 */
export function Headline({ text, level = 1 }: HeadlineProps): JSX.Element {
  return level === 2 ? <h2>{text}</h2> : <h1>{text}</h1>;
}
