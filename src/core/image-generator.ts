import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import fs from "fs/promises";
import path from "path";
import type { ContentCategory } from "./types.js";

interface ImageOptions {
  readonly text: string;
  readonly category: ContentCategory;
  readonly width?: number;
  readonly height?: number;
  readonly brandColor?: string;
}

const CATEGORY_COLORS: Record<ContentCategory, string> = {
  protocol_intro: "#6366F1",
  airdrop_alert: "#F59E0B",
  defi_guide: "#10B981",
  market_update: "#3B82F6",
  card_comparison: "#8B5CF6",
  referral_promo: "#EC4899",
  engagement: "#06B6D4",
};

export async function generatePostImage(
  options: ImageOptions
): Promise<Buffer> {
  const {
    text,
    category,
    width = 1080,
    height = 1080,
    brandColor,
  } = options;

  const color = brandColor ?? CATEGORY_COLORS[category];

  // Split text into lines for display
  const lines = splitTextIntoLines(text, 30);

  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: `linear-gradient(135deg, ${color}15 0%, ${color}30 100%)`,
          padding: "60px",
          fontFamily: "sans-serif",
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                width: "100%",
                backgroundColor: "white",
                borderRadius: "24px",
                padding: "48px",
                boxShadow: `0 4px 24px ${color}20`,
                border: `3px solid ${color}40`,
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: "14px",
                      fontWeight: 700,
                      color,
                      textTransform: "uppercase",
                      letterSpacing: "2px",
                      marginBottom: "20px",
                    },
                    children: getCategoryLabel(category),
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: "28px",
                      fontWeight: 600,
                      color: "#1a1a2e",
                      lineHeight: 1.5,
                    },
                    children: lines.join("\n"),
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      marginTop: "32px",
                      fontSize: "14px",
                      color: "#6b7280",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
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
    {
      width,
      height,
      fonts: [],
    }
  );

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
  });
  const pngData = resvg.render();
  return Buffer.from(pngData.asPng());
}

export async function savePostImage(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const outputDir = path.join(
    path.dirname(new URL(import.meta.url).pathname),
    "../../data/images"
  );
  await fs.mkdir(outputDir, { recursive: true });
  const filepath = path.join(outputDir, filename);
  await fs.writeFile(filepath, buffer);
  return filepath;
}

function splitTextIntoLines(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length > maxCharsPerLine) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine = currentLine ? `${currentLine} ${word}` : word;
    }
  }
  if (currentLine) lines.push(currentLine.trim());
  return lines;
}

function getCategoryLabel(category: ContentCategory): string {
  const labels: Record<ContentCategory, string> = {
    protocol_intro: "Protocol Spotlight",
    airdrop_alert: "Airdrop Alert",
    defi_guide: "DeFi Guide",
    market_update: "Market Update",
    card_comparison: "Card Comparison",
    referral_promo: "Featured",
    engagement: "Community",
  };
  return labels[category];
}
