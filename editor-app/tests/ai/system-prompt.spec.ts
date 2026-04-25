import { test, expect } from "@playwright/test";
import {
  buildSystemPrompt,
  buildUserPrompt,
  stampTimestamps,
} from "../../src/ai/system-prompt.js";
import { LOGO_MANIFEST } from "../../src/data/logo-manifest.js";
import { muralOverviewFixture } from "../../src/fixtures/mural-overview.js";

/**
 * Unit tests for the prompt builders. Pure functions — no Azure call.
 *
 * These guard against three classes of regression:
 *  1. The prompt drifting away from the schema (e.g. adding a strip
 *     type to MURAL-DOC-SCHEMA.md but forgetting to mention it here).
 *  2. The fixture stopping round-tripping through stringify/parse.
 *  3. Logo keys silently being dropped from the allow-list, which
 *     would let the model invent unsupported keys and crash the
 *     adapter at render time.
 */

test.describe("buildSystemPrompt", () => {
  test("rejects unsupported docTypes in v1", () => {
    expect(() => buildSystemPrompt("use-case")).toThrow(/not supported in v1/);
    expect(() => buildSystemPrompt("competitive-comparison")).toThrow();
  });

  test("accepts product-one-sheet and includes the canonical fixture", () => {
    const prompt = buildSystemPrompt("product-one-sheet");
    expect(prompt).toContain('"docType": "product-one-sheet"');
    expect(prompt).toContain('"schemaVersion": 1');
    expect(prompt).toContain("Make it a mural, not a meeting.");
  });

  test("declares schemaVersion and docType as literals", () => {
    const prompt = buildSystemPrompt("product-one-sheet");
    expect(prompt).toContain("`schemaVersion` is the literal number 1.");
    expect(prompt).toContain('`docType` is the literal string "product-one-sheet"');
  });

  test("lists every logo key from the manifest", () => {
    const prompt = buildSystemPrompt("product-one-sheet");
    for (const key of Object.keys(LOGO_MANIFEST)) {
      expect(prompt, `prompt should mention logo key "${key}"`).toContain(
        `"${key}"`,
      );
    }
  });

  test("declares the bounded constraints from MURAL-DOC-SCHEMA.md", () => {
    const prompt = buildSystemPrompt("product-one-sheet");
    expect(prompt).toContain("Headline.props.text");
    expect(prompt).toContain("2 to 4 lines");
    expect(prompt).toContain("Deck.props.text");
    expect(prompt).toContain("45 to 75 words");
    expect(prompt).toContain("Blockquote.props.text");
    expect(prompt).toContain("20 to 45 words");
    expect(prompt).toContain("BulletList.props.items");
    expect(prompt).toContain("2 to 5 items");
    expect(prompt).toContain("LogoStrip.children");
    expect(prompt).toContain("3 to 6");
  });

  test("instructs the model to emit JSON only", () => {
    const prompt = buildSystemPrompt("product-one-sheet");
    expect(prompt).toContain("JSON only");
  });

  test("does NOT mention bold marks via legacy class names", () => {
    // Regression guard for hallucinated marks. Only `bold` is allowed.
    const prompt = buildSystemPrompt("product-one-sheet");
    expect(prompt).toContain('"marks": ["bold"]');
    expect(prompt).not.toContain('"italic"');
    expect(prompt).not.toContain('"underline"');
  });
});

test.describe("buildUserPrompt", () => {
  test("includes the topic prominently", () => {
    const out = buildUserPrompt({ topic: "Enterprise security posture" });
    expect(out.startsWith("Topic: Enterprise security posture")).toBe(true);
  });

  test("trims whitespace on the topic", () => {
    const out = buildUserPrompt({ topic: "   Hello world   " });
    expect(out).toContain("Topic: Hello world");
    expect(out).not.toContain("Topic:    Hello");
  });

  test("omits Audience when not provided", () => {
    const out = buildUserPrompt({ topic: "x" });
    expect(out).not.toContain("Audience:");
  });

  test("omits Audience when an empty string is provided", () => {
    const out = buildUserPrompt({ topic: "x", audience: "   " });
    expect(out).not.toContain("Audience:");
  });

  test("includes Audience when provided", () => {
    const out = buildUserPrompt({ topic: "x", audience: "CISOs" });
    expect(out).toContain("Audience: CISOs");
  });

  test("defaults tone and length when omitted", () => {
    const out = buildUserPrompt({ topic: "x" });
    expect(out).toContain("Tone: Professional");
    expect(out).toContain("Output length: Concise");
  });

  test("respects explicit tone and length", () => {
    const out = buildUserPrompt({
      topic: "x",
      tone: "Bold",
      outputLength: "Detailed",
    });
    expect(out).toContain("Tone: Bold");
    expect(out).toContain("Output length: Detailed");
  });

  test("ends with the JSON-only instruction", () => {
    const out = buildUserPrompt({ topic: "x" });
    expect(out.trim().endsWith("Output JSON only.")).toBe(true);
  });
});

test.describe("stampTimestamps", () => {
  test("produces a fresh ISO 8601 timestamp on createdAt and updatedAt", () => {
    const before = Date.now();
    const out = stampTimestamps(muralOverviewFixture);
    const after = Date.now();

    const created = Date.parse(out.meta.createdAt);
    const updated = Date.parse(out.meta.updatedAt);

    expect(Number.isNaN(created)).toBe(false);
    expect(Number.isNaN(updated)).toBe(false);
    expect(created).toBeGreaterThanOrEqual(before);
    expect(created).toBeLessThanOrEqual(after);
    expect(updated).toBe(created);
  });

  test("does not mutate the input doc", () => {
    const original = muralOverviewFixture.meta.createdAt;
    stampTimestamps(muralOverviewFixture);
    expect(muralOverviewFixture.meta.createdAt).toBe(original);
  });

  test("preserves all other meta fields", () => {
    const out = stampTimestamps(muralOverviewFixture);
    expect(out.meta.title).toBe(muralOverviewFixture.meta.title);
    expect(out.meta.topicLabel).toBe(muralOverviewFixture.meta.topicLabel);
    expect(out.meta.tone).toBe(muralOverviewFixture.meta.tone);
    expect(out.meta.outputLength).toBe(muralOverviewFixture.meta.outputLength);
  });

  test("preserves the document body unchanged", () => {
    const out = stampTimestamps(muralOverviewFixture);
    expect(out.pages).toEqual(muralOverviewFixture.pages);
    expect(out.docType).toBe(muralOverviewFixture.docType);
    expect(out.schemaVersion).toBe(muralOverviewFixture.schemaVersion);
  });
});
