/**
 * local-storage.ts — browser-only MuralDoc persistence for the v1 editor.
 *
 * This is the simplest persistence layer that still uses the canonical
 * MuralDoc format: JSON blobs keyed by docType under a versioned
 * namespace. It's enough to let users close the tab, come back later,
 * and resume where they left off.
 *
 * Scope v1 (A11):
 *   - One saved doc per docType (no named files, no history).
 *   - Schema-version gated: stored docs with a wrong schemaVersion are
 *     treated as missing (forces a re-seed from fixture rather than
 *     crashing on incompatible shapes).
 *   - Fails silently on quota / disabled storage — the editor still
 *     works in-memory, user just can't save.
 *   - Every save passes through the MuralDoc <-> Puck adapter, so the
 *     v1 losses documented in muraldoc-puck.ts (inline marks,
 *     multi-paragraph body copy, section boundaries) are locked in on
 *     the first save. This is acceptable because the RichtextField
 *     step removes the lossy bits before any real user data is at risk.
 *
 * Later steps (not in scope here):
 *   - Server-side persistence (`/api/docs/:docType`) backed by a JSON
 *     file in the repo so multi-session edits aren't trapped in one
 *     browser profile.
 *   - Multi-doc support (named slots, switcher UI).
 *   - Auto-save on change (currently save-on-publish only).
 *   - Versioned migrations (bump CURRENT_SCHEMA and write a migrator).
 */

import type { MuralDoc, DocType } from "../schema/mural-doc.js";

// Namespaced so a future schema bump doesn't collide with v1 blobs. If
// we ever need to migrate, bump this and write a migrator; today, v1
// blobs under the v1 namespace live forever, v2 gets its own namespace.
const KEY_NAMESPACE = "mural-editor:v1";

/** Build the localStorage key for a given docType. */
function storageKey(docType: DocType): string {
  return `${KEY_NAMESPACE}:${docType}`;
}

/**
 * Load the saved MuralDoc for a docType, or null if none / corrupt /
 * wrong schema / running server-side. Never throws.
 */
export function loadDoc(docType: DocType): MuralDoc | null {
  if (typeof window === "undefined") return null;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(storageKey(docType));
  } catch {
    // Storage disabled (private mode on some browsers, blocked by policy).
    return null;
  }
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Corrupt JSON — nuke it so the next save starts clean, then
    // fall back to fixture.
    clearDoc(docType);
    return null;
  }

  if (!isValidMuralDoc(parsed, docType)) {
    // Shape doesn't match expectations (old schema, wrong docType,
    // missing required fields). Drop it; forcing a re-seed is safer
    // than letting the editor crash on a field access.
    clearDoc(docType);
    return null;
  }

  return parsed;
}

/**
 * Save the MuralDoc to localStorage under its docType. Silently drops
 * on quota exceeded / disabled storage. Returns true on success so
 * callers can optionally surface "saved" / "save failed" UI.
 */
export function saveDoc(doc: MuralDoc): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(storageKey(doc.docType), JSON.stringify(doc));
    return true;
  } catch {
    // QuotaExceededError or SecurityError — not recoverable from here.
    return false;
  }
}

/** Remove the saved MuralDoc for a docType. Always safe to call. */
export function clearDoc(docType: DocType): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKey(docType));
  } catch {
    // Nothing to do — storage is disabled anyway.
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal: light-touch validation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shape check for a loaded blob. NOT a full schema validator — that
 * would duplicate the TS types. We just confirm the envelope is right
 * and the schemaVersion matches. Deeper problems (malformed elements,
 * unknown strip types) surface when the adapter runs and throws an
 * AdapterError the editor can catch.
 *
 * Exported so the AI route (`/api/generate`) can re-validate model
 * output server-side before sending it back to the client. The two
 * call sites have the same correctness need: "is this thing safe to
 * hand to the adapter?".
 */
export function isValidMuralDoc(
  value: unknown,
  expectedDocType: DocType,
): value is MuralDoc {
  if (typeof value !== "object" || value === null) return false;
  const doc = value as Partial<MuralDoc>;
  if (doc.schemaVersion !== 1) return false;
  if (doc.docType !== expectedDocType) return false;
  if (typeof doc.meta !== "object" || doc.meta === null) return false;
  if (!Array.isArray(doc.pages)) return false;
  return true;
}
