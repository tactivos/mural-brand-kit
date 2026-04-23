import type { BulletListProps } from "../../schema/mural-doc.js";
import { RichText } from "../rich-text/RichText.js";

/**
 * BulletList — an unordered or ordered list.
 *
 * Emits: <ul>
 *          <li>{item 1}</li>
 *          <li>{item 2}</li>
 *          ...
 *        </ul>
 *
 * Or <ol> when style="number".
 *
 * Constraint (CONSTRAINTS.BulletList): 2-5 items. Enforced at save time.
 *
 * Each item's content is a rich-text array (InlineNode[]), so items may
 * contain bold emphasis and inline links. Soft line breaks inside an item
 * (as used in some reskins, e.g. bullets that split awkwardly otherwise)
 * are not modeled here — forced <br/>s are a reskin-specific escape hatch
 * that we intentionally do NOT surface in the editor.
 */
export function BulletList({ items, style = "bullet" }: BulletListProps): JSX.Element {
  const Tag = style === "number" ? "ol" : "ul";
  return (
    <Tag>
      {items.map((item, i) => (
        <li key={i}>
          <RichText nodes={item.content} />
        </li>
      ))}
    </Tag>
  );
}
