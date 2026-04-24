import { test, expect } from "@playwright/test";
import {
  classify,
  countChars,
  countForSpec,
  countItems,
  countLines,
  countWords,
  defaultNoun,
  pluralize,
  stripHTML,
} from "../../src/puck/bounded.js";
import type { BoundedSpec } from "../../src/puck/bounded.js";

/**
 * Bounded-field counter unit tests. Pure-node; no browser needed.
 *
 * These guard the behavior the inspector UI depends on — in particular
 * the three-state classifier (under/ok/over) that drives the badge
 * color and the kind-aware countForSpec() dispatch.
 */

test.describe("stripHTML", () => {
  test("removes tags and leaves text", () => {
    expect(stripHTML("<p>Hello <strong>world</strong></p>")).toBe(
      "Hello world",
    );
  });

  test("decodes the standard entities we emit", () => {
    expect(stripHTML("&amp;&lt;&gt;&quot;&#39;")).toBe("&<>\"'");
  });

  test("&nbsp; decodes to a regular space (not U+00A0)", () => {
    // Bounded counting treats all whitespace the same, so we normalize
    // &nbsp; to a plain space here rather than preserve the non-
    // breaking character. Use of .charCodeAt(0) pins the regression.
    const out = stripHTML("a&nbsp;b");
    expect(out).toBe("a b");
    expect(out.charCodeAt(1)).toBe(32);
  });

  test("strips comments", () => {
    expect(stripHTML("a<!-- b -->c")).toBe("ac");
  });

  test("plain input passes through unchanged", () => {
    expect(stripHTML("no html here")).toBe("no html here");
  });
});

test.describe("countLines", () => {
  test("empty string is 0 lines", () => {
    expect(countLines("")).toBe(0);
    expect(countLines("   ")).toBe(0);
  });

  test("short single line is 1 line", () => {
    expect(countLines("Hello world")).toBe(1);
  });

  test("text exactly at charsPerLine is 1 line", () => {
    expect(countLines("a".repeat(90))).toBe(1);
  });

  test("text just past charsPerLine is 2 lines", () => {
    expect(countLines("a".repeat(91))).toBe(2);
  });

  test("text at ~180 chars is 2 lines", () => {
    expect(countLines("a".repeat(180))).toBe(2);
  });

  test("custom charsPerLine shrinks the wrap threshold", () => {
    // 10 chars at charsPerLine=5 should be exactly 2 wrapped lines.
    expect(countLines("abcdefghij", 5)).toBe(2);
  });

  test("explicit newlines add lines", () => {
    expect(countLines("one\ntwo\nthree")).toBe(3);
  });

  test("strips HTML before measuring", () => {
    expect(countLines("<strong>abc</strong>")).toBe(1);
  });
});

test.describe("countWords", () => {
  test("empty string is 0 words", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   ")).toBe(0);
  });

  test("single word is 1", () => {
    expect(countWords("hello")).toBe(1);
  });

  test("multiple whitespace runs collapse", () => {
    expect(countWords("one   two \n three")).toBe(3);
  });

  test("HTML tags don't count as words", () => {
    expect(countWords("<p><strong>hello</strong> world</p>")).toBe(2);
  });

  test("punctuation stays attached", () => {
    expect(countWords("Hello, world!")).toBe(2);
  });
});

test.describe("countChars", () => {
  test("counts visible characters after HTML strip", () => {
    expect(countChars("<p>abc</p>")).toBe(3);
  });

  test("empty string is 0", () => {
    expect(countChars("")).toBe(0);
  });
});

test.describe("countItems", () => {
  test("arrays report their length", () => {
    expect(countItems([1, 2, 3])).toBe(3);
    expect(countItems([])).toBe(0);
  });

  test("non-array values report 0", () => {
    expect(countItems(undefined)).toBe(0);
    expect(countItems(null)).toBe(0);
    expect(countItems("abc")).toBe(0);
    expect(countItems({ length: 5 })).toBe(0);
  });
});

test.describe("countForSpec dispatch", () => {
  test("lines spec routes to countLines", () => {
    const spec: BoundedSpec = { kind: "lines", charsPerLine: 10 };
    expect(countForSpec(spec, "a".repeat(25))).toBe(3);
  });

  test("words spec routes to countWords", () => {
    const spec: BoundedSpec = { kind: "words" };
    expect(countForSpec(spec, "one two three")).toBe(3);
  });

  test("chars spec routes to countChars", () => {
    const spec: BoundedSpec = { kind: "chars" };
    expect(countForSpec(spec, "abcd")).toBe(4);
  });

  test("items spec routes to countItems", () => {
    const spec: BoundedSpec = { kind: "items" };
    expect(countForSpec(spec, [1, 2, 3, 4, 5])).toBe(5);
  });

  test("non-string values for string kinds coerce to empty", () => {
    const spec: BoundedSpec = { kind: "words" };
    expect(countForSpec(spec, undefined)).toBe(0);
    expect(countForSpec(spec, 123)).toBe(0);
    expect(countForSpec(spec, [])).toBe(0);
  });
});

