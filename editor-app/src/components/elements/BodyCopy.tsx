import type { CSSProperties } from "react";
import type { BodyCopyProps } from "../../schema/mural-doc.js";
import { RichText } from "../rich-text/RichText.js";

/**
 * BodyCopy — standard paragraph body copy.
 *
 * Emits: <div class="body-copy">
 *          <p>{paragraph 1}</p>
 *          <p>{paragraph 2}</p>
 *          ...
 *        </div>
 *
 * When `paragraphs` is provided, it takes precedence over `content` (single-
 * paragraph form). Constraint (CONSTRAINTS.BodyCopy): 180-260 words per page
 * aggregate; enforced at the page validation layer, not at this render.
 *
 * `topSpacing` hatch: some reskins add margin-top to subsequent body-copy
 * subheadings inside a single column (e.g. "margin-top: 0.14in;"). Until
 * the pattern library promotes a dedicated class for this spacing, passing
 * `topSpacing="0.14in"` emits the inline style used in the current reskins
 * so the visual-regression golden matches. New content should not use this
 * — it exists for reskin parity only.
 */
export function BodyCopy({
  content,
  paragraphs,
  topSpacing,
}: BodyCopyProps & { topSpacing?: string }): JSX.Element {
  const paras = paragraphs ?? [content];
  const style: CSSProperties | undefined = topSpacing ? { marginTop: topSpacing } : undefined;

  return (
    <div className="body-copy" style={style}>
      {paras.map((nodes, i) => (
        <p key={i}>
          <RichText nodes={nodes} />
        </p>
      ))}
    </div>
  );
}
