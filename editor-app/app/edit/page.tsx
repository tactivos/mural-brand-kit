"use client";

/**
 * /edit — single UI surface for editing AND previewing a MuralDoc.
 *
 * Two modes share the same URL and the same data:
 *   - "edit"    → Puck three-panel UI (Navigator + Canvas + Inspector)
 *   - "preview" → the same component tree that /preview/product-one-sheet
 *                 uses (ProductOneSheetRenderer), with no editor chrome —
 *                 i.e. exactly what `File > Print > Save as PDF` produces.
 *
 * Why both modes are mounted simultaneously
 * -----------------------------------------
 * We render Puck and the preview surface side-by-side in the DOM and
 * toggle between them with `display: none`. This:
 *   1. Preserves Puck's internal state (selection, scroll, undo stack)
 *      across mode switches — toggling back to edit doesn't lose your
 *      place.
 *   2. Keeps the preview live: every Puck `onChange` syncs a MuralDoc
 *      mirror that the preview surface reads, so flipping the toggle
 *      shows the latest in-progress edits without any save step.
 *   3. Lets `Cmd+P` print correctly from either mode — see the print
 *      CSS at the bottom of this file, which forces the preview
 *      subtree as the only visible thing on paper.
 *
 * Lifecycle (unchanged from earlier revisions):
 *   1. First render (SSR + client): show the fixture. No hydration
 *      mismatch.
 *   2. After mount: check localStorage. If a saved MuralDoc exists,
 *      swap it in (forcing a Puck remount via `key`). `?reset=1`
 *      clears storage and drops the param from the URL.
 *   3. On Publish: round-trip through puckToMuralDoc and save.
 *
 * fieldTransforms.richtext + boundedOverrides docs live below in the
 * `FIELD_TRANSFORMS` and `boundedOverrides` references — see prior
 * revisions for the full rationale.
 */

import { Puck } from "@puckeditor/core";
import type { FieldTransforms } from "@puckeditor/core";
import { useEffect, useMemo, useState } from "react";
import { puckConfig, type MuralPuckData } from "../../src/puck/config.js";
import { boundedOverrides } from "../../src/puck/bounded-overrides.js";
import {
  muralDocToPuck,
  puckToMuralDoc,
} from "../../src/adapters/muraldoc-puck.js";
import { muralOverviewFixture } from "../../src/fixtures/mural-overview.js";
import {
  loadDoc,
  saveDoc,
  clearDoc,
} from "../../src/persistence/local-storage.js";
import { ProductOneSheetRenderer } from "../../src/components/preview/ProductOneSheetRenderer.js";
import type { MuralDoc } from "../../src/schema/mural-doc.js";

const DOC_TYPE = "product-one-sheet" as const;

/**
 * Override Puck's built-in richtext transform so the component render
 * function receives the raw HTML string instead of an inline-editor
 * ReactNode. Without this, every render crashes with `e.trim is not a
 * function` because our components parse the value as HTML.
 *
 * Tradeoff: in-canvas inline rich-text editing is disabled. Editing
 * happens via the right-hand inspector panel, which still uses Puck's
 * full TipTap UI (bold, link dialog).
 */
const FIELD_TRANSFORMS: FieldTransforms = {
  richtext: ({ value }) => value,
};

type Mode = "edit" | "preview";

export default function EditPage() {
  const fixtureData: MuralPuckData = useMemo(
    () => muralDocToPuck(muralOverviewFixture),
    [],
  );

  const [data, setData] = useState<MuralPuckData>(fixtureData);
  // `remountKey` forces Puck to re-initialize when we hydrate from
  // storage. Puck reads `data` only on mount; bumping the key is the
  // supported way to swap initial data at runtime.
  const [remountKey, setRemountKey] = useState(0);

  // Live MuralDoc mirror for the preview surface. Updated on every
  // Puck onChange via the adapter. We seed with the fixture so the
  // first paint already has something to show; the mount-time
  // hydration step below swaps in the saved doc if there is one.
  const [livePreviewDoc, setLivePreviewDoc] = useState<MuralDoc>(
    muralOverviewFixture,
  );

  const [mode, setMode] = useState<Mode>("edit");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shouldReset = params.has("reset");
    if (shouldReset) {
      clearDoc(DOC_TYPE);
      window.history.replaceState(null, "", "/edit");
      return;
    }

    const stored = loadDoc(DOC_TYPE);
    if (stored) {
      try {
        setData(muralDocToPuck(stored));
        setLivePreviewDoc(stored);
        setRemountKey((v) => v + 1);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(
          "[edit] stored doc failed to load via adapter; clearing it",
          error,
        );
        clearDoc(DOC_TYPE);
      }
    }
  }, []);

  return (
    <div className="edit-shell" data-mode={mode}>
      <header className="edit-shell__topbar">
        <div className="edit-shell__brand">Mural PDF Generator</div>
        <div className="edit-shell__modes" role="tablist" aria-label="View mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "edit"}
            className={
              "edit-shell__mode-btn" +
              (mode === "edit" ? " edit-shell__mode-btn--active" : "")
            }
            onClick={() => setMode("edit")}
          >
            Edit
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "preview"}
            className={
              "edit-shell__mode-btn" +
              (mode === "preview" ? " edit-shell__mode-btn--active" : "")
            }
            onClick={() => setMode("preview")}
          >
            Preview
          </button>
        </div>
        <div className="edit-shell__actions">
          {mode === "preview" ? (
            <button
              type="button"
              className="edit-shell__action-btn"
              onClick={() => window.print()}
              title="Print or save as PDF"
            >
              Print
            </button>
          ) : null}
        </div>
      </header>

      <div className="edit-shell__main">
        <div className="edit-shell__edit">
          <Puck
            key={remountKey}
            config={puckConfig}
            data={data}
            iframe={{ enabled: false }}
            fieldTransforms={FIELD_TRANSFORMS}
            overrides={boundedOverrides}
            onChange={(newData) => {
              try {
                const doc = puckToMuralDoc(
                  newData as unknown as MuralPuckData,
                  muralOverviewFixture,
                );
                setLivePreviewDoc(doc);
              } catch {
                // Puck data can be transiently shaped in ways the adapter
                // refuses (e.g. mid-drag). Keep the last good preview doc.
              }
            }}
            onPublish={(published) => {
              const doc = puckToMuralDoc(
                published as unknown as MuralPuckData,
                muralOverviewFixture,
              );
              const ok = saveDoc(doc);
              // eslint-disable-next-line no-console
              console.log(
                ok
                  ? "[edit] saved MuralDoc to localStorage"
                  : "[edit] save failed (storage disabled?)",
                doc,
              );
            }}
          />
        </div>
        <div className="edit-shell__preview">
          <ProductOneSheetRenderer doc={livePreviewDoc} />
        </div>
      </div>
    </div>
  );
}
