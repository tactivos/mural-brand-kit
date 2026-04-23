/**
 * BrandBar — the five-color brand strip at the top of every page.
 *
 * Emits the EXACT HTML shape used by the static pattern library and reskins:
 *
 *   <div class="brand-bar" aria-hidden="true">
 *     <span></span><span></span><span></span><span></span><span></span>
 *   </div>
 *
 * Pattern library ref: mural-pdf-generator-pattern-library.html
 * (<style> block defines .brand-bar; this is the corresponding markup).
 *
 * Proportions come from brand.css (flex: 16/33/9.5/15/26 pink/red/green/yellow/blue),
 * NOT from props. No prop customization is allowed — the brand bar is a brand
 * constant, not content.
 */
export function BrandBar(): JSX.Element {
  return (
    <div className="brand-bar" aria-hidden="true">
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>
  );
}
