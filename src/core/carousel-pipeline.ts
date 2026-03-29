import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import type { AirdropCampaign } from "../api/data.js";
import { getReferralLink, buildReferralUrl } from "./referral-manager.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGE_SIZE = 1080;
const DATA_DIR = path.join(__dirname, "../../data/images/carousel");

const FONT_URL =
  "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.0.1/files/noto-sans-jp-japanese-400-normal.woff";

const CATEGORY_COLORS: Readonly<Record<string, string>> = {
  protocol_intro: "#6366F1",
  airdrop_alert: "#F59E0B",
  defi_guide: "#10B981",
  market_update: "#3B82F6",
  card_comparison: "#8B5CF6",
  referral_promo: "#EC4899",
  engagement: "#06B6D4",
  "Perp DEX": "#F59E0B",
  NFT: "#8B5CF6",
  "Prediction Market": "#3B82F6",
  L2: "#10B981",
  Bridge: "#06B6D4",
  Wallet: "#6366F1",
  DEX: "#EC4899",
  Restaking: "#F59E0B",
};

interface SlideContent {
  readonly title: string;
  readonly body: string;
}

let fontPromise: Promise<ArrayBuffer> | null = null;

function fetchFont(): Promise<ArrayBuffer> {
  if (!fontPromise) {
    fontPromise = fetch(FONT_URL).then((response) => {
      if (!response.ok) {
        fontPromise = null; // Allow retry on failure
        throw new Error(
          `Failed to fetch font: ${response.status} ${response.statusText}`
        );
      }
      return response.arrayBuffer();
    });
  }
  return fontPromise;
}

function hexToRgba(hex: string, alpha: number): string {
  const result = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return `rgba(99, 102, 241, ${alpha})`;
  }
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildTitleSlide(
  title: string,
  categoryLabel: string,
  color: string
): Record<string, unknown> {
  return {
    type: "div",
    props: {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, ${hexToRgba(color, 0.08)} 0%, white 50%, ${hexToRgba(color, 0.15)} 100%)`,
        padding: "60px",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: "100%",
              backgroundColor: "white",
              borderRadius: "32px",
              padding: "64px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
              border: `3px solid ${hexToRgba(color, 0.2)}`,
              justifyContent: "space-between",
            },
            children: [
              {
                type: "div",
                props: {
                  style: { display: "flex" },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          backgroundColor: hexToRgba(color, 0.12),
                          color,
                          fontSize: "28px",
                          fontWeight: 700,
                          padding: "12px 28px",
                          borderRadius: "12px",
                          letterSpacing: "2px",
                        },
                        children: categoryLabel.toUpperCase(),
                      },
                    },
                  ],
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px 0",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: "52px",
                          fontWeight: 700,
                          color: "#1a1a2e",
                          lineHeight: 1.4,
                          textAlign: "center",
                        },
                        children: title,
                      },
                    },
                  ],
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    justifyContent: "center",
                    borderTop: "2px solid #f0f0f0",
                    paddingTop: "24px",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: "22px",
                          fontWeight: 600,
                          color: "#9ca3af",
                          letterSpacing: "1px",
                        },
                        children: "Swipe to learn more >>",
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  };
}

function buildContentSlide(
  slide: SlideContent,
  slideIndex: number,
  totalSlides: number,
  color: string
): Record<string, unknown> {
  return {
    type: "div",
    props: {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, ${hexToRgba(color, 0.05)} 0%, white 100%)`,
        padding: "60px",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: "100%",
              backgroundColor: "white",
              borderRadius: "32px",
              padding: "64px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
              border: `3px solid ${hexToRgba(color, 0.2)}`,
              justifyContent: "space-between",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "32px",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: "20px",
                          fontWeight: 600,
                          color: "#9ca3af",
                        },
                        children: `${slideIndex} / ${totalSlides}`,
                      },
                    },
                  ],
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    justifyContent: "center",
                    gap: "24px",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: "40px",
                          fontWeight: 700,
                          color,
                          lineHeight: 1.3,
                        },
                        children: slide.title,
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: "30px",
                          fontWeight: 400,
                          color: "#4b5563",
                          lineHeight: 1.6,
                        },
                        children: slide.body,
                      },
                    },
                  ],
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    justifyContent: "center",
                    borderTop: "2px solid #f0f0f0",
                    paddingTop: "24px",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: "20px",
                          fontWeight: 600,
                          color: "#9ca3af",
                          letterSpacing: "3px",
                        },
                        children: "CLAUDEX | DYOR - NFA",
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  };
}

