import { test, expect } from "@playwright/test";
import {
  inlineNodesToHTML,
  htmlToInlineNodes,
  normalizeInlineNodes,
} from "../../src/adapters/rich-text-html.js";
import type { InlineNode } from "../../src/schema/mural-doc.js";

/**
 * rich-text-html unit tests. Pure-node; no browser needed.
 *
 * These guard the lossless round-trip between MuralDoc InlineNode[]
 * and the HTML subset Puck's RichtextField stores. Every test here
 * is a contract with one of two neighbors: the adapter (for save/load
 * shapes) or the AI pipeline (for generated-content fidelity).
 */

test.describe("rich-text-html: InlineNode[] -> HTML", () => {
  test("empty input becomes an empty paragraph, never an empty string", () => {
    // TipTap's setContent on "" produces an ambiguous editor state;
    // <p></p> is the canonical empty-but-valid document.
    expect(inlineNodesToHTML([])).toBe("<p></p>");
  });

  test("plain text wraps in <p> with no extra markup", () => {
    expect(
      inlineNodesToHTML([{ type: "text", value: "hello world" }]),
    ).toBe("<p>hello world</p>");
  });

  test("bold mark becomes <strong>", () => {
    expect(
      inlineNodesToHTML([
        { type: "text", value: "hello ", marks: [] },
        { type: "text", value: "world", marks: ["bold"] },
      ]),
    ).toBe("<p>hello <strong>world</strong></p>");
  });

  test("link becomes <a href>", () => {
    expect(
      inlineNodesToHTML([
        { type: "text", value: "Visit " },
        { type: "link", href: "https://mural.co", label: "mural.co" },
      ]),
    ).toBe('<p>Visit <a href="https://mural.co">mural.co</a></p>');
  });

  test("link with bold mark nests <strong> inside <a>", () => {
    expect(
      inlineNodesToHTML([
        { type: "link", href: "https://x", label: "y", marks: ["bold"] },
      ]),
    ).toBe('<p><a href="https://x"><strong>y</strong></a></p>');
  });

  test("escapes special characters in text and href", () => {
    expect(
      inlineNodesToHTML([
        { type: "text", value: "A & B < C > D" },
        { type: "link", href: 'javascript:alert("x")', label: "evil" },
      ]),
    ).toBe(
      '<p>A &amp; B &lt; C &gt; D<a href="javascript:alert(&quot;x&quot;)">evil</a></p>',
    );
  });
});

test.describe("rich-text-html: HTML -> InlineNode[]", () => {
  test("plain <p> becomes a single text node", () => {
    expect(htmlToInlineNodes("<p>hello world</p>")).toEqual([
      { type: "text", value: "hello world" },
    ]);
  });

  test("<strong> becomes a bold mark", () => {
    expect(htmlToInlineNodes("<p>hello <strong>world</strong></p>")).toEqual([
      { type: "text", value: "hello " },
      { type: "text", value: "world", marks: ["bold"] },
    ]);
  });

  test("<b> is treated the same as <strong>", () => {
    // TipTap emits <strong> by default, but paste/import can yield <b>.
    expect(htmlToInlineNodes("<p><b>bold</b></p>")).toEqual([
      { type: "text", value: "bold", marks: ["bold"] },
    ]);
  });

  test("<a href> becomes a link node", () => {
    expect(
      htmlToInlineNodes('<p>Visit <a href="https://mural.co">mural.co</a></p>'),
    ).toEqual([
      { type: "text", value: "Visit " },
      { type: "link", href: "https://mural.co", label: "mural.co" },
    ]);
  });

  test("unknown tags collapse to their text content", () => {
    // <span>, <em>, <br>, etc. aren't modeled; we don't crash on them.
    expect(
      htmlToInlineNodes("<p>hello <span>world</span> <em>again</em></p>"),
    ).toEqual([{ type: "text", value: "hello world again" }]);
  });

  test("empty <p> returns an empty array", () => {
    expect(htmlToInlineNodes("<p></p>")).toEqual([]);
  });

  test("missing outer <p> still parses inline content", () => {
    // Defensive: some callers / TipTap configurations may not wrap.
    expect(htmlToInlineNodes("plain <strong>bold</strong>")).toEqual([
      { type: "text", value: "plain " },
      { type: "text", value: "bold", marks: ["bold"] },
    ]);
  });

  test("HTML entities are decoded", () => {
    expect(htmlToInlineNodes("<p>A &amp; B &lt; C</p>")).toEqual([
      { type: "text", value: "A & B < C" },
    ]);
  });

  test("adjacent text nodes with same marks merge (canonical form)", () => {
    // Round-trip produces this shape when TipTap concatenates spans.
    expect(
      htmlToInlineNodes("<p><strong>a</strong><strong>b</strong></p>"),
    ).toEqual([{ type: "text", value: "ab", marks: ["bold"] }]);
  });
});

test.describe("rich-text-html: round-trip", () => {
  const cases: Array<{ label: string; nodes: InlineNode[] }> = [
    { label: "plain", nodes: [{ type: "text", value: "hello" }] },
    {
      label: "bold-only",
      nodes: [{ type: "text", value: "bold", marks: ["bold"] }],
    },
    {
      label: "mixed plain + bold",
      nodes: [
        { type: "text", value: "hello " },
        { type: "text", value: "world", marks: ["bold"] },
        { type: "text", value: "!" },
      ],
    },
    {
      label: "link between plain text",
      nodes: [
        { type: "text", value: "Visit " },
        { type: "link", href: "https://mural.co", label: "mural.co" },
        { type: "text", value: " now." },
      ],
    },
    {
      label: "bold wrapping three words",
      nodes: [
        {
          type: "text",
          value: "You need an enterprise-grade platform you can trust",
          marks: ["bold"],
        },
      ],
    },
  ];

  for (const { label, nodes } of cases) {
    test(`round-trips cleanly: ${label}`, () => {
      const html = inlineNodesToHTML(nodes);
      const parsed = htmlToInlineNodes(html);
      expect(parsed).toEqual(normalizeInlineNodes(nodes));
    });
  }
});

test.describe("rich-text-html: normalizeInlineNodes", () => {
  test("merges adjacent plain-text nodes", () => {
    expect(
      normalizeInlineNodes([
        { type: "text", value: "a" },
        { type: "text", value: "b" },
      ]),
    ).toEqual([{ type: "text", value: "ab" }]);
  });

  test("does NOT merge across a different mark boundary", () => {
    expect(
      normalizeInlineNodes([
        { type: "text", value: "a" },
        { type: "text", value: "b", marks: ["bold"] },
        { type: "text", value: "c" },
      ]),
    ).toEqual([
      { type: "text", value: "a" },
      { type: "text", value: "b", marks: ["bold"] },
      { type: "text", value: "c" },
    ]);
  });

  test("drops empty-text nodes", () => {
    expect(
      normalizeInlineNodes([
        { type: "text", value: "" },
        { type: "text", value: "hello" },
        { type: "text", value: "" },
      ]),
    ).toEqual([{ type: "text", value: "hello" }]);
  });

  test("leaves link nodes alone", () => {
    const nodes: InlineNode[] = [
      { type: "link", href: "https://x", label: "y" },
      { type: "link", href: "https://z", label: "w" },
    ];
    expect(normalizeInlineNodes(nodes)).toEqual(nodes);
  });
});
