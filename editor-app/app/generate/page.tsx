"use client";

/**
 * /generate (A15) — landing page for AI-generated MuralDocs.
 *
 * Flow:
 *   1. User fills in topic + optional audience/tone/length.
 *   2. POST /api/generate with the form values.
 *   3. On 200, save the returned MuralDoc to localStorage under the
 *      same key /edit reads from, then push to /edit.
 *   4. /edit's existing useEffect picks up the stored doc and swaps
 *      the fixture out — no special hand-off needed.
 *
 * v1 scope:
 *   - product-one-sheet only (matches the rest of the app).
 *   - No streaming, no progress UI beyond a spinner-style label.
 *   - Errors render inline; the user can retry without reloading.
 *   - Styling is intentionally plain (system fonts, no brand chrome) —
 *     this is editor-side UI, not a print surface.
 */
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { saveDoc } from "../../src/persistence/local-storage.js";
import type { MuralDoc } from "../../src/schema/mural-doc.js";

type Tone = NonNullable<MuralDoc["meta"]["tone"]>;
type OutputLength = NonNullable<MuralDoc["meta"]["outputLength"]>;

const TONES: Tone[] = ["Professional", "Conversational", "Technical", "Bold"];
const LENGTHS: OutputLength[] = ["Concise", "Standard", "Detailed"];

export default function GeneratePage() {
  const router = useRouter();

  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState<Tone>("Professional");
  const [outputLength, setOutputLength] = useState<OutputLength>("Concise");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setError(null);

    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      setError("Topic is required.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType: "product-one-sheet",
          topic: trimmedTopic,
          audience: audience.trim() || undefined,
          tone,
          outputLength,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        doc?: MuralDoc;
        error?: string;
      };

      if (!response.ok) {
        setError(
          payload.error ??
            `Generate failed (HTTP ${response.status}). Check the server logs.`,
        );
        return;
      }

      if (!payload.doc) {
        setError("Server response missing `doc` field. Check the server logs.");
        return;
      }

      const saved = saveDoc(payload.doc);
      if (!saved) {
        setError(
          "Generation succeeded but saving to localStorage failed. " +
            "Storage may be disabled (private browsing, third-party cookies blocked).",
        );
        return;
      }

      // Hand off to /edit, which loads the saved doc on mount.
      router.push("/edit");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Network error: ${message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        padding: "2rem",
        maxWidth: "42rem",
        margin: "0 auto",
        color: "#111",
      }}
    >
      <h1 style={{ marginTop: 0 }}>Generate a Mural one-sheet</h1>
      <p style={{ color: "#555" }}>
        Describe the topic and audience. The model will draft a complete
        product one-sheet, then drop you in the editor to refine it.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.25rem" }}>
        <Field label="Topic" required>
          <textarea
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            rows={3}
            placeholder="e.g. Mural's enterprise security and compliance posture"
            disabled={submitting}
            required
            style={inputStyle}
          />
        </Field>

        <Field label="Audience">
          <input
            type="text"
            value={audience}
            onChange={(event) => setAudience(event.target.value)}
            placeholder="e.g. Enterprise IT buyers"
            disabled={submitting}
            style={inputStyle}
          />
        </Field>

        <div style={{ display: "grid", gap: "1.25rem", gridTemplateColumns: "1fr 1fr" }}>
          <Field label="Tone">
            <select
              value={tone}
              onChange={(event) => setTone(event.target.value as Tone)}
              disabled={submitting}
              style={inputStyle}
            >
              {TONES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Length">
            <select
              value={outputLength}
              onChange={(event) =>
                setOutputLength(event.target.value as OutputLength)
              }
              disabled={submitting}
              style={inputStyle}
            >
              {LENGTHS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              fontSize: "0.95rem",
              whiteSpace: "pre-wrap",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              ...buttonStyle,
              opacity: submitting ? 0.6 : 1,
              cursor: submitting ? "wait" : "pointer",
            }}
          >
            {submitting ? "Generating…" : "Generate"}
          </button>
          <a
            href="/edit"
            style={{ color: "#3776E4", textDecoration: "underline" }}
          >
            Skip and edit fixture
          </a>
        </div>
      </form>
    </main>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "grid", gap: "0.4rem" }}>
      <span style={{ fontWeight: 500, fontSize: "0.95rem" }}>
        {label}
        {required ? <span style={{ color: "#b91c1c" }}> *</span> : null}
      </span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  font: "inherit",
  padding: "0.6rem 0.75rem",
  borderRadius: "0.4rem",
  border: "1px solid #cbd5e1",
  width: "100%",
  boxSizing: "border-box",
  background: "#fff",
};

const buttonStyle: React.CSSProperties = {
  font: "inherit",
  fontWeight: 500,
  padding: "0.65rem 1.25rem",
  borderRadius: "0.4rem",
  border: "1px solid #00c27a",
  background: "#00c27a",
  color: "#000",
};
