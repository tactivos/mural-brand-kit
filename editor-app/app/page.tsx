/**
 * editor-app landing page.
 *
 * Scaffold placeholder only. The real landing page — document-type
 * selector plus editor entry — lands with the Puck integration step.
 *
 * Intentionally not linked from anywhere; use `/preview/:docId` for the
 * print target once preview routes exist.
 */
export default function HomePage() {
  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        padding: "2rem",
        maxWidth: "42rem",
        margin: "0 auto",
      }}
    >
      <h1>Mural PDF Generator — Editor (scaffold)</h1>
      <p>
        This is the Next.js scaffold for the editor-app. The Puck integration
        and document-type selector land in a later migration step. For now:
      </p>
      <ul>
        <li>Schema: see <code>MURAL-DOC-SCHEMA.md</code></li>
        <li>Component manifest: see <code>EDITOR-COMPONENT-INVENTORY.md</code></li>
        <li>
          Single CSS source of truth: <code>editor-app/styles/brand.css</code>{" "}
          (verbatim copy of <code>mural-pdf-generator-pattern-library.html</code>
          &rsquo;s <code>&lt;style&gt;</code> block).
        </li>
      </ul>
    </main>
  );
}
