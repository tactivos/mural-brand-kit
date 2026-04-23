import type { CSSProperties, ReactNode } from "react";

/**
 * ContentSection — the workhorse section type.
 *
 * Emits: <section class="section" [style=...]>{children}</section>
 *
 * Props:
 *   - suppressTopRule: removes the section's top rule (border-top: none)
 *     when the preceding element already provides separation (e.g. a
 *     colored stat-band background).
 *   - extraStyle: inline style hatch for reskin parity (legacy cases where
 *     the reskin uses inline margins/padding). New content should avoid
 *     this; it exists to match current golden files byte-for-byte and will
 *     be replaced by dedicated CSS classes when the pattern library's
 *     "standalone stat-band" case is promoted to a real pattern.
 */
export function ContentSection({
  children,
  suppressTopRule = false,
  extraStyle,
}: {
  children: ReactNode;
  suppressTopRule?: boolean;
  extraStyle?: CSSProperties;
}): JSX.Element {
  const style: CSSProperties | undefined = suppressTopRule || extraStyle
    ? { ...(suppressTopRule ? { borderTop: "none" } : {}), ...extraStyle }
    : undefined;

  return (
    <section className="section" style={style}>
      {children}
    </section>
  );
}
