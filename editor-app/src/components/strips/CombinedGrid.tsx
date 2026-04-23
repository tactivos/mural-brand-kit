import type { ReactNode } from "react";

/**
 * CombinedGrid — the wide-content + narrow-quote layout used in most
 * content sections of one-sheets.
 *
 * Emits: <div class="combined-grid">
 *          <div>{content slot}</div>
 *          <div>{quote slot}</div>
 *        </div>
 *
 * Styling from brand.css `.combined-grid`: two columns, 5.05in + 1fr
 * gap (matching the LUMA PCP pattern). Content column lives on the left,
 * quote column on the right.
 *
 * Slot allowlist (EDITOR-COMPONENT-INVENTORY.md):
 *   - content slot: BodyCopy, BulletList, SubHeading, IntroCopy, Eyebrow
 *   - quote slot: Blockquote (max 1)
 */
export function CombinedGrid({
  content,
  quote,
}: {
  content: ReactNode;
  quote: ReactNode;
}): JSX.Element {
  return (
    <div className="combined-grid">
      <div>{content}</div>
      <div>{quote}</div>
    </div>
  );
}
