import type { ReactNode } from "react";
import "@puckeditor/core/puck.css";
import "../../styles/brand.css";
import "../../styles/edit-shell.css";

/**
 * /edit/* layout — loads both Puck's editor chrome styles and our brand.css.
 *
 * Design note: brand.css defines some global rules (body background,
 * font-family, h1/h3 typography) that can bleed into Puck's editor chrome.
 * Puck's own stylesheet is comprehensive and resets most of its UI
 * elements, so in practice the bleed is limited to places where Puck
 * renders plain <h1>/<h3>/<body>. If a future iteration needs strict
 * isolation, switch Puck to iframe mode and use Puck's waitForStyles
 * mechanism to clone brand.css into the iframe on its own.
 */
export default function EditLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
