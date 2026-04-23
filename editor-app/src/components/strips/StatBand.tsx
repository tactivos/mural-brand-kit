import type { ReactNode } from "react";

/**
 * StatBand — the full-width "hero stat + narrative + logo row" block
 * with a natural (#EDEDD8) background.
 *
 * Emits: <div class="stat-band">
 *          <div class="stat-hero">
 *            <div class="stat-hero-intro">{intro slot}</div>
 *            <div>{body slot}</div>
 *          </div>
 *        </div>
 *
 * Styling comes from brand.css `.stat-band` + `.stat-hero` +
 * `.stat-hero-intro`.
 *
 * The rule divider and logo strip that often follow a stat-band on the
 * same section are composed by the parent section, not nested here.
 * That keeps this component's shape predictable and reusable.
 */
export function StatBand({
  intro,
  body,
}: {
  intro: ReactNode;
  body: ReactNode;
}): JSX.Element {
  return (
    <div className="stat-band">
      <div className="stat-hero">
        <div className="stat-hero-intro">{intro}</div>
        <div>{body}</div>
      </div>
    </div>
  );
}

/**
 * StatBandRule — the thin rule that sits between a stat-band and a
 * logo-strip inside a natural-background section.
 *
 * Emits the exact inline-style markup used in the Mural Overview reskin:
 *   <div style="background: var(--natural); padding: 0 0.18in;">
 *     <hr style="margin: 0; border: none; border-top: 1px solid var(--rule);">
 *   </div>
 *
 * This is one of the known "inline-style smells" from the reskins. A
 * dedicated class replaces it in a later pattern-library refresh.
 */
export function StatBandRule(): JSX.Element {
  return (
    <div style={{ background: "var(--natural)", padding: "0 0.18in" }}>
      <hr style={{ margin: 0, border: "none", borderTop: "1px solid var(--rule)" }} />
    </div>
  );
}
