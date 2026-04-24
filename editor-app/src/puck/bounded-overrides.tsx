"use client";

/**
 * Puck overrides.fieldTypes wrappers for bounded fields (A13).
 *
 * Each wrapper:
 *   1. Renders Puck's default field UI (via `children`), untouched.
 *   2. Reads `field.metadata.bounded` — if absent, the wrapper is a
 *      pure pass-through. Fields without `metadata.bounded` behave
 *      exactly as before, so this feature is additive per-field.
 *   3. If present, runs the appropriate counter over the field's
 *      current value and renders a <BoundedCounter /> badge below.
 *
 * Why overrides, not Plugins?
 * ---------------------------
 * Puck ships two extension points that apply to every editor
 * instance: Plugins and Overrides. Plugins are for changing how Puck
 * behaves (adding toolbar actions, custom save hooks, etc.).
 * Overrides are for changing how Puck *renders* — specifically the
 * inspector / outline / header UI. Our need is purely visual (add a
 * badge below a field), so overrides is the right seam.
 *
 * overrides.fieldTypes[type]: React.FC<FieldProps & { children, name }>
 * gives us:
 *   - field.metadata    — how we read BoundedSpec
 *   - value             — current field value (string, array, etc.)
 *   - children          — Puck's default field UI, already rendered
 *                          with its own onChange wiring; we never
 *                          intercept input.
 *
 * We cover five field types:
 *   - text, textarea, richtext : string-kind counters
 *   - array                    : items counter
 *   - slot                     : items counter (slots carry an array)
 *
 * Select / radio / number / external / custom are intentionally
 * left alone — no spec entry uses them today.
 */
import type { ComponentType, ReactNode } from "react";
import { Fragment } from "react";
import type { Overrides } from "@puckeditor/core";
import { BoundedCounter } from "../components/inspector/BoundedCounter.js";
import type { BoundedSpec } from "./bounded.js";
import { classify, countForSpec } from "./bounded.js";

/**
 * Runtime shape of a single entry in `overrides.fieldTypes`. Puck's
 * public types express this as `React.FunctionComponent<FieldProps<F> &
 * { children; name }>` where F is narrowed per field type, but the
 * overrides map itself is a Partial record keyed by field kind. Our
 * override only cares about `field.metadata?.bounded` and `value`, so
 * we re-type the slot with the loose shape below to avoid dragging
 * the entire per-kind generic zoo into this module.
 */
type FieldTypeOverride = ComponentType<{
  field: { metadata?: { bounded?: BoundedSpec } };
  value: unknown;
  children: ReactNode;
  // name / onChange / id / readOnly are part of the contract but
  // unused in this wrapper; omitting them narrows our surface area.
}>;

function withBoundedCounter(): FieldTypeOverride {
  return function BoundedWrapper({ field, value, children }) {
    const spec = field.metadata?.bounded;
    if (!spec) return <Fragment>{children}</Fragment>;

    const count = countForSpec(spec, value);
    const status = classify(count, spec);

    return (
      <Fragment>
        {children}
        <BoundedCounter spec={spec} count={count} status={status} />
      </Fragment>
    );
  };
}

/**
 * Ready-made overrides object for Puck. Spread or attach directly:
 *
 *   <Puck config={...} overrides={boundedOverrides} />
 *
 * Fields without `metadata.bounded` render identically to stock Puck,
 * so mounting this override has zero visual effect on unannotated
 * fields — by design.
 */
export const boundedOverrides: Partial<Overrides> = {
  fieldTypes: {
    text: withBoundedCounter() as never,
    textarea: withBoundedCounter() as never,
    richtext: withBoundedCounter() as never,
    array: withBoundedCounter() as never,
    slot: withBoundedCounter() as never,
  },
};
