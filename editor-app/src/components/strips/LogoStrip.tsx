import type { CSSProperties, ReactNode } from "react";

/**
 * LogoStrip — optically-balanced row (or grid) of customer/partner logos.
 *
 * Emits: <div class="logo-strip" aria-label="{ariaLabel}">{children}</div>
 *
 * Styling from brand.css `.logo-strip`: flex/grid with consistent row
 * gaps; each child is a LogoBox that carries its own per-asset scale.
 *
 * Constraint (CONSTRAINTS.LogoStrip): 3-6 logos per row by default, but
 * the Mural Overview reskin uses 8 in a 4-up x 2-row grid. The component
 * does not cap count; the validation layer runs at save time.
 *
 * `extraStyle` hatch: the current reskin inlines background + padding
 * onto the logo-strip when it sits on a natural field. Until the pattern
 * library promotes a `.logo-strip--on-natural` modifier, consumers pass
 * the same inline style here for visual-regression parity.
 */
export function LogoStrip({
  ariaLabel = "Customer logos",
  children,
  extraStyle,
}: {
  ariaLabel?: string;
  children: ReactNode;
  extraStyle?: CSSProperties;
}): JSX.Element {
  return (
    <div className="logo-strip" aria-label={ariaLabel} style={extraStyle}>
      {children}
    </div>
  );
}
