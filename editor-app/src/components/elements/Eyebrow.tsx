import type { EyebrowProps } from "../../schema/mural-doc.js";

/**
 * Eyebrow — a small uppercase label that sits above a section's content.
 *
 * Emits: <p class="eyebrow">{text}</p>
 *
 * Styling from brand.css `.eyebrow`: tracked uppercase, muted color.
 */
export function Eyebrow({ text }: EyebrowProps): JSX.Element {
  return <p className="eyebrow">{text}</p>;
}
