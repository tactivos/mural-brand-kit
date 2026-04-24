"use client";

/**
 * /edit — Puck-based editor with localStorage persistence + bounded
 * fields (A13).
 *
 * Lifecycle:
 *   1. First render (SSR + client): show the fixture. This guarantees
 *      no hydration mismatch even though localStorage is only
 *      available on the client.
 *   2. After mount: check localStorage. If a saved MuralDoc exists
 *      for this docType, swap it in (forcing a Puck remount via `key`).
 *      If `?reset=1` is present, clear storage first and drop the param
 *      from the URL so refreshes don't reset again.
 *   3. On Publish: run puckToMuralDoc through the adapter and save.
 *
 * Escape hatch: visit `/edit?reset=1` to wipe the saved doc and seed
 * from fixture. Keeps the UI minimal until we add a proper reset
 * button through Puck's overrides.
 *
 * Save trigger: explicit Publish button. Auto-save on every change is
 * a later step (needs debouncing to avoid hammering localStorage on
 * every keystroke).
 *
 * Known v1 property: saving passes the doc through the adapter
 * round-trip. Lossy bits documented in src/adapters/muraldoc-puck.ts
 * (multi-paragraph, section boundaries) are collapsed on the first
 * save. Bold marks and links now round-trip losslessly (A12).
 *
 * fieldTransforms.richtext override
 * ---------------------------------
 * Puck's default richtext transform replaces a RichtextField's value
 * with an inline TipTap EditorContent ReactNode before passing it to
 * the component's render function. That default assumes you render
 * the ReactNode directly (`<div>{richTextProp}</div>`) and get an
 * in-canvas WYSIWYG editor for free. We can't use that assumption —
 * our BodyCopy / IntroCopy / BulletList components need raw HTML so
 * they can parse it into InlineNode[] and stamp the brand's markup
 * (`.body-copy p`, `.intro-copy p`, etc.) around it. Without this
 * override, every render crashes with `e.trim is not a function`
 * because the code tries to parse a ReactNode as HTML.
 *
 * Tradeoff: users lose in-canvas inline click-to-edit for rich
 * fields. Editing happens via the right-hand inspector panel, which
 * still uses Puck's full TipTap UI (bold button, link dialog). This
 * is consistent with the rest of our inspector-first flow and does
 * not reduce what users can DO, only where they do it.
 *
 * boundedOverrides (A13)
 * ----------------------
 * overrides={boundedOverrides} installs a render wrapper around the
 * five field types (text/textarea/richtext/array/slot) that reads
 * `field.metadata.bounded` and appends a live counter badge below
 * the default field UI. Fields without `metadata.bounded` are
 * untouched. See src/puck/bounded-overrides.tsx and the annotated
 * fields in src/puck/config.tsx (Headline, Deck, Blockquote,
 * BulletList, LogoStrip).
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

const DOC_TYPE = "product-one-sheet" as const;

/**
 * Override Puck's built-in richtext transform so the component render
 * function receives the raw HTML string instead of an inline-editor
 * ReactNode. See the fieldTransforms docstring at the top of this file.
 */
const FIELD_TRANSFORMS: FieldTransforms = {
  richtext: ({ value }) => value,
};

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

  useEffect(() => {
    // Reset takes precedence: if the user explicitly navigated to
    // /edit?reset=1, wipe storage, strip the query param, then fall
    // through to the normal "no saved doc" path (fixture stays).
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
        setRemountKey((v) => v + 1);
      } catch (error) {
        // Stored doc is structurally valid (passed isValidMuralDoc) but
        // has shape the current adapter can't translate — probably from
        // a newer Puck config than was running when it was saved. Clear
        // it so the next refresh starts clean, and surface the error
        // in the console for anyone watching.
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
    <Puck
      key={remountKey}
      config={puckConfig}
      data={data}
      iframe={{ enabled: false }}
      fieldTransforms={FIELD_TRANSFORMS}
      overrides={boundedOverrides}
      onPublish={(published) => {
        const doc = puckToMuralDoc(
          published as unknown as MuralPuckData,
          muralOverviewFixture,
        );
        const ok = saveDoc(doc);
        // eslint-disable-next-line no-console
        console.log(
          ok ? "[edit] saved MuralDoc to localStorage" : "[edit] save failed (storage disabled?)",
          doc,
        );
      }}
    />
  );
}
