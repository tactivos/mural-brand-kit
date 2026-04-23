import {
  BodyCopy,
  Blockquote,
  BrandBar,
  BulletList,
  CombinedGrid,
  ContentSection,
  Deck,
  Document,
  Eyebrow,
  Headline,
  IntroCopy,
  LogoBox,
  LogoStrip,
  OpenerSection,
  Page,
  PageFooter,
  PageInner,
  PageMeta,
  SectionHeading,
  StatBand,
  StatBandRule,
  SubHeading,
} from "../../../src/components/index.js";
import { muralOverviewFixture } from "../../../src/fixtures/mural-overview.js";
import { LOGO_MANIFEST, type LogoKey } from "../../../src/data/logo-manifest.js";
import type { Element as MuralElement, Section, Strip } from "../../../src/schema/mural-doc.js";

/**
 * /preview/product-one-sheet — the print target for the Mural Overview fixture.
 *
 * Renders the canonical MuralDoc fixture through our React components. Output
 * should be pixel-identical to reskins/product-one-sheet/mural-overview.html
 * (within the visual-regression tolerance), modulo the documented content-
 * model trade-offs (no forced line breaks inside quote text, etc.).
 *
 * This route has zero editor chrome — it's the page the user prints from via
 * `File > Print > Save as PDF`.
 *
 * In v1 the renderer is focused rather than generic: it handles exactly the
 * element/strip/section types that appear in the Product one-sheet. A fully
 * generic MuralDoc → JSX renderer lands with the Puck integration, where
 * Puck's <Render> takes over this role.
 */
