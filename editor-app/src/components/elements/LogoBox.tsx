import type { CSSProperties } from "react";

/**
 * LogoBox — a single logo placement with optical-balance controls.
 *
 * Emits: <div class="logo-box has-logo" style="--asset-scale: X; --asset-shift-x: Y; --asset-shift-y: Z;">
 *          <img src="..." alt="...">
 *        </div>
 *
 * Pattern library ref: `.logo-box.has-logo` + `--asset-scale` /
 * `--asset-shift-x` / `--asset-shift-y` CSS custom props. See
 * reskin-rules.mdc > "Logo handling" for the optical-balancing protocol.
 *
 * Per-asset `assetScale` is the primary optical-balance dial: compact
 * marks (IBM) scale up (0.90+), very wide marks (Booz Allen) scale down.
 *
 * Resolution from `logoKey` (schema) to `src`/`alt` is the renderer's
 * responsibility via a logo manifest; this component receives the
 * already-resolved strings.
 */
export function LogoBox({
  src,
  alt,
  assetScale,
  assetShiftX,
  assetShiftY,
}: {
  src: string;
  alt: string;
  assetScale?: number;
  assetShiftX?: string;
  assetShiftY?: string;
}): JSX.Element {
  const style: CSSProperties = {};
  if (typeof assetScale === "number") {
    (style as Record<string, string>)["--asset-scale"] = String(assetScale);
  }
  if (assetShiftX) {
    (style as Record<string, string>)["--asset-shift-x"] = assetShiftX;
  }
  if (assetShiftY) {
    (style as Record<string, string>)["--asset-shift-y"] = assetShiftY;
  }

  return (
    <div className="logo-box has-logo" style={style}>
      <img src={src} alt={alt} />
    </div>
  );
}