function buildCtaSlide(
  ctaText: string,
  referralUrl: string | undefined,
  color: string
): Record<string, unknown> {
  const ctaChildren: unknown[] = [
    {
      type: "div",
      props: {
        style: {
          fontSize: "48px",
          fontWeight: 700,
          color: "#1a1a2e",
          lineHeight: 1.4,
          textAlign: "center",
        },
        children: ctaText,
      },
    },
  ];

  if (referralUrl) {
    ctaChildren.push({
      type: "div",
      props: {
        style: {
          marginTop: "32px",
          backgroundColor: color,
          color: "white",
          fontSize: "28px",
          fontWeight: 700,
          padding: "16px 48px",
          borderRadius: "16px",
        },
        children: "Link in Bio",
      },
    });
  }

  return {
    type: "div",
    props: {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, ${hexToRgba(color, 0.1)} 0%, ${hexToRgba(color, 0.2)} 100%)`,
        padding: "60px",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: "100%",
              backgroundColor: "white",
              borderRadius: "32px",
              padding: "64px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
              border: `3px solid ${hexToRgba(color, 0.3)}`,
              justifyContent: "center",
              alignItems: "center",
              gap: "24px",
            },
            children: ctaChildren,
          },
        },
      ],
    },
  };
}

async function renderSlide(
  markup: Record<string, unknown>,
  fontData: ArrayBuffer
): Promise<Buffer> {
  const svg = await satori(markup as Parameters<typeof satori>[0], {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    fonts: [
      {
        name: "Noto Sans JP",
        data: fontData,
        weight: 400,
        style: "normal" as const,
      },
      {
        name: "Noto Sans JP",
        data: fontData,
        weight: 700,
        style: "normal" as const,
      },
    ],
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width" as const, value: IMAGE_SIZE },
  });
  const png = resvg.render().asPng();
  return Buffer.from(png);
}

export async function generateCarousel(
  title: string,
  slides: readonly SlideContent[],
  category: string,
  campaignId?: string
): Promise<readonly string[]> {
  const fontData = await fetchFont();
  const color = CATEGORY_COLORS[category] ?? "#6366F1";

  const outputDir = campaignId
    ? path.join(DATA_DIR, campaignId)
    : path.join(DATA_DIR, title.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase());

  await fs.mkdir(outputDir, { recursive: true });

  const totalSlides = slides.length + 2;
  const filePaths: string[] = [];

  const titleMarkup = buildTitleSlide(title, category, color);
  const titlePng = await renderSlide(titleMarkup, fontData);
  const titlePath = path.join(outputDir, "slide_01_title.png");
  await fs.writeFile(titlePath, titlePng);
  filePaths.push(titlePath);

  for (let i = 0; i < slides.length; i++) {
    const slideMarkup = buildContentSlide(
      slides[i],
      i + 2,
      totalSlides,
      color
    );
    const slidePng = await renderSlide(slideMarkup, fontData);
    const slidePath = path.join(
      outputDir,
      `slide_${String(i + 2).padStart(2, "0")}_content.png`
    );
    await fs.writeFile(slidePath, slidePng);
    filePaths.push(slidePath);
  }

  let referralUrl: string | undefined;
  if (campaignId) {
    referralUrl = buildReferralUrl(campaignId, "instagram", "story");
  }

  const ctaMarkup = buildCtaSlide(
    "Follow @mochi_d3fi for more",
    referralUrl,
    color
  );
  const ctaPng = await renderSlide(ctaMarkup, fontData);
  const ctaPath = path.join(
    outputDir,
    `slide_${String(slides.length + 2).padStart(2, "0")}_cta.png`
  );
  await fs.writeFile(ctaPath, ctaPng);
  filePaths.push(ctaPath);

  return filePaths;
}

export async function generateFromCampaign(
  campaign: AirdropCampaign
): Promise<readonly string[]> {
  const tierLabel =
    campaign.tier === "S"
      ? "Tier S - Must Do"
      : campaign.tier === "A"
        ? "Tier A - Recommended"
        : campaign.tier === "B"
          ? "Tier B - Worth Trying"
          : "Tier C - Optional";

  const title = `${campaign.name} ${tierLabel}`;

  const topTasks = campaign.tasks.slice(0, 3);
  const taskList = topTasks
    .map((t, i) => `${i + 1}. ${t.title}`)
    .join("\n");

  const slides: SlideContent[] = [
    {
      title: `${campaign.name} (${campaign.category})`,
      body: campaign.description.slice(0, 200),
    },
    {
      title: `Estimated: ${campaign.estimatedValue}`,
      body: campaign.fundingRaised
        ? `Funding: ${campaign.fundingRaised}`
        : "",
    },
    {
      title: "Tasks",
      body: taskList,
    },
  ];

  return generateCarousel(title, slides, campaign.category, campaign.id);
}
