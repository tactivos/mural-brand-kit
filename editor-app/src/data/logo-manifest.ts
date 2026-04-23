/**
 * Logo manifest — maps `logoKey` (schema) to an actual asset path, alt text,
 * and recommended optical-balance scale.
 *
 * Source of truth for the editor and AI pipeline. When a MuralDoc's LogoBox
 * element refers to `logoKey: "ibm"`, the renderer looks up this table to
 * resolve the `src`, `alt`, and default `assetScale`.
 *
 * Scales are taken from reskins/product-one-sheet/mural-overview.html and
 * follow the optical-balancing protocol in reskin-rules.mdc.
 */
export type LogoManifestEntry = {
  src: string;
  alt: string;
  /** Default per-asset scale for optical balance in a shared logo row. */
  defaultScale: number;
};

export const LOGO_MANIFEST = {
  ibm: { src: "/assets/logos/customers/IBM_B.svg", alt: "IBM", defaultScale: 0.92 },
  steelcase: {
    src: "/assets/logos/customers/Steelcase_B.svg",
    alt: "Steelcase",
    defaultScale: 0.65,
  },
  github: { src: "/assets/logos/customers/Github_B.svg", alt: "GitHub", defaultScale: 0.59 },
  autodesk: {
    src: "/assets/logos/customers/Autodesk_B.svg",
    alt: "Autodesk",
    defaultScale: 0.74,
  },
  thoughtworks: {
    src: "/assets/logos/customers/Thoughtworks_B.svg",
    alt: "Thoughtworks",
    defaultScale: 0.76,
  },
  jacobs: { src: "/assets/logos/customers/Jacobs_B.svg", alt: "Jacobs", defaultScale: 0.68 },
  "booz-allen": {
    src: "/assets/logos/customers/BoozAllenH_B.svg",
    alt: "Booz Allen Hamilton",
    defaultScale: 0.9,
  },
  capco: { src: "/assets/logos/customers/CAPCO_B.svg", alt: "CAPCO", defaultScale: 0.77 },
} as const satisfies Record<string, LogoManifestEntry>;

export type LogoKey = keyof typeof LOGO_MANIFEST;

export function resolveLogo(key: LogoKey): LogoManifestEntry {
  return LOGO_MANIFEST[key];
}
