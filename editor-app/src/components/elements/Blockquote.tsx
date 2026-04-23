import type { BlockquoteProps } from "../../schema/mural-doc.js";

/**
 * Blockquote — an editorial pull quote with attribution and optional logo.
 *
 * Emits (default variant):
 *   <blockquote><span class="quote-open">"</span>{text}"</blockquote>
 *   <p class="quote-attribution"><strong>{name}</strong><br>{role}</p>
 *   <img class="quote-company-logo" src="..." alt="{name} logo">
 *
 * Variants:
 *   - "default" — 13.3pt, used inside combined-grids and sidebars
 *   - "large"   — 18pt, dominant element on the page
 *   - "display" — 31pt, maximum visual impact; hanging offset -0.14in
 *
 * Only the "default" variant ships in v1 — larger variants require
 * additional class names (.quote-large, .quote-display) that are not
 * yet wired up at the component layer.
 *
 * `logoSrc` is resolved from `attribution.logoKey` by the page renderer
 * (a logo manifest is introduced in a later migration step). For now
 * the consumer passes the full src string directly.
 */
export function Blockquote({
  text,
  variant,
  attribution,
  logoSrc,
}: BlockquoteProps & { logoSrc?: string }): JSX.Element {
  if (variant !== "default") {
    throw new Error(
      `Blockquote: variant="${variant}" not implemented in v1. Only "default" ships.`,
    );
  }

  return (
    <>
      <blockquote>
        <span className="quote-open">&ldquo;</span>
        {text}
        &rdquo;
      </blockquote>
      {attribution ? (
        <>
          <p className="quote-attribution">
            <strong>{attribution.name}</strong>
            {attribution.role ? (
              <>
                <br />
                {attribution.role}
              </>
            ) : null}
          </p>
          {logoSrc ? (
            <img
              className="quote-company-logo"
              src={logoSrc}
              alt={`${attribution.name} company logo`}
            />
          ) : null}
        </>
      ) : null}
    </>
  );
}
