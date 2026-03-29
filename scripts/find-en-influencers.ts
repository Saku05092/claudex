/**
 * Find English Airdrop Influencers (supplement to main script)
 * Runs only the EN queries and merges with existing Japanese results.
 */
import "dotenv/config";
import { TwitterApi } from "twitter-api-v2";
import fs from "fs/promises";
import path from "path";

const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
if (!BEARER_TOKEN) {
  console.error("TWITTER_BEARER_TOKEN is not set");
  process.exit(1);
}

const client = new TwitterApi(BEARER_TOKEN);

const EN_QUERIES = [
  "airdrop alpha confirmed -is:retweet lang:en",
  "airdrop TGE confirmed -is:retweet lang:en",
  "airdrop farming guide -is:retweet lang:en",
  "airdrop strategy alpha -is:retweet lang:en",
  "airdrop snapshot eligible -is:retweet lang:en",
  "DeFi airdrop farming criteria -is:retweet lang:en",
  "crypto airdrop tutorial step -is:retweet lang:en",
  "airdrop season token launch -is:retweet lang:en",
];

interface Candidate {
  userId: string;
  username: string;
  name: string;
  followers: number;
  description: string;
  totalLikes: number;
  totalRTs: number;
  totalReplies: number;
  tweetsFound: number;
  sampleTweets: string[];
  alphaScore: number;
  engagementRate: number;
  avgEngagement: number;
}

async function main() {
  const candidates = new Map<string, Candidate>();

  console.log("[EN Influencer Finder] Searching...\n");

  for (let i = 0; i < EN_QUERIES.length; i++) {
    const query = EN_QUERIES[i];
    process.stdout.write(`  Query ${i + 1}/${EN_QUERIES.length}: ${query.slice(0, 50)}... `);

    try {
      const result = await client.v2.search(query, {
        max_results: 100,
        "tweet.fields": ["created_at", "public_metrics", "author_id"],
        expansions: ["author_id"],
        "user.fields": ["username", "name", "public_metrics", "description"],
      });

      const tweets = result.data?.data ?? [];
      const users = result.includes?.users ?? [];
      const userMap = new Map(users.map((u) => [u.id, u]));

      for (const tweet of tweets) {
        const user = userMap.get(tweet.author_id ?? "");
        if (!user) continue;
        const m = tweet.public_metrics;
        if (!m) continue;

        const existing = candidates.get(user.id);
        if (existing) {
          existing.totalLikes += m.like_count;
          existing.totalRTs += m.retweet_count;
          existing.totalReplies += m.reply_count;
          existing.tweetsFound += 1;
          if (existing.sampleTweets.length < 3) {
            existing.sampleTweets.push(tweet.text.slice(0, 100));
          }
        } else {
          const um = user.public_metrics;
          candidates.set(user.id, {
            userId: user.id,
            username: user.username,
            name: user.name,
            followers: um?.followers_count ?? 0,
            description: (user.description ?? "").slice(0, 200),
            totalLikes: m.like_count,
            totalRTs: m.retweet_count,
            totalReplies: m.reply_count,
            tweetsFound: 1,
            sampleTweets: [tweet.text.slice(0, 100)],
            alphaScore: 0,
            engagementRate: 0,
            avgEngagement: 0,
          });
        }
      }

      console.log(`(${candidates.size} candidates)`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`FAILED: ${msg.slice(0, 80)}`);
    }

    await new Promise((r) => setTimeout(r, 1500));
  }

  // Score
  for (const c of candidates.values()) {
    const total = c.totalLikes + c.totalRTs + c.totalReplies;
    c.avgEngagement = c.tweetsFound > 0 ? total / c.tweetsFound : 0;
    c.engagementRate = c.followers > 0 ? (c.avgEngagement / c.followers) * 100 : 0;

    const engScore = Math.min(c.engagementRate * 10, 30);
    const consistScore = Math.min(c.tweetsFound * 5, 20);
    const rtRatio = total > 0 ? c.totalRTs / total : 0;
    const rtScore = rtRatio * 20;
    let followerScore = 0;
    if (c.followers >= 1000 && c.followers <= 500000) followerScore = 15;
    else if (c.followers >= 500) followerScore = 8;
    else if (c.followers > 500000) followerScore = 10;
    else followerScore = 2;
    const absScore = Math.min(Math.log10(total + 1) * 5, 15);

    c.alphaScore = engScore + consistScore + rtScore + followerScore + absScore;
  }

  const sorted = [...candidates.values()].sort((a, b) => b.alphaScore - a.alphaScore);
  const top30 = sorted.slice(0, 30);

  console.log("\n=== TOP INTERNATIONAL AIRDROP INFLUENCERS ===\n");
  for (let i = 0; i < top30.length; i++) {
    const c = top30[i];
    const fStr = c.followers >= 1000000 ? `${(c.followers / 1000000).toFixed(1)}M` :
      c.followers >= 1000 ? `${(c.followers / 1000).toFixed(1)}K` : String(c.followers);
    console.log(
      `${String(i + 1).padStart(2)}. @${c.username.padEnd(22)} ` +
      `Followers: ${fStr.padStart(8)} | Alpha: ${c.alphaScore.toFixed(1).padStart(5)} | ` +
      `ER: ${c.engagementRate.toFixed(2).padStart(6)}% | Tweets: ${c.tweetsFound}`
    );
  }

  // Merge with existing Japanese data
  const dataPath = path.join(path.dirname(new URL(import.meta.url).pathname), "../data/airdrop-influencers.json");
  const existing = JSON.parse(await fs.readFile(dataPath, "utf-8"));

  existing.international = top30.map((c) => ({
    username: c.username,
    name: c.name,
    followers: c.followers,
    alphaScore: Math.round(c.alphaScore * 10) / 10,
    engagementRate: `${c.engagementRate.toFixed(2)}%`,
    avgEngagement: Math.round(c.avgEngagement),
    tweetsFound: c.tweetsFound,
    description: c.description,
    sampleTweets: c.sampleTweets,
  }));
  existing.generatedAt = new Date().toISOString();
  existing.totalQueriesUsed = (existing.queriesUsed ?? 0) + EN_QUERIES.length;

  await fs.writeFile(dataPath, JSON.stringify(existing, null, 2));
  console.log(`\n[EN Influencer Finder] Merged into ${dataPath}`);
  console.log(`[EN Influencer Finder] Total: ${existing.japanese.length} JP + ${existing.international.length} EN`);
}

main();
