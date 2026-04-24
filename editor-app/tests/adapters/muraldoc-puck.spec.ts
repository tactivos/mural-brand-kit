import { test, expect } from "@playwright/test";
import {
  muralDocToPuck,
  puckToMuralDoc,
  inlineNodesToPlain,
  AdapterError,
} from "../../src/adapters/muraldoc-puck.js";
import { muralOverviewFixture } from "../../src/fixtures/mural-overview.js";
import type { MuralDoc, Strip } from "../../src/schema/mural-doc.js";

/**
 * Adapter unit tests — pure-node; do not use `page`. Playwright is the
 * runner because it's already installed, handles TypeScript natively,
 * and reports into the same CLI output as the visual tests.
 *
 * The round-trip test pins the adapter's most important invariant:
 * after the first pass through Puck, the shape is stable. See the
 * "Scope v1" notes in src/adapters/muraldoc-puck.ts for which MuralDoc
 * features survive that first pass (most) and which collapse (inline
 * marks, multi-paragraph BodyCopy/IntroCopy, section boundaries).
 */

test.describe("muraldoc-puck adapter", () => {
  test("muralDocToPuck: product-one-sheet fixture produces flat Puck content", () => {
    const data = muralDocToPuck(muralOverviewFixture);

    expect(data.root.props?.pageMetaLabel).toBe("Product overview");

    // Expected top-level sequence for the fixture:
    //   Opener.BodyGroup -> hoisted to [Headline, IntroCopy]
    //   Content.CombinedGrid
    //   StatBand.StatBand
    //   StatBand.LogoStrip
    const types = data.content.map((c) => c.type);
    expect(types).toEqual([
      "Headline",
      "IntroCopy",
      "CombinedGrid",
      "StatBand",
      "LogoStrip",
    ]);

    // Element IDs survive the hoist.
    expect(data.content[0]?.props.id).toBe("headline");
    expect(data.content[1]?.props.id).toBe("intro");
    expect(data.content[2]?.props.id).toBe("trust-combined");
    expect(data.content[3]?.props.id).toBe("stat-hero");
    expect(data.content[4]?.props.id).toBe("customer-logos");
  });

  test("CombinedGrid slots translate via name map (content -> contentSlot, quote -> quoteSlot)", () => {
    const data = muralDocToPuck(muralOverviewFixture);
    const combined = data.content.find((c) => c.type === "CombinedGrid");
    expect(combined).toBeDefined();

    const props = combined!.props as unknown as {
      contentSlot: Array<{ type: string; props: { id: string } }>;
      quoteSlot: Array<{ type: string; props: { id: string } }>;
    };

    // Content slot starts with the Eyebrow, follows with alternating
    // BodyCopy subheads and BulletLists — 9 entries total.
    expect(props.contentSlot).toHaveLength(9);
    expect(props.contentSlot[0]?.type).toBe("Eyebrow");
    expect(props.contentSlot[0]?.props.id).toBe("eyebrow");

    // Quote slot holds exactly one Blockquote.
    expect(props.quoteSlot).toHaveLength(1);
    expect(props.quoteSlot[0]?.type).toBe("Blockquote");
    expect(props.quoteSlot[0]?.props.id).toBe("quote-bo");
  });

  test("Blockquote attribution flattens to top-level fields", () => {
    const data = muralDocToPuck(muralOverviewFixture);
    const combined = data.content.find((c) => c.type === "CombinedGrid");
    const quote = (
      combined!.props as unknown as {
        quoteSlot: Array<{ props: Record<string, unknown> }>;
      }
    ).quoteSlot[0];
    expect(quote?.props.attributionName).toBe("Bo Storozuk");
    expect(quote?.props.attributionRole).toBe(
      "Strategic Learning & Talent Management Consultant",
    );
    expect(quote?.props.logoKey).toBe("jacobs");
  });

  test("LogoStrip preserves 8 logo children in order", () => {
    const data = muralDocToPuck(muralOverviewFixture);
    const logoStrip = data.content.find((c) => c.type === "LogoStrip");
    const { logosSlot } = logoStrip!.props as unknown as {
      logosSlot: Array<{ type: string; props: { id: string; logoKey: string } }>;
    };
    expect(logosSlot).toHaveLength(8);
    expect(logosSlot.map((l) => l.props.logoKey)).toEqual([
      "ibm",
      "steelcase",
      "github",
      "autodesk",
      "thoughtworks",
      "jacobs",
      "booz-allen",
      "capco",
    ]);
  });

  test("inline marks collapse to plain text on the way to Puck", () => {
    const data = muralDocToPuck(muralOverviewFixture);
    const combined = data.content.find((c) => c.type === "CombinedGrid");
    const contentSlot = (
      combined!.props as unknown as {
        contentSlot: Array<{ type: string; props: Record<string, unknown> }>;
      }
    ).contentSlot;

    // The first BodyCopy in the content slot is the "You need an
    // enterprise-grade platform..." subhead, originally marked bold.
    // In Puck v1 it's plain text — marks are gone.
    const firstBody = contentSlot.find(
      (c) => c.type === "BodyCopy" && c.props.id === "sub-1",
    );
    expect(firstBody?.props.text).toBe(
      "You need an enterprise-grade platform you can trust",
    );
  });

  test("round-trip is stable: puckToMuralDoc -> muralDocToPuck yields identical Puck Data", () => {
    const fixedNow = new Date("2026-04-24T00:00:00.000Z");

    const dataA = muralDocToPuck(muralOverviewFixture);
    const docB = puckToMuralDoc(dataA, muralOverviewFixture, fixedNow);
    const dataC = muralDocToPuck(docB);

    // The pair (A, C) must be structurally identical. JSON round-trip
    // is the easiest deep-equal that's tolerant of key-order.
    expect(JSON.parse(JSON.stringify(dataC))).toEqual(
      JSON.parse(JSON.stringify(dataA)),
    );
  });

  test("puckToMuralDoc groups consecutive bare elements into a single BodyGroup", () => {
    const fixedNow = new Date("2026-04-24T00:00:00.000Z");
    const data = muralDocToPuck(muralOverviewFixture);
    const doc = puckToMuralDoc(data, muralOverviewFixture, fixedNow);

    // The v1 adapter collapses all sections into exactly one
    // Content section. This is a documented loss.
    expect(doc.pages).toHaveLength(1);
    expect(doc.pages[0]?.sections).toHaveLength(1);
    const section = doc.pages[0]!.sections[0]!;
    expect(section.type).toBe("Content");

    // Strips: [BodyGroup(Headline, IntroCopy), CombinedGrid, StatBand, LogoStrip]
    const stripTypes = section.strips.map((s: Strip) => s.type);
    expect(stripTypes).toEqual([
      "BodyGroup",
      "CombinedGrid",
      "StatBand",
      "LogoStrip",
    ]);

    const bodyGroup = section.strips[0]!;
    expect(bodyGroup.children?.map((c) => c.type)).toEqual([
      "Headline",
      "IntroCopy",
    ]);
  });

  test("puckToMuralDoc preserves baseDoc meta.title and docType but refreshes updatedAt", () => {
    const fixedNow = new Date("2026-04-24T12:34:56.000Z");
    const data = muralDocToPuck(muralOverviewFixture);
    const doc = puckToMuralDoc(data, muralOverviewFixture, fixedNow);

    expect(doc.docType).toBe("product-one-sheet");
    expect(doc.meta.title).toBe("Make it a mural, not a meeting.");
    expect(doc.meta.tone).toBe("Professional");
    expect(doc.meta.createdAt).toBe("2026-04-23T00:00:00.000Z");
    expect(doc.meta.updatedAt).toBe("2026-04-24T12:34:56.000Z");
  });

  test("puckToMuralDoc preserves an explicit empty pageMetaLabel (user choice)", () => {
    // An empty string is a valid user input ("I want no topic label").
    // The adapter should NOT silently rehydrate it from baseDoc — that
    // would overwrite the user's intent. `undefined` / missing falls
    // back; `""` is preserved.
    const fixedNow = new Date("2026-04-24T00:00:00.000Z");
    const data = muralDocToPuck(muralOverviewFixture);
    data.root.props = { pageMetaLabel: "" } as { pageMetaLabel: string };
    const doc = puckToMuralDoc(data, muralOverviewFixture, fixedNow);
    expect(doc.meta.topicLabel).toBe("");
  });

  test("puckToMuralDoc falls back to baseDoc.topicLabel when root.props is missing entirely", () => {
    const fixedNow = new Date("2026-04-24T00:00:00.000Z");
    const data = muralDocToPuck(muralOverviewFixture);
    // Simulate a malformed or pre-migration Puck blob missing root.props
    (data as { root: { props?: unknown } }).root.props = undefined;
    const doc = puckToMuralDoc(data, muralOverviewFixture, fixedNow);
    expect(doc.meta.topicLabel).toBe("Product overview");
  });

  test("multi-page docs throw an AdapterError", () => {
    const multi: MuralDoc = {
      ...muralOverviewFixture,
      pages: [
        muralOverviewFixture.pages[0]!,
        { ...muralOverviewFixture.pages[0]!, id: "page-2" },
      ],
    };
    expect(() => muralDocToPuck(multi)).toThrow(AdapterError);
  });

  test("unknown logoKey throws with a helpful message", () => {
    const bad: MuralDoc = JSON.parse(JSON.stringify(muralOverviewFixture));
    const statBandSection = bad.pages[0]!.sections.find(
      (s) => s.id === "stat-band-section",
    )!;
    const logoStrip = statBandSection.strips.find(
      (s) => s.id === "customer-logos",
    )!;
    (logoStrip.children![0]!.props as { logoKey: string }).logoKey =
      "not-a-real-company";
    expect(() => muralDocToPuck(bad)).toThrow(/Unknown logoKey/);
  });

  test("inlineNodesToPlain flattens links to their labels", () => {
    expect(
      inlineNodesToPlain([
        { type: "text", value: "Visit " },
        { type: "link", href: "https://mural.co", label: "mural.co" },
      ]),
    ).toBe("Visit mural.co");
  });
});
