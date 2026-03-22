import Anthropic from "@anthropic-ai/sdk";
import type {
  ContentCategory,
  ContentLanguage,
  GeneratedContent,
  CryptoCard,
  DeFiProtocol,
} from "./types.js";

const DISCLAIMER_JA =
  "This is not financial advice. DYOR (Do Your Own Research). PR";
const DISCLAIMER_EN =
  "This is not financial advice. DYOR (Do Your Own Research). PR";

interface ContentRequest {
  readonly category: ContentCategory;
  readonly language: ContentLanguage;
  readonly topic: string;
  readonly context?: string;
  readonly card?: CryptoCard;
  readonly protocol?: DeFiProtocol;
  readonly referralLink?: string;
}

export function createContentGenerator(apiKey: string) {
  const client = new Anthropic({ apiKey });

  async function generateContent(
    request: ContentRequest
  ): Promise<GeneratedContent> {
    const systemPrompt = buildSystemPrompt(request.language);
    const userPrompt = buildUserPrompt(request);

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return {
      text,
      category: request.category,
      language: request.language,
      platforms: determinePlatforms(request.category),
      referralLink: request.referralLink,
      disclaimer:
        request.language === "ja" ? DISCLAIMER_JA : DISCLAIMER_EN,
      hashtags: extractHashtags(text),
      imageRequired: true,
    };
  }

  async function generateCardComparison(
    cards: readonly CryptoCard[],
    language: ContentLanguage
  ): Promise<GeneratedContent> {
    return generateContent({
      category: "card_comparison",
      language,
      topic: "Crypto Card Comparison for Japan Users",
      context: JSON.stringify(
        cards.map((c) => ({
          name: c.name,
          cashback: c.cashbackPercent,
          fee: c.annualFee,
          referral: c.referralReward,
        }))
      ),
    });
  }

  return { generateContent, generateCardComparison };
}

function buildSystemPrompt(language: ContentLanguage): string {
  if (language === "ja") {
    return `You are a crypto content creator targeting Japanese beginners.
Rules:
- Write in natural, friendly Japanese
- Keep tweets under 240 characters (leave room for links/hashtags)
- Always include DYOR reminder
- Add "PR" when mentioning referral links
- Explain DeFi concepts simply
- Never give financial advice
- Use relevant hashtags in Japanese`;
  }
  return `You are a crypto content creator targeting beginners.
Rules:
- Keep tweets under 260 characters (leave room for links/hashtags)
- Always include DYOR reminder
- Add "PR" when mentioning referral links
- Explain DeFi concepts simply
- Never give financial advice
- Use relevant hashtags`;
}

function buildUserPrompt(request: ContentRequest): string {
  const prompts: Record<ContentCategory, string> = {
    protocol_intro: `Write a brief, beginner-friendly introduction to this DeFi protocol: ${request.topic}. ${request.context ?? ""}`,
    airdrop_alert: `Write an alert about a potential airdrop opportunity: ${request.topic}. ${request.context ?? ""}`,
    defi_guide: `Write a simple educational post about: ${request.topic}. ${request.context ?? ""}`,
    market_update: `Write a brief market update about: ${request.topic}. ${request.context ?? ""}`,
    card_comparison: `Write a comparison post about crypto cards available in Japan: ${request.context ?? ""}`,
    referral_promo: `Write a promotional post for: ${request.topic}. Include the referral benefit. ${request.context ?? ""} Mark as PR.`,
    engagement: `Write a casual, relatable crypto community post about: ${request.topic}. Keep it human and authentic.`,
  };

  return prompts[request.category];
}

function determinePlatforms(
  category: ContentCategory
): readonly ("twitter" | "discord" | "telegram" | "instagram")[] {
  const allPlatforms = [
    "twitter",
    "discord",
    "telegram",
    "instagram",
  ] as const;
  if (category === "engagement") {
    return ["twitter", "instagram"];
  }
  return allPlatforms;
}

function extractHashtags(text: string): readonly string[] {
  const matches = text.match(/#[\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+/g);
  return matches ?? [];
}
