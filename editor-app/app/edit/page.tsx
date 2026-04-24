"use client";

/**
 * /edit — Puck-based editor scaffold (A10).
 *
 * This page loads the canonical MuralDoc fixture through the adapter
 * so the editor's seed state is a real MuralDoc, not a hand-written
 * Puck blob. `onPublish` round-trips back to MuralDoc via the same
 * adapter — the eventual persistence / API layer will plug in there.
 *
 * The canvas renders inline (iframe.enabled: false) so brand.css
 * applies directly. A future step can switch to iframe mode once we
 * decide how to shuttle brand.css into the iframe.
 */
import { Puck } from "@puckeditor/core";
import { useMemo } from "react";
import { puckConfig, type MuralPuckData } from "../../src/puck/config.js";
import {
  muralDocToPuck,
  puckToMuralDoc,
} from "../../src/adapters/muraldoc-puck.js";
import { muralOverviewFixture } from "../../src/fixtures/mural-overview.js";

export default function EditPage() {
  const initialData: MuralPuckData = useMemo(
    () => muralDocToPuck(muralOverviewFixture),
    [],
  );

  return (
    <Puck
      config={puckConfig}
      data={initialData}
      iframe={{ enabled: false }}
      onPublish={(data) => {
        // Adapter round-trip: Puck Data -> MuralDoc. Uses the loaded
        // fixture as baseDoc so editor-invisible metadata (title,
        // docType, tone, createdAt) survives the trip. Persistence
        // layer (future commit) plugs in here.
        const doc = puckToMuralDoc(
          data as unknown as MuralPuckData,
          muralOverviewFixture,
        );
        // eslint-disable-next-line no-console
        console.log("[puck] publish -> MuralDoc", doc);
      }}
    />
  );
}
