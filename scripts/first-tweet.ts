import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(import.meta.dirname ?? ".", "../.env") });

import Anthropic from "@anthropic-ai/sdk";
import { TwitterApi } from "twitter-api-v2";

const SYSTEM_PROMPT =
  "You are writing a casual first tweet for a Japanese person who just started learning about DeFi. Write in natural, friendly Japanese. Keep under 240 characters to leave room for hashtags. Do not include any disclaimer on this first personal tweet - it's just a self-introduction, not financial content.";

const USER_PROMPT =
  "Write a first tweet introducing yourself as someone who just started exploring DeFi and crypto. You want to share what you learn along the way. Keep it casual and authentic. Add 2-3 relevant Japanese hashtags at the end.";

async function generateTweet(): Promise<string> {
  const anthropic = new Anthropic();

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: USER_PROMPT }],
  });

  const block = response.content[0];
  if (block.type !== "text") {
    throw new Error("Unexpected response type from Claude API");
  }

  const raw = block.text.trim();

  // Extract only the tweet text - remove any markdown headers, explanations, or alternatives
  const lines = raw.split("\n");
  const tweetLines: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip markdown headers, empty lines at start, and meta-commentary
    if (trimmed.startsWith("#") || trimmed.startsWith("---") || trimmed.startsWith("**") || trimmed.startsWith("###")) {
      if (tweetLines.length > 0) break; // Stop if we already collected tweet text
      continue;
    }
    if (trimmed === "" && tweetLines.length === 0) continue;
    if (trimmed === "") {
      // Empty line after tweet content means end of tweet
      if (tweetLines.length > 0) break;
      continue;
    }
    tweetLines.push(trimmed);
  }

  const tweet = tweetLines.join("\n");

  if (tweet.length === 0) {
    throw new Error("Failed to extract tweet text from Claude response");
  }

  if (tweet.length > 280) {
    throw new Error(`Generated tweet exceeds 280 characters (${tweet.length})`);
  }

  return tweet;
}

async function postTweet(text: string): Promise<string> {
  const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY!,
    appSecret: process.env.TWITTER_API_SECRET!,
    accessToken: process.env.TWITTER_ACCESS_TOKEN!,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
  });

  const result = await client.v2.tweet(text);
  return result.data.id;
}

async function main() {
  try {
    console.log("Generating tweet with Claude Haiku...");
    const tweetText = await generateTweet();

    console.log("\n--- Generated Tweet ---");
    console.log(tweetText);
    console.log(`--- (${tweetText.length} characters) ---\n`);

    console.log("Posting to Twitter...");
    const tweetId = await postTweet(tweetText);

    const tweetUrl = `https://x.com/mochi_d3fi/status/${tweetId}`;
    console.log(`\n[OK] Tweet posted successfully!`);
    console.log(`Tweet URL: ${tweetUrl}`);
  } catch (error: unknown) {
    const err = error as { message?: string; data?: unknown; code?: number };
    console.error(`[FAIL] ${err.message ?? String(error)}`);
    if (err.data) {
      console.error("Details:", JSON.stringify(err.data, null, 2));
    }
    process.exit(1);
  }
}

main();
