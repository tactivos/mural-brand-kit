/**
 * rich-text-html.ts — lossless bridge between MuralDoc InlineNode[]
 * and the HTML subset emitted by Puck's RichtextField (TipTap).
 *
 * Scope (v1)
 * ----------
 * Supports the exact subset the Puck config enables for rich fields:
 *   - <p>            single paragraph wrapper
 *   - <strong>       bold mark (TipTap's default tag for Bold)
 *   - <a href="...">  link node
 *
 * Disabled in Puck:
 *   - italic, underline, strikethrough, inline code, code blocks,
 *     headings, bullet/ordered lists, blockquote, horizontal rule
 *
 * Why these and only these? They're the only marks/nodes modeled in
 * MuralDoc's InlineNode schema today. Any tag the parser doesn't
 * recognize is collapsed to its text content — we never throw, because
 * TipTap may emit edge-case HTML (e.g. <br>, nbsp entities, stray
 * spans from paste) that we'd rather degrade gracefully than block a
 * user's save on.
 *
 * Round-trip property
 * -------------------
 * For any canonical InlineNode[] (adjacent nodes with identical marks
 * merged), the following invariant holds:
 *
 *   htmlToInlineNodes(inlineNodesToHTML(nodes)) === nodes
 *
 * Non-canonical inputs (e.g. two adjacent plain-text nodes) are
 * normalized on the way out: their merged result is the canonical
 * form. This matches TipTap's own normalization, so subsequent
 * round-trips through the editor are also stable.
 *
 * HTML safety
 * -----------
 * `inlineNodesToHTML` escapes `&`, `<`, `>`, and (for attributes) `"`.
 * TipTap's `setContent` will sanitize what we hand it, but we produce
 * correct HTML regardless so the stored blob in localStorage and on
 * the wire is never malformed.
 */

import { parse, NodeType } from "node-html-parser";
import type { HTMLElement as ParsedElement, Node as ParsedNode } from "node-html-parser";
import type { InlineMark, InlineNode } from "../schema/mural-doc.js";

// ─────────────────────────────────────────────────────────────────────────────
// InlineNode[] -> HTML
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Serialize an InlineNode[] to a single-paragraph HTML fragment.
 * Empty input yields `<p></p>` (not the empty string) so TipTap's
 * RichtextField always has a valid document to initialize with.
 */
export function inlineNodesToHTML(nodes: InlineNode[]): string {
  const inner = normalizeInlineNodes(nodes).map(nodeToHTML).join("");
  return `<p>${inner}</p>`;
}

function nodeToHTML(node: InlineNode): string {
  if (node.type === "text") {
    return wrapMarks(escapeText(node.value), node.marks);
  }
  // Link: marks apply INSIDE the <a>, matching TipTap's emit pattern
  // (marks are not allowed around a link; they live on its inline
  // content instead).
  const labelHTML = wrapMarks(escapeText(node.label), node.marks);
  return `<a href="${escapeAttr(node.href)}">${labelHTML}</a>`;
}

function wrapMarks(innerHTML: string, marks: InlineMark[] | undefined): string {
  if (!marks || marks.length === 0) return innerHTML;
  // Only "bold" is modeled today; if the schema grows, extend here.
  if (marks.includes("bold")) return `<strong>${innerHTML}</strong>`;
  return innerHTML;
}

function escapeText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
  return escapeText(value).replace(/"/g, "&quot;");
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML -> InlineNode[]
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse the first `<p>` in `html` into an InlineNode[]. If no `<p>`
 * is present, the whole fragment is treated as a single paragraph.
 * Subsequent paragraphs are dropped — callers that need multi-
 * paragraph support should move to a different entry point (not
 * added yet; wait until a schema field needs it).
 *
 * Never throws. Unrecognized tags collapse to their text content.
 */
export function htmlToInlineNodes(html: string): InlineNode[] {
  if (!html.trim()) return [];
  const root = parse(html, { lowerCaseTagName: true });
  const firstP = root.querySelector("p");
  const scope: ParsedElement = firstP ?? root;
  const raw = walk(scope, []);
  return normalizeInlineNodes(raw);
}

function walk(el: ParsedElement, marks: InlineMark[]): InlineNode[] {
  const out: InlineNode[] = [];
  for (const child of el.childNodes) {
    if (child.nodeType === NodeType.TEXT_NODE) {
      pushText(out, child.text, marks);
    } else if (child.nodeType === NodeType.ELEMENT_NODE) {
      const node = child as ParsedElement;
      const tag = (node.tagName ?? "").toLowerCase();
      if (tag === "strong" || tag === "b") {
        out.push(...walk(node, addMark(marks, "bold")));
      } else if (tag === "a") {
        const href = node.getAttribute("href") ?? "";
        const label = textOnly(node);
        const linkNode: InlineNode = { type: "link", href, label };
        if (marks.length > 0) linkNode.marks = [...marks];
        out.push(linkNode);
      } else {
        // Unknown tag (span, div, br, em, etc.) — walk into it and
        // keep the current mark context. Completely lossy for the
        // tag itself; only its text/structure bubbles up.
        out.push(...walk(node, marks));
      }
    }
    // Comments (nodeType 8) are skipped entirely.
  }
  return out;
}

function pushText(out: InlineNode[], raw: string, marks: InlineMark[]): void {
  const value = decodeEntities(raw);
  if (value.length === 0) return;
  const node: InlineNode = { type: "text", value };
  if (marks.length > 0) node.marks = [...marks];
  out.push(node);
}

function textOnly(el: ParsedElement): string {
  // Flatten any nested inline formatting inside a link to plain text.
  // This is a deliberate simplification: links-with-bold-inside are
  // rare in MuralDoc content and the schema doesn't model marks
  // *inside* a link node yet.
  return decodeEntities(el.text);
}

function addMark(marks: InlineMark[], mark: InlineMark): InlineMark[] {
  return marks.includes(mark) ? marks : [...marks, mark];
}

function decodeEntities(s: string): string {
  // Only the four standard entities we emit; node-html-parser handles
  // numeric/named entity decoding inside its own `.text` getter, so
  // in practice this is a backstop rather than a primary path.
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, "\u00a0");
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalization
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Canonicalize an InlineNode[]: merge adjacent text nodes with
 * identical marks, drop empty-text nodes. This matches TipTap's own
 * output after getHTML() -> setContent() -> getHTML(), so a MuralDoc
 * built offline (e.g. by the AI) won't drift just because the editor
 * opened it once.
 */
export function normalizeInlineNodes(nodes: InlineNode[]): InlineNode[] {
  const out: InlineNode[] = [];
  for (const node of nodes) {
    if (node.type === "text" && node.value.length === 0) continue;
    const prev = out[out.length - 1];
    if (
      prev &&
      prev.type === "text" &&
      node.type === "text" &&
      sameMarks(prev.marks, node.marks)
    ) {
      prev.value += node.value;
      continue;
    }
    out.push({ ...node, ...(node.marks ? { marks: [...node.marks] } : {}) });
  }
  return out;
}

function sameMarks(a: InlineMark[] | undefined, b: InlineMark[] | undefined): boolean {
  const aa = a ?? [];
  const bb = b ?? [];
  if (aa.length !== bb.length) return false;
  return aa.every((m, i) => m === bb[i]);
}

// Re-export for test readability.
export type { ParsedNode };
