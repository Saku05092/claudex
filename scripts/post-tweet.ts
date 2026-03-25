/**
 * Generate and post a tweet with a specific pattern
 *
 * Usage:
 *   npx tsx scripts/post-tweet.ts educational "Perp DEXとは"
 *   npx tsx scripts/post-tweet.ts engagement
 *   npx tsx scripts/post-tweet.ts --dry  (generate only, don't post)
 */
import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { TwitterApi } from "twitter-api-v2";

type TweetType = "intro" | "educational" | "engagement" | "airdrop_experience" | "airdrop_roundup" | "airdrop_deadline" | "custom";

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry");
  const filteredArgs = args.filter((a) => a !== "--dry");
  const tweetType = (filteredArgs[0] || "engagement") as TweetType;
  const topic = filteredArgs.slice(1).join(" ");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[Error] ANTHROPIC_API_KEY not set");
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });

  const systemPrompt = `You are "mochi" (@mochi_d3fi), a Japanese person who recently started learning about DeFi.
Tone: casual, friendly, honest, curious. Never pushy or salesy.
Write in natural Japanese. No emojis. Under 240 characters.
Sound like a real person sharing genuine thoughts, not a bot.`;

  const prompts: Record<TweetType, string> = {
    intro: "Write a casual self-introduction tweet. You just started learning about crypto and DeFi. Share what interests you about it. Ask if others are also beginners.",
    educational: `Write a short educational tweet about: ${topic || "DeFi concepts for beginners"}. Keep it simple. End with a question to encourage replies.`,
    engagement: "Write a casual tweet asking your followers a question about their crypto experience. Examples: first crypto purchase, biggest learning moment, favorite DeFi protocol. Keep it conversational.",
    airdrop_experience: `Write a personal experience tweet about trying a DeFi protocol. ${topic ? `Topic: ${topic}` : "Pick a general DeFi experience like first swap, first bridge, or first liquidity provision."}. Share honest impressions. Include DYOR.`,
    airdrop_roundup: "Write a weekly airdrop round-up mentioning: edgeX (TGE 3/31), Backpack (TGE 3/23), OpenSea (SEA delayed), Linea (LXP active). Keep neutral, no referral links. DYOR.",
    airdrop_deadline: `Write a deadline alert about: ${topic || "edgeX TGE on March 31"}. State facts only, no hype. Include DYOR.`,
    custom: topic || "Write a casual crypto-related tweet.",
  };

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    system: systemPrompt,
    messages: [{ role: "user", content: prompts[tweetType] }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  console.log(`\n--- Generated Tweet (${tweetType}) ---`);
  console.log(text);
  console.log(`--- (${text.length} chars) ---`);

  if (isDryRun) {
    console.log("\n[Dry run] Tweet not posted.");
    return;
  }

  const twitter = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY!,
    appSecret: process.env.TWITTER_API_SECRET!,
    accessToken: process.env.TWITTER_ACCESS_TOKEN!,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
  });

  try {
    const result = await twitter.v2.tweet(text);
    console.log(`\n[OK] Posted: https://x.com/mochi_d3fi/status/${result.data.id}`);
  } catch (error: unknown) {
    const err = error as { code?: number; data?: unknown };
    console.error(`[FAIL] ${JSON.stringify(err.data)}`);
  }
}

main();
