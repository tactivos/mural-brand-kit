"use client";

/**
 * BoundedCounter — soft-limit badge shown below an inspector field.
 *
 * Renders a compact one-liner:
 *   "42 / 45–75 words"   (ok / green)
 *   "18 / 45–75 words — add more"   (under / muted)
 *   "89 / 45–75 words — over limit"  (over / red)
 *
 * Sized/colored to fit inside Puck's inspector panel without fighting
 * its own typography. All colors come from the brand palette tokens
 * already on the page (brand.css defines --jade, --ada-red, --muted).
 * If the tokens aren't available (e.g. iframe mode) we fall back to
 * hex literals that match the spec.
 *
 * This component is presentational only — the count and status come
 * pre-computed from src/puck/bounded.ts so we can unit-test the logic
 * without React.
 */
import type { CSSProperties } from "react";
import type { BoundedSpec, BoundedStatus } from "../../puck/bounded.js";
import { defaultNoun, pluralize } from "../../puck/bounded.js";

type Props = {
  spec: BoundedSpec;
  count: number;
  status: BoundedStatus;
};

const BASE_STYLE: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 6,
  padding: "4px 8px",
  borderRadius: 4,
  fontFamily:
    '"ABC Social", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
  fontSize: 11,
  lineHeight: 1.3,
  letterSpacing: 0.1,
};

const STATUS_STYLE: Record<BoundedStatus, CSSProperties> = {
  ok: {
    background: "rgba(0, 194, 122, 0.08)",
    color: "#00843F",
    border: "1px solid rgba(0, 194, 122, 0.3)",
  },
  under: {
    background: "rgba(0, 0, 0, 0.04)",
    color: "#626262",
    border: "1px solid rgba(0, 0, 0, 0.1)",
  },
  over: {
    background: "rgba(224, 41, 53, 0.08)",
    color: "#E02935",
    border: "1px solid rgba(224, 41, 53, 0.3)",
  },
};

function rangeLabel(spec: BoundedSpec): string {
  const { min, max } = spec;
  if (min !== undefined && max !== undefined) return `${min}–${max}`;
  if (max !== undefined) return `≤ ${max}`;
  if (min !== undefined) return `≥ ${min}`;
  return "";
}

function hint(status: BoundedStatus, spec: BoundedSpec): string {
  if (status === "over") {
    return spec.max !== undefined ? `over limit (${spec.max})` : "over limit";
  }
  if (status === "under") {
    return spec.min !== undefined
      ? `add ${Math.max(1, spec.min)} more`
      : "add more";
  }
  return "looks good";
}

export function BoundedCounter({ spec, count, status }: Props) {
  const noun = spec.noun ?? defaultNoun(spec.kind);
  const unit = pluralize(noun, count);
  const range = rangeLabel(spec);
  const counterText = range
    ? `${count} / ${range} ${unit}`
    : `${count} ${unit}`;

  return (
    <div
      role="status"
      aria-live="polite"
      data-bounded-status={status}
      style={{ ...BASE_STYLE, ...STATUS_STYLE[status] }}
    >
      <span>{counterText}</span>
      <span style={{ opacity: 0.8 }}>{hint(status, spec)}</span>
    </div>
  );
}
