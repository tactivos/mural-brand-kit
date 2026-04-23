import type { DeckProps } from "../../schema/mural-doc.js";

/**
 * Deck — the short paragraph beneath a headline.
 *
 * Emits: <p class="deck">{text}</p>
 *
 * Constraint (from CONSTRAINTS.Deck): 45-75 words. Validator runs at
 * save time; this component does not enforce at render.
 */
export function Deck({ text }: DeckProps): JSX.Element {
  return <p className="deck">{text}</p>;
}
