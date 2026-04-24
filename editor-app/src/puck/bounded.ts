/**
 * Bounded fields — counter utilities (A13).
 *
 * This module is the pure side of the bounded-field feature. It exports:
 *   - BoundedSpec: the shape a field's `metadata.bounded` declaration
 *     must conform to.
 *   - BoundedStatus: "under" | "ok" | "over" — which gets driven to
 *     the BoundedCounter UI.
 *   - counter utilities (countLines, countWords, countChars,
 *     countItems) plus a unified countForSpec() dispatcher.
 *   - classify() — map (count, spec) -> BoundedStatus.
 *
 * No React, no Puck imports on purpose — this module runs inside the
 * inspector override (React) AND inside unit tests (Node) without any
 * DOM available, so everything here is string/array math.
 *
 * The constraints table itself lives in MURAL-DOC-SCHEMA.md under
 * "Validation rules (content guardrails)". Update the spec first, then
 * the field annotations in puck/config.tsx.
 *
 * Philosophy
 * ----------
 * Warn, never block. The spec says:
 *   "Overflow behavior: live counter + soft warning + AI trim
 *    suggestion + override-with-warning. Never silently drop content."
 * So classify() reports status, but nothing in this module stops the
 * user from saving an "over" value.
 */

/**
 * How to measure the value of a field.
 *
 *   - "lines":  approximate line count from character count. Used for
 *               headline text, where the user types a single string but
 *               it wraps to multiple visual lines at render size. We
 *               take `charsPerLine` (default 90, matching the spec's
 *               "~90 chars max per line at h1 size") and compute
 *               Math.ceil(chars / charsPerLine). This is an
 *               approximation, not a pixel-perfect measurement — we
 *               intentionally over-count on trailing whitespace so the
 *               warning fires a little early rather than a little late.
 *
 *   - "words":  whitespace-separated tokens. HTML is stripped first
 *               (so <strong>Foo</strong> counts as one word "Foo").
 *
 *   - "chars":  raw character count. Not currently used by any spec
 *               entry but exposed for future use (e.g. Twitter-style
 *               caption limits).
 *
 *   - "items":  array length. Used for arrayField bullet counts and
 *               slotField logo counts.
 */
export type BoundedKind = "lines" | "words" | "chars" | "items";

export type BoundedSpec = {
  kind: BoundedKind;
  /** Minimum recommended count. Omit to ignore the lower bound. */
  min?: number;
  /** Maximum recommended count. Omit to ignore the upper bound. */
  max?: number;
  /**
   * Only honored when kind === "lines". Defaults to 90. Lower this for
   * narrower columns or larger type sizes; raise it for deck-style
   * single-line heros.
   */
  charsPerLine?: number;
  /**
   * Short singular noun used in the counter UI — e.g. "word", "line",
   * "item", "character". Auto-pluralized by the UI (word -> words).
   * Omit to use the kind's default noun.
   */
  noun?: string;
};

export type BoundedStatus = "under" | "ok" | "over";

// ─────────────────────────────────────────────────────────────────────────────
// Counters (string/array input only — zero React / zero DOM)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Strip any HTML tags (and HTML comments) from a string, returning the
 * plain text. Used before word/char counting so rich-text fields don't
 * see `<strong>`/`<a>` as words.
 *
 * Intentionally naive — it's fine because the only HTML that can reach
 * us comes from Puck's own RichtextField, which emits a locked-down
 * subset (paragraph, bold, link) via the TipTap gate in puck/config.tsx.
 */
export function stripHTML(input: string): string {
  return input
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/** Approximate visual line count for a single-line input. */
export function countLines(text: string, charsPerLine = 90): number {
  const plain = stripHTML(text).trim();
  if (plain.length === 0) return 0;
  // Honor explicit newlines first — if the user typed multiple lines
  // (e.g. in a textarea), each is at least one line, then each long
  // line contributes extra wrap lines.
  const lines = plain.split(/\r?\n/);
  let total = 0;
  for (const line of lines) {
    const len = line.length;
    total += Math.max(1, Math.ceil(len / charsPerLine));
  }
  return total;
}

/** Whitespace-separated word count of the plain-text view of input. */
export function countWords(text: string): number {
  const plain = stripHTML(text).trim();
  if (plain.length === 0) return 0;
  return plain.split(/\s+/).length;
}

/** Raw character count (HTML tags stripped first). */
export function countChars(text: string): number {
  return stripHTML(text).length;
}

/** Array length. Non-array inputs (including null/undefined) count as 0. */
export function countItems(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

/**
 * Unified entry point. Picks the right counter for `spec.kind`:
 *   - string-kind specs (lines/words/chars) expect a string value; any
 *     non-string is coerced to "".
 *   - "items" expects an array value; non-arrays count as 0.
 */
export function countForSpec(spec: BoundedSpec, value: unknown): number {
  if (spec.kind === "items") return countItems(value);
  const text = typeof value === "string" ? value : "";
  switch (spec.kind) {
    case "lines":
      return countLines(text, spec.charsPerLine ?? 90);
    case "words":
      return countWords(text);
    case "chars":
      return countChars(text);
  }
}

/** Three-state classifier for the counter badge. */
export function classify(count: number, spec: BoundedSpec): BoundedStatus {
  if (spec.max !== undefined && count > spec.max) return "over";
  if (spec.min !== undefined && count < spec.min) return "under";
  return "ok";
}

/**
 * Default singular noun for a kind, used when BoundedSpec.noun is not
 * supplied. Paired with pluralize() in the UI.
 */
export function defaultNoun(kind: BoundedKind): string {
  switch (kind) {
    case "lines":
      return "line";
    case "words":
      return "word";
    case "chars":
      return "character";
    case "items":
      return "item";
  }
}

/** Conservative English pluralization — good enough for "word/words", "item/items". */
export function pluralize(noun: string, count: number): string {
  if (count === 1) return noun;
  if (noun.endsWith("s")) return noun;
  return `${noun}s`;
}
