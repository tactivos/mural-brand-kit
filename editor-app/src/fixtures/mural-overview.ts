import type { MuralDoc } from "../schema/mural-doc.js";

/**
 * Canonical MuralDoc fixture for the Product one-sheet v1 prototype.
 *
 * This is the data representation of reskins/product-one-sheet/mural-overview.html.
 * When the /preview/product-one-sheet route renders this fixture through
 * our React components, the output should be pixel-identical to the static
 * reskin (within the visual-regression tolerance).
 *
 * Known content-model trade-off: the static reskin uses forced <br> line
 * breaks inside the blockquote and some bullets for rag control. MuralDoc
 * intentionally does NOT model forced line breaks, so the /preview render
 * will differ from the static reskin in those specific wrap points. Both
 * renderings are still on-brand; the diff is a deliberate content-model
 * decision, not a rendering bug.
 */
export const muralOverviewFixture: MuralDoc = {
  schemaVersion: 1,
  docType: "product-one-sheet",
  meta: {
    title: "Make it a mural, not a meeting.",
    topicLabel: "Product overview",
    tone: "Professional",
    outputLength: "Concise",
    createdAt: "2026-04-23T00:00:00.000Z",
    updatedAt: "2026-04-23T00:00:00.000Z",
  },
  pages: [
    {
      id: "page-1",
      sections: [
        {
          id: "opener",
          type: "Opener",
          strips: [
            {
              id: "opener-strip",
              type: "BodyGroup",
              children: [
                {
                  id: "headline",
                  type: "Headline",
                  props: { text: "Make it a mural, not a meeting.", level: 1 },
                },
                {
                  id: "intro",
                  type: "IntroCopy",
                  props: {
                    paragraphs: [
                      [
                        {
                          type: "text",
                          value:
                            "When ideas are visible, progress accelerates. Mural\u2019s intuitive workspace and AI-powered tools bring teams into alignment instantly\u2009\u2014\u2009helping you move from concept to outcome with speed and clarity. Seeing is how\u2122 Mural gets Sales, Marketing, R&D, and Consulting teams to outcomes faster.",
                        },
                      ],
                    ],
                  },
                },
              ],
            },
          ],
        },
        {
          id: "trust-and-security",
          type: "Content",
          strips: [
            {
              id: "trust-combined",
              type: "CombinedGrid",
              slots: {
                content: [
                  { id: "eyebrow", type: "Eyebrow", props: { text: "Trust and security" } },
                  {
                    id: "sub-1",
                    type: "BodyCopy",
                    props: {
                      content: [
                        {
                          type: "text",
                          value: "You need an enterprise-grade platform you can trust",
                          marks: ["bold"],
                        },
                      ],
                    },
                  },
                  {
                    id: "bullets-1",
                    type: "BulletList",
                    props: {
                      items: [
                        {
                          content: [
                            {
                              type: "text",
                              value:
                                "Security, privacy, reliability, and compliance measures designed for the world\u2019s most security-conscious companies",
                            },
                          ],
                        },
                        {
                          content: [
                            {
                              type: "text",
                              value:
                                "Technical support and implementation solutions for complex organizations",
                            },
                          ],
                        },
                        {
                          content: [
                            {
                              type: "text",
                              value: "Features that give you visibility, security, and control",
                            },
                          ],
                        },
                      ],
                    },
                  },
                  {
                    id: "sub-2",
                    type: "BodyCopy",
                    props: {
                      content: [
                        {
                          type: "text",
                          value: "You need to transform how teams work together",
                          marks: ["bold"],
                        },
                      ],
                    },
                  },
                  {
                    id: "bullets-2",
                    type: "BulletList",
                    props: {
                      items: [
                        {
                          content: [
                            {
                              type: "text",
                              value:
                                "Mural offers training and services that improve how your teams work together \u2014 in offices or around the world",
                            },
                          ],
                        },
                        {
                          content: [
                            {
                              type: "text",
                              value:
                                "LUMA System\u2122 certification programs equip teams with the collaboration skills to tackle everyday work challenges with creativity and confidence",
                            },
                          ],
                        },
                      ],
                    },
                  },
                  {
                    id: "sub-3",
                    type: "BodyCopy",
                    props: {
                      content: [
                        {
                          type: "text",
                          value: "You\u2019re ready to maximize your Microsoft investments",
                          marks: ["bold"],
                        },
                      ],
                    },
                  },
                  {
                    id: "bullets-3",
                    type: "BulletList",
                    props: {
                      items: [
                        {
                          content: [
                            {
                              type: "text",
                              value:
                                "Mural offers the deepest integration with the Microsoft ecosystem of all visual collaboration platforms",
                            },
                          ],
                        },
                        {
                          content: [
                            {
                              type: "text",
                              value:
                                "Power more efficient workflows across Microsoft Teams, PowerPoint, Azure DevOps, and more",
                            },
                          ],
                        },
                      ],
                    },
                  },
                  {
                    id: "sub-4",
                    type: "BodyCopy",
                    props: {
                      content: [
                        {
                          type: "text",
                          value:
                            "You want transparent pricing with no catches and no surprises",
                          marks: ["bold"],
                        },
                      ],
                    },
                  },
                  {
                    id: "bullets-4",
                    type: "BulletList",
                    props: {
                      items: [
                        {
                          content: [
                            {
                              type: "text",
                              value:
                                "Choose between seat-based or engagement-based pricing",
                            },
                          ],
                        },
                        {
                          content: [
                            { type: "text", value: "Never get billed retroactively" },
                          ],
                        },
                      ],
                    },
                  },
                ],
                quote: [
                  {
                    id: "quote-bo",
                    type: "Blockquote",
                    props: {
                      text: "Mural enhances our ability to create a safe space for people to collaborate and contribute, whether they\u2019re introverted or extroverted, in person or remote. Meetings are more engaging and inclusive, and ultimately, diverse perspectives lead to more innovative, impactful solutions.",
                      variant: "default",
                      attribution: {
                        name: "Bo Storozuk",
                        role: "Strategic Learning & Talent Management Consultant",
                        logoKey: "jacobs",
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
        {
          id: "stat-band-section",
          type: "StatBand",
          strips: [
            {
              id: "stat-hero",
              type: "StatBand",
              children: [
                {
                  id: "stat-headline",
                  type: "SectionHeading",
                  props: { text: "95% of the Fortune 100 partner with us" },
                },
                {
                  id: "stat-body",
                  type: "BodyCopy",
                  props: {
                    content: [
                      {
                        type: "text",
                        value:
                          "Mural makes it easy to come up with innovative ideas, connect with colleagues around the globe, build winning strategies, and coordinate complex initiatives.",
                      },
                    ],
                  },
                },
              ],
            },
            {
              id: "customer-logos",
              type: "LogoStrip",
              children: [
                { id: "logo-ibm", type: "LogoBox", props: { logoKey: "ibm", variant: "B" } },
                {
                  id: "logo-steelcase",
                  type: "LogoBox",
                  props: { logoKey: "steelcase", variant: "B" },
                },
                {
                  id: "logo-github",
                  type: "LogoBox",
                  props: { logoKey: "github", variant: "B" },
                },
                {
                  id: "logo-autodesk",
                  type: "LogoBox",
                  props: { logoKey: "autodesk", variant: "B" },
                },
                {
                  id: "logo-thoughtworks",
                  type: "LogoBox",
                  props: { logoKey: "thoughtworks", variant: "B" },
                },
                {
                  id: "logo-jacobs",
                  type: "LogoBox",
                  props: { logoKey: "jacobs", variant: "B" },
                },
                {
                  id: "logo-booz-allen",
                  type: "LogoBox",
                  props: { logoKey: "booz-allen", variant: "B" },
                },
                {
                  id: "logo-capco",
                  type: "LogoBox",
                  props: { logoKey: "capco", variant: "B" },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
