/**
 * POST /api/generate (A15)
 * ────────────────────────
 *
 * Server-side endpoint that turns a short user prompt into a MuralDoc
 * by calling Azure OpenAI. The route is the only place in the app
 * that holds the Azure credentials — the browser never sees the key.
 *
 * Request shape:
 *   {
 *     topic: string;            // required
 *     audience?: string;
 *     tone?: "Professional" | "Conversational" | "Technical" | "Bold";
 *     outputLength?: "Concise" | "Standard" | "Detailed";
 *   }
 *
 * Response shape:
 *   200: { doc: MuralDoc }
 *   400: { error: string }   // invalid input
 *   500: { error: string }   // server misconfigured
 *   502: { error: string }   // Azure call failed or response was unparseable
 *
 * v1 design notes (matching A15 plan)
 * -----------------------------------
 * - Only `product-one-sheet` is supported. Other doc types return 400.
 * - We use `chat.completions.create({ response_format: { type:
 *   "json_object" } })`. This forces valid-JSON output without
 *   committing to a strict JSON Schema mirror of MuralDoc, which
 *   would be ~300 LOC of fragile type-mirror code. The system prompt
 *   carries the schema as natural language plus the canonical fixture
 *   as a one-shot example; we then validate hard server-side.
 * - Validation pipeline: parse JSON -> isValidMuralDoc envelope check
 *   -> muralDocToPuck round-trip. If the adapter runs cleanly, the
 *   doc is editor-loadable. If anything throws, we retry once with a
 *   "your previous output failed validation" message, then 502 if it
 *   still fails. This keeps the worst-case latency at ~2 calls.
 * - We stamp `createdAt` / `updatedAt` server-side; the model is told
 *   not to invent timestamps.
 *
 * Why chat.completions, not responses.create?
 *   The Azure deployment supports both. We use chat.completions for
 *   v1 because the SDK shape is well-tested there and migrating later
 *   is a one-call swap. If GPT-5.4 misbehaves on this path we'll move
 *   to responses.create() in a follow-up. The system prompt and
 *   validation logic are identical either way.
 */
import { NextResponse } from "next/server";
import { AzureOpenAI } from "openai";
import {
  buildSystemPrompt,
  buildUserPrompt,
  stampTimestamps,
  type GenerateInput,
} from "../../../src/ai/system-prompt.js";
import { muralDocToPuck } from "../../../src/adapters/muraldoc-puck.js";
import { isValidMuralDoc } from "../../../src/persistence/local-storage.js";
import type { DocType, MuralDoc } from "../../../src/schema/mural-doc.js";

export const runtime = "nodejs";
// `node-html-parser` (used by the adapter) doesn't support edge runtime
// today, so we pin nodejs explicitly.

const SUPPORTED_DOC_TYPES: DocType[] = ["product-one-sheet"];

type RequestBody = GenerateInput & { docType?: DocType };

