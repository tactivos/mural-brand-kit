import type { ReactNode } from "react";
import "../../styles/brand.css";

/**
 * Preview layout — imports brand.css so every /preview/:docType route
 * renders with the full reskin-quality stylesheet.
 *
 * This is the ONLY place brand.css is loaded in the app tree, so changes
 * to brand.css affect print renders and nothing else. The landing page,
 * editor UI, and any future admin surfaces render without it.
 */
export default function PreviewLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
