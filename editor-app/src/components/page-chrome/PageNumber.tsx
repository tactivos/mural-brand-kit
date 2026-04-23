import type { PageNumberProps } from "../../schema/mural-doc.js";

/**
 * PageNumber — standalone page number.
 *
 * In v1 the page number is almost always rendered as a child of PageFooter
 * via `<PageFooter pageNumber={n} />`. This standalone component exists for
 * cases where the page number must appear outside the footer (e.g. custom
 * closing pages). Emits:
 *
 *   <div class="page-number">Page {n}</div>
 *
 * Pattern library ref: mural-pdf-generator-pattern-library.html styles
 * `.page-number` at 8pt, 1.0 leading.
 */
export function PageNumber({ value }: PageNumberProps): JSX.Element {
  return <div className="page-number">Page {value}</div>;
}
