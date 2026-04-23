import { Fragment, type ReactNode } from "react";
import type { InlineMark, InlineNode } from "../../schema/mural-doc.js";

/**
 * Renders an array of InlineNodes as React children.
 *
 * Supported:
 *   - `{type: "text", value, marks?}` — plain text, optionally wrapped in <strong>
 *     when marks includes "bold".
 *   - `{type: "link", href, label, marks?}` — anchor tag, optionally bolded.
 *
 * String values are passed through React's default text rendering, which
 * correctly handles Unicode smart quotes, em dashes, narrow no-break spaces,
 * and other typographic characters that appear in Mural copy.
 */
export function RichText({ nodes }: { nodes: readonly InlineNode[] }): JSX.Element {
  return (
    <>
      {nodes.map((node, i) => (
        <Fragment key={i}>{renderNode(node)}</Fragment>
      ))}
    </>
  );
}

function renderNode(node: InlineNode): ReactNode {
  if (node.type === "text") {
    return applyMarks(node.value, node.marks);
  }
  // link
  return applyMarks(
    <a href={node.href}>{node.label}</a>,
    node.marks,
  );
}

function applyMarks(content: ReactNode, marks: readonly InlineMark[] | undefined): ReactNode {
  if (marks?.includes("bold")) {
    return <strong>{content}</strong>;
  }
  return content;
}
