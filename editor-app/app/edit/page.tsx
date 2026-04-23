"use client";

/**
 * /edit — Puck-based editor scaffold (A6).
 *
 * This is the first working integration of Puck with our component set.
 * Scope: a single canvas with drag-and-drop of Headline / Eyebrow /
 * BodyCopy. No slot allowlists, no sections/strips, no rich text. Just
 * proving the plumbing works end-to-end before layering the real
 * hierarchy on top.
 *
 * The canvas renders inline (iframe.enabled: false) so brand.css applies
 * directly. A future step can switch to iframe mode once we decide how
 * to shuttle brand.css into the iframe.
 */
import { Puck } from "@puckeditor/core";
import type { Data } from "@puckeditor/core";
import { puckConfig } from "../../src/puck/config.js";

const initialData: Data = {
  content: [
    {
      type: "Eyebrow",
      props: { id: "Eyebrow-1", text: "Product overview" },
    },
    {
      type: "Headline",
      props: { id: "Headline-1", text: "Make it a mural, not a meeting.", level: 1 },
    },
    {
      type: "BodyCopy",
      props: {
        id: "BodyCopy-1",
        text: "When ideas are visible, progress accelerates. Mural's intuitive workspace and AI-powered tools bring teams into alignment instantly — helping you move from concept to outcome with speed and clarity.",
      },
    },
  ],
  root: { props: {} },
};

export default function EditPage() {
  return (
    <Puck
      config={puckConfig}
      data={initialData}
      iframe={{ enabled: false }}
      onPublish={(data) => {
        // A6 scaffold: log to console. A future step wires this to a
        // MuralDoc adapter and persistence layer.
        // eslint-disable-next-line no-console
        console.log("[puck] publish", data);
      }}
    />
  );
}
