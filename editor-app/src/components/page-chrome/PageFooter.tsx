import type { PageFooterProps } from "../../schema/mural-doc.js";

/**
 * PageFooter — the bottom signature on every page.
 *
 * Emits (default Mural variant):
 *
 *   <div class="page-footer">
 *     <a class="page-signature" href="https://www.mural.co/" aria-label="Mural website">
 *       <img class="page-signature-wordmark" src="<wordmarkSrc>" alt="Mural logo">
 *       <span class="page-signature-url">mural.co</span>
 *     </a>
 *     <div class="page-number">Page {n}</div>   <-- only when pageNumber is set
 *   </div>
 *
 * Page-number rule (from reskin-rules.mdc): single-page documents MUST NOT
 * include the `.page-number` child. Pass `pageNumber` only on multi-page docs.
 *
 * LUMA lockup variants (`mural-lead-luma`, `luma-lead`) land in a later
 * migration step — for now only the default Mural wordmark is supported.
 *
 * `wordmarkSrc` defaults to the repo-root path served by Next.js's `public/`
 * directory. For the visual-regression test harness, override per-environment
 * if the asset is served from a different URL.
 */
export type PageFooterRenderProps = PageFooterProps & {
  wordmarkSrc?: string;
};

export function PageFooter({
  url = "mural.co",
  lockup = "mural",
  pageNumber,
  wordmarkSrc = "/Mural_Wordmark_Multicolor.svg",
}: PageFooterRenderProps): JSX.Element {
  if (lockup !== "mural") {
    throw new Error(
      `PageFooter: lockup="${lockup}" is not yet implemented. Only "mural" ships in v1.`,
    );
  }

  const siteHref = url === "mural.co" ? "https://www.mural.co/" : "https://www.luma.institute/";
  const ariaLabel = url === "mural.co" ? "Mural website" : "LUMA website";

  return (
    <div className="page-footer">
      <a className="page-signature" href={siteHref} aria-label={ariaLabel}>
        <img className="page-signature-wordmark" src={wordmarkSrc} alt="Mural logo" />
        <span className="page-signature-url">{url}</span>
      </a>
      {typeof pageNumber === "number" ? (
        <div className="page-number">Page {pageNumber}</div>
      ) : null}
    </div>
  );
}