export default function ProductOneSheetPreview() {
  const doc = muralOverviewFixture;
  const firstPage = doc.pages[0];
  if (!firstPage) {
    return <div>Empty document.</div>;
  }

  return (
    <Document>
      <Page>
        <BrandBar />
        <PageInner>
          <PageMeta leftLabel={doc.meta.topicLabel} />
          {firstPage.sections.map((section) => (
            <SectionRenderer key={section.id} section={section} />
          ))}
        </PageInner>
        <PageFooter url="mural.co" lockup="mural" />
      </Page>
    </Document>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Focused renderers — handle exactly the shapes used by the Product one-sheet
// ─────────────────────────────────────────────────────────────────────────────

function SectionRenderer({ section }: { section: Section }): JSX.Element {
  switch (section.type) {
    case "Opener":
      return (
        <OpenerSection>
          {section.strips.map((strip) => (
            <StripRenderer key={strip.id} strip={strip} />
          ))}
        </OpenerSection>
      );
    case "Content":
      return (
        <ContentSection>
          {section.strips.map((strip) => (
            <StripRenderer key={strip.id} strip={strip} />
          ))}
        </ContentSection>
      );
    case "StatBand":
      return (
        <ContentSection
          suppressTopRule
          extraStyle={{ marginTop: "0.16in", paddingTop: 0 }}
        >
          {section.strips.map((strip) => (
            <StripRenderer key={strip.id} strip={strip} />
          ))}
        </ContentSection>
      );
    case "Closing":
      return (
        <ContentSection>
          {section.strips.map((strip) => (
            <StripRenderer key={strip.id} strip={strip} />
          ))}
        </ContentSection>
      );
    default:
      throw new Error(`SectionRenderer: unhandled section type "${String(section.type)}"`);
  }
}

function StripRenderer({ strip }: { strip: Strip }): JSX.Element {
  switch (strip.type) {
    case "BodyGroup":
      return renderBodyGroup(strip);
    case "CombinedGrid":
      return renderCombinedGrid(strip);
    case "StatBand":
      return renderStatBand(strip);
    case "LogoStrip":
      return renderLogoStrip(strip);
    default:
      throw new Error(`StripRenderer: unhandled strip type "${String(strip.type)}"`);
  }
}

function renderBodyGroup(strip: Strip): JSX.Element {
  return (
    <>
      {(strip.children ?? []).map((el, i) => (
        <ElementRenderer key={el.id} element={el} index={i} />
      ))}
    </>
  );
}

function renderCombinedGrid(strip: Strip): JSX.Element {
  const content = strip.slots?.["content"] ?? [];
  const quote = strip.slots?.["quote"] ?? [];
  return (
    <CombinedGrid
      content={content.map((el, i) => (
        <ElementRenderer key={el.id} element={el} index={i} />
      ))}
      quote={quote.map((el) => (
        <ElementRenderer key={el.id} element={el} />
      ))}
    />
  );
}

function renderStatBand(strip: Strip): JSX.Element {
  const children = strip.children ?? [];
  // Convention for v1: the first element is the stat headline (SectionHeading);
  // subsequent elements are body copy in the right column.
  const [heading, ...body] = children;
  return (
    <StatBand
      intro={heading ? <ElementRenderer element={heading} /> : null}
      body={body.map((el) => (
        <ElementRenderer key={el.id} element={el} />
      ))}
    />
  );
}

function renderLogoStrip(strip: Strip): JSX.Element {
  return (
    <>
      <StatBandRule />
      <LogoStrip
        ariaLabel="Enterprise customer logos"
        extraStyle={{
          marginTop: 0,
          padding: "0.16in 0.18in 0.24in",
          background: "var(--natural)",
        }}
      >
        {(strip.children ?? []).map((el) => (
          <ElementRenderer key={el.id} element={el} />
        ))}
      </LogoStrip>
    </>
  );
}

function ElementRenderer({
  element,
  index = 0,
}: {
  element: MuralElement;
  index?: number;
}): JSX.Element {
  switch (element.type) {
    case "Headline": {
      const props = element.props as { text: string; level?: 1 | 2 };
      return <Headline {...props} />;
    }
    case "SubHeading": {
      const props = element.props as { text: string };
      return <SubHeading {...props} />;
    }
    case "SectionHeading": {
      const props = element.props as { text: string };
      return <SectionHeading {...props} />;
    }
    case "Eyebrow": {
      const props = element.props as { text: string };
      return <Eyebrow {...props} />;
    }
    case "Deck": {
      const props = element.props as { text: string };
      return <Deck {...props} />;
    }
    case "IntroCopy": {
      const props = element.props as Parameters<typeof IntroCopy>[0];
      return <IntroCopy {...props} />;
    }
    case "BodyCopy": {
      const props = element.props as Parameters<typeof BodyCopy>[0];
      // Convention: every non-first BodyCopy in a column gets the standard
      // "subhead gap" spacing (0.14in), matching the static reskin. This is
      // the one inline-style escape hatch that produces golden parity.
      const topSpacing = index > 0 ? "0.14in" : props.topSpacing;
      return <BodyCopy {...props} topSpacing={topSpacing} />;
    }
    case "BulletList": {
      const props = element.props as Parameters<typeof BulletList>[0];
      return <BulletList {...props} />;
    }
    case "Blockquote": {
      const props = element.props as Parameters<typeof Blockquote>[0];
      const logoSrc =
        props.attribution?.logoKey &&
        (LOGO_MANIFEST as Record<string, { src: string } | undefined>)[
          props.attribution.logoKey
        ]?.src;
      return <Blockquote {...props} logoSrc={logoSrc ?? undefined} />;
    }
    case "LogoBox": {
      const props = element.props as {
        logoKey: LogoKey;
        variant: "auto" | "B" | "W";
        assetScale?: number;
      };
      const entry = LOGO_MANIFEST[props.logoKey];
      return (
        <LogoBox
          src={entry.src}
          alt={entry.alt}
          assetScale={props.assetScale ?? entry.defaultScale}
        />
      );
    }
    default:
      throw new Error(`ElementRenderer: unhandled element type "${String(element.type)}"`);
  }
}
