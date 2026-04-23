/**
 * Adapter layer — the ONLY module in the codebase that touches Puck's
 * internal JSON shape. Everything else works with `MuralDoc`.
 *
 * This file is stubs only. Real implementations land in a later migration
 * step (step 7 per the plan) when Puck is actually installed as a dependency.
 *
 * Invariants (to be tested in round-trip tests when implementations land):
 *   1. `puckToMuralDoc(muralDocToPuck(doc), doc.meta)` equals `doc` for any valid doc.
 *   2. Every node `id` in `doc` is preserved across the round trip.
 *   3. No field on any element is silently dropped.
 *   4. Puck-specific fields (zones wrapping, ComponentData envelope) live ONLY
 *      inside this module.
 */

import type { DocMeta, MuralDoc } from "../schema/mural-doc.js";

/**
 * Placeholder Puck JSON type. Replace with real `import type { Data } from "@measured/puck"`
 * (or the current Puck package name at the time of implementation) when the dependency lands.
 */
export type PuckData = {
  root: { props: Record<string, unknown> };
  content: Array<Record<string, unknown>>;
  zones?: Record<string, Array<Record<string, unknown>>>;
};

/**
 * Converts a canonical MuralDoc into Puck's editor-internal JSON shape.
 * Called when loading a document into the editor.
 */
export function muralDocToPuck(_doc: MuralDoc): PuckData {
  throw new Error("muralDocToPuck: not implemented — see adapter/puck.ts header.");
}

/**
 * Converts Puck's editor-internal JSON shape back into canonical MuralDoc.
 * Called when saving changes from the editor.
 *
 * `meta` is passed in because Puck's root props may not carry every DocMeta
 * field (e.g. `createdAt` is set at document creation and never changes).
 */
export function puckToMuralDoc(_puck: PuckData, _meta: DocMeta): MuralDoc {
  throw new Error("puckToMuralDoc: not implemented — see adapter/puck.ts header.");
}

/**
 * Round-trip helper for tests. Returns whether `puckToMuralDoc(muralDocToPuck(doc))`
 * equals `doc`. Intentionally structural (not identity) equality.
 */
export function roundTripIsIdentity(doc: MuralDoc): boolean {
  const puck = muralDocToPuck(doc);
  const back = puckToMuralDoc(puck, doc.meta);
  return JSON.stringify(back) === JSON.stringify(doc);
}
