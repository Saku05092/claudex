/**
 * Generate sample airdrop tweets using all 5 patterns
 *
 * Usage: npx tsx scripts/generate-airdrop-tweets.ts
 */
import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import {
  TWEET_PATTERNS,
  buildTweetPrompt,
  type AirdropProjectData,
} from "../src/core/airdrop-tweet-patterns.js";

const EDGEX_DATA: AirdropProjectData = {
  name: "edgeX",
  ticker: "EDGE",
  category: "Perp DEX",
  chain: "Ethereum",
  description:
    "High-performance Perp DEX with CEX-grade speed (200K+ orders/sec, <10ms latency). TGE scheduled for March 31, 2026.",
  tasks: [
    "edgeXで取引してXPを獲得",
    "リファーラルで友人を招待",
    "複数ペアで取引量を増やす",
  ],
  estimatedValue: "$500-3,000+",
  fundingRaised: "non-disclosed",
  backers: ["non-disclosed"],
  referralLink: "https://pro.edgex.exchange/en-US/referral/XXXXX",
  referralReward:
    "Referrer gets 1/5 of referee points + up to 30% trading fee rebate",
  deadline: "2026-03-31",
  tgeDate: "2026-03-31",
  tokenAllocation: "25% Genesis Distribution (airdrop) + up to 5% Pre-TGE",
  pointsProgram: "XP accumulates weekly, converts 1:1 to EDGE tokens at TGE",
};

const BACKPACK_DATA: AirdropProjectData = {
  name: "Backpack Exchange",
  ticker: "BP",
  category: "DEX",
  chain: "Solana",
  description:
    "Solana-based exchange. TGE March 23, 2026. 25% of supply to community.",
  tasks: [
    "Backpack Exchangeで取引",
    "ポイントを獲得(毎週金曜計算)",
    "Mad Lads NFT保有",
  ],
  estimatedValue: "$500-3,000",
  fundingRaised: "$17M (valuation $1B)",
  backers: ["FTX Ventures", "Jump Crypto", "Multicoin"],
  referralLink: "",
  referralReward: "",
  deadline: "2026-03-23",
  tgeDate: "2026-03-23",
  tokenAllocation: "25% community, 24% points holders, 1% Mad Lads",
  pointsProgram: "Season 4 active. Points calculated weekly on Fridays.",
};

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[Error] ANTHROPIC_API_KEY not set");
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });

  console.log("=".repeat(70));
  console.log("AIRDROP TWEET GENERATION - 5 Patterns x edgeX");
  console.log("=".repeat(70));

  for (const pattern of TWEET_PATTERNS) {
    console.log(`\n${"─".repeat(70)}`);
    console.log(`Pattern: ${pattern.nameJa} (${pattern.nameEn})`);
    console.log(`Best for: ${pattern.bestFor}`);
    console.log(`${"─".repeat(70)}`);

    let projectData = EDGEX_DATA;
    let prompt = buildTweetPrompt(pattern, projectData);

    // For comparison pattern, include both projects
    if (pattern.id === "comparison") {
      prompt = {
        system: pattern.systemPrompt,
        user: `Write a comparison tweet for these similar projects:
edgeX (Perp DEX, TGE 3/31, 25% airdrop, XP 1:1 conversion, referral: 1/5 of points + 30% fee rebate)
vs
Backpack Exchange (DEX on Solana, TGE 3/23, 25% community, Season 4 points)

Category: DEX/Exchange
My referral is for: edgeX`,
      };
    }

    // For alpha roundup, list multiple projects
    if (pattern.id === "alpha_roundup") {
      prompt = {
        system: pattern.systemPrompt,
        user: `Write an alpha round-up tweet covering these projects:
1. edgeX - Perp DEX, TGE 3/31, XP 1:1 token conversion, 25% airdrop
2. Backpack - Solana DEX, TGE 3/23, 25% community distribution
3. OpenSea - SEA token announced, 50% community, TGE delayed
4. Linea - LXP points active, MetaMask Rewards integration
5. Polymarket - POLY trademark filed Feb 2026, prediction market`,
      };
    }

    try {
      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        system: prompt.system,
        messages: [{ role: "user", content: prompt.user }],
      });

      const text =
        response.content[0].type === "text" ? response.content[0].text : "";

      console.log(`\n${text}`);
      console.log(`\n[${text.length} chars | Tokens: ${response.usage.input_tokens}in/${response.usage.output_tokens}out]`);
    } catch (error) {
      console.error(`[Error] ${error}`);
    }
  }

  console.log(`\n${"=".repeat(70)}`);
  console.log("Generation complete.");
}

main();