test.describe("classify", () => {
  const range: BoundedSpec = { kind: "words", min: 20, max: 45 };

  test("count below min -> under", () => {
    expect(classify(10, range)).toBe("under");
  });

  test("count exactly at min -> ok", () => {
    expect(classify(20, range)).toBe("ok");
  });

  test("count between min and max -> ok", () => {
    expect(classify(30, range)).toBe("ok");
  });

  test("count exactly at max -> ok", () => {
    expect(classify(45, range)).toBe("ok");
  });

  test("count above max -> over", () => {
    expect(classify(46, range)).toBe("over");
  });

  test("only-max spec has no under state", () => {
    const maxOnly: BoundedSpec = { kind: "chars", max: 10 };
    expect(classify(0, maxOnly)).toBe("ok");
    expect(classify(10, maxOnly)).toBe("ok");
    expect(classify(11, maxOnly)).toBe("over");
  });

  test("only-min spec has no over state", () => {
    const minOnly: BoundedSpec = { kind: "items", min: 2 };
    expect(classify(0, minOnly)).toBe("under");
    expect(classify(2, minOnly)).toBe("ok");
    expect(classify(2000, minOnly)).toBe("ok");
  });
});

test.describe("labels", () => {
  test("defaultNoun returns the right singular per kind", () => {
    expect(defaultNoun("lines")).toBe("line");
    expect(defaultNoun("words")).toBe("word");
    expect(defaultNoun("chars")).toBe("character");
    expect(defaultNoun("items")).toBe("item");
  });

  test("pluralize singular at count=1 else plural", () => {
    expect(pluralize("word", 1)).toBe("word");
    expect(pluralize("word", 0)).toBe("words");
    expect(pluralize("word", 5)).toBe("words");
    expect(pluralize("characters", 5)).toBe("characters");
  });
});

test.describe("integration — the 5 spec-backed field limits", () => {
  // Lifted directly from puck/config.tsx annotations so any drift in
  // the spec shows up here. Update these fixtures when the schema's
  // CONSTRAINTS table changes.
  const HEADLINE: BoundedSpec = {
    kind: "lines",
    min: 2,
    max: 4,
    charsPerLine: 90,
  };
  const DECK: BoundedSpec = { kind: "words", min: 45, max: 75 };
  const QUOTE: BoundedSpec = { kind: "words", min: 20, max: 45 };
  const BULLETS: BoundedSpec = { kind: "items", min: 2, max: 5 };
  const LOGOS: BoundedSpec = { kind: "items", min: 3, max: 6 };

  test("Headline 1-liner is under, 2-liner is ok, 5-liner is over", () => {
    expect(
      classify(countForSpec(HEADLINE, "a".repeat(30)), HEADLINE),
    ).toBe("under");
    expect(
      classify(countForSpec(HEADLINE, "a".repeat(120)), HEADLINE),
    ).toBe("ok");
    expect(
      classify(countForSpec(HEADLINE, "a".repeat(500)), HEADLINE),
    ).toBe("over");
  });

  test("Deck at 20/60/100 words -> under/ok/over", () => {
    expect(
      classify(countForSpec(DECK, Array(20).fill("word").join(" ")), DECK),
    ).toBe("under");
    expect(
      classify(countForSpec(DECK, Array(60).fill("word").join(" ")), DECK),
    ).toBe("ok");
    expect(
      classify(countForSpec(DECK, Array(100).fill("word").join(" ")), DECK),
    ).toBe("over");
  });

  test("Blockquote at 10/30/60 words -> under/ok/over", () => {
    expect(
      classify(countForSpec(QUOTE, Array(10).fill("x").join(" ")), QUOTE),
    ).toBe("under");
    expect(
      classify(countForSpec(QUOTE, Array(30).fill("x").join(" ")), QUOTE),
    ).toBe("ok");
    expect(
      classify(countForSpec(QUOTE, Array(60).fill("x").join(" ")), QUOTE),
    ).toBe("over");
  });

  test("BulletList item count 1/3/6 -> under/ok/over", () => {
    expect(classify(countForSpec(BULLETS, [1]), BULLETS)).toBe("under");
    expect(classify(countForSpec(BULLETS, [1, 2, 3]), BULLETS)).toBe("ok");
    expect(
      classify(countForSpec(BULLETS, [1, 2, 3, 4, 5, 6]), BULLETS),
    ).toBe("over");
  });

  test("LogoStrip logo count 2/4/7 -> under/ok/over", () => {
    expect(classify(countForSpec(LOGOS, [1, 2]), LOGOS)).toBe("under");
    expect(classify(countForSpec(LOGOS, [1, 2, 3, 4]), LOGOS)).toBe("ok");
    expect(
      classify(countForSpec(LOGOS, [1, 2, 3, 4, 5, 6, 7]), LOGOS),
    ).toBe("over");
  });
});
