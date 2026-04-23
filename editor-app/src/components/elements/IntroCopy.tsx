import type { IntroCopyProps } from "../../schema/mural-doc.js";
import { RichText } from "../rich-text/RichText.js";

/**
 * IntroCopy — body copy rendered with the tighter "intro-copy" leading,
 * typically placed directly beneath a headline as the first body paragraph
 * on a page.
 *
 * Emits: <div class="intro-copy">
 *          <p>{paragraph 1}</p>
 *          <p>{paragraph 2}</p>
 *          ...
 *        </div>
 *
 * Styling from brand.css `.intro-copy`: margin-top 0.22in from headline,
 * max-width 5.05in (readable measure).
 */
export function IntroCopy({ paragraphs }: IntroCopyProps): JSX.Element {
  return (
    <div className="intro-copy">
      {paragraphs.map((nodes, i) => (
        <p key={i}>
          <RichText nodes={nodes} />
        </p>
      ))}
    </div>
  );
}