export async function POST(request: Request) {
  // ── 1. Parse + validate input ────────────────────────────────────────────
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return jsonError(400, "Request body must be valid JSON.");
  }

  const docType = body.docType ?? "product-one-sheet";
  if (!SUPPORTED_DOC_TYPES.includes(docType)) {
    return jsonError(
      400,
      `docType "${docType}" is not supported in v1. Supported: ${SUPPORTED_DOC_TYPES.join(", ")}.`,
    );
  }

  const topic = (body.topic ?? "").trim();
  if (!topic) {
    return jsonError(400, "Field `topic` is required and cannot be empty.");
  }
  if (topic.length > 500) {
    return jsonError(400, "Field `topic` is too long (max 500 chars).");
  }

  // ── 2. Validate server-side configuration ────────────────────────────────
  const config = readAzureConfig();
  if ("error" in config) {
    return jsonError(500, config.error);
  }

  // ── 3. Build prompts and call Azure (with one retry on validation fail) ─
  const systemPrompt = buildSystemPrompt(docType);
  const userPrompt = buildUserPrompt({
    topic,
    audience: body.audience,
    tone: body.tone,
    outputLength: body.outputLength,
  });

  const client = new AzureOpenAI({
    endpoint: config.endpoint,
    apiKey: config.apiKey,
    apiVersion: config.apiVersion,
    deployment: config.deployment,
  });

  let lastError: string | undefined;
  let lastRawJson: string | undefined;

  for (let attempt = 0; attempt < 2; attempt++) {
    const messages = buildMessages({
      systemPrompt,
      userPrompt,
      // On retry, tell the model what went wrong with its previous output.
      retryReason: attempt === 0 ? undefined : lastError,
      retryRaw: attempt === 0 ? undefined : lastRawJson,
    });

    let raw: string;
    try {
      const response = await client.chat.completions.create({
        // For Azure, `model` is the deployment name.
        model: config.deployment,
        messages,
        response_format: { type: "json_object" },
      });
      raw = response.choices[0]?.message?.content ?? "";
      lastRawJson = raw;
    } catch (err) {
      // Azure call itself failed (auth, rate limit, network). No point
      // retrying inside the same request — surface the error.
      const message = err instanceof Error ? err.message : String(err);
      return jsonError(502, `Azure OpenAI call failed: ${message}`);
    }

    if (!raw) {
      lastError = "Model returned an empty response.";
      continue;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      lastError = "Model output was not valid JSON.";
      continue;
    }

    // Envelope check first (cheap, catches typos in the schema fields).
    if (!isValidMuralDoc(parsed, docType)) {
      lastError =
        "Output failed envelope check: schemaVersion must be 1, docType must match request, meta must be an object, pages must be an array.";
      continue;
    }

    // Adapter round-trip is the deep check: if the adapter accepts it,
    // the editor can load it. Anything malformed (unknown strip types,
    // missing slot keys, malformed inline trees) throws here.
    let stamped: MuralDoc;
    try {
      stamped = stampTimestamps(parsed);
      muralDocToPuck(stamped);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      lastError = `Output failed adapter round-trip: ${message}`;
      continue;
    }

    return NextResponse.json({ doc: stamped });
  }

  return jsonError(
    502,
    `Model returned an invalid MuralDoc twice in a row. Last error: ${lastError ?? "unknown"}`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

type AzureConfig = {
  endpoint: string;
  apiKey: string;
  apiVersion: string;
  deployment: string;
};

/**
 * Read Azure env vars. Returns an error message instead of throwing
 * so the route can surface a 500 with a clear cause.
 */
function readAzureConfig(): AzureConfig | { error: string } {
  const endpoint = process.env["AZURE_OPENAI_ENDPOINT"];
  const apiKey = process.env["AZURE_OPENAI_API_KEY"];
  const apiVersion = process.env["AZURE_OPENAI_API_VERSION"];
  const deployment = process.env["AZURE_OPENAI_DEPLOYMENT"];

  const missing: string[] = [];
  if (!endpoint) missing.push("AZURE_OPENAI_ENDPOINT");
  if (!apiKey) missing.push("AZURE_OPENAI_API_KEY");
  if (!apiVersion) missing.push("AZURE_OPENAI_API_VERSION");
  if (!deployment) missing.push("AZURE_OPENAI_DEPLOYMENT");

  if (missing.length > 0) {
    return {
      error: `Server misconfigured: missing env var(s) ${missing.join(", ")}. See editor-app/.env.local.example.`,
    };
  }

  return {
    endpoint: endpoint!,
    apiKey: apiKey!,
    apiVersion: apiVersion!,
    deployment: deployment!,
  };
}

type BuildMessagesArgs = {
  systemPrompt: string;
  userPrompt: string;
  retryReason?: string;
  retryRaw?: string;
};

function buildMessages({
  systemPrompt,
  userPrompt,
  retryReason,
  retryRaw,
}: BuildMessagesArgs) {
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  if (retryReason) {
    if (retryRaw) {
      messages.push({ role: "assistant", content: retryRaw });
    }
    messages.push({
      role: "user",
      content: [
        "Your previous response failed validation:",
        retryReason,
        "",
        "Re-emit the document as a single valid JSON object that matches the MuralDoc schema. Output JSON only.",
      ].join("\n"),
    });
  }

  return messages;
}

function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}
