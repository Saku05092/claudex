/**
 * Final round of influencer search to reach 50 target.
 * Uses more specific protocol/project names and different angles.
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

const JA_QUERIES = [
  "DeFi エアドロップ おすすめ -is:retweet lang:ja",
  "仮想通貨 エアドロ 稼ぐ -is:retweet lang:ja",
  "L2 airdrop ブリッジ -is:retweet lang:ja",
  "Hyperliquid airdrop -is:retweet lang:ja",
];

const EN_QUERIES = [
  "layer2 airdrop bridge farming -is:retweet lang:en",
  "Hyperliquid airdrop -is:retweet lang:en",
  "retroactive airdrop criteria -is:retweet lang:en",
  "crypto airdrop hunter -is:retweet lang:en",
  "airdrop whale wallet tracker -is:retweet lang:en",
  "new DEX airdrop confirmed -is:retweet lang:en",
  "airdrop szn farming alpha -is:retweet lang:en",
  "onchain airdrop strategy -is:retweet lang:en",
];

interface Candidate {
  username: string;
  name: string;
  followers: number;
  description: string;
  totalLikes: number;
  totalRTs: number;
  totalReplies: number;
  tweetsFound: number;
  sampleTweets: string[];
  lang: "ja" | "en";
}

function score(c: Candidate): number {
  if (c.followers < 1000) return -1;
  const total = c.totalLikes + c.totalRTs + c.totalReplies;
  const avg = c.tweetsFound > 0 ? total / c.tweetsFound : 0;
  const er = c.followers > 0 ? (avg / c.followers) * 100 : 0;
  const engScore = Math.min(er * 8, 25);
  let consistScore = c.tweetsFound >= 5 ? 25 : c.tweetsFound >= 3 ? 20 : c.tweetsFound >= 2 ? 15 : 3;
  let followerScore = c.followers >= 50000 ? 20 : c.followers >= 10000 ? 18 : c.followers >= 5000 ? 15 : 12;
  if (c.followers > 500000) followerScore = 10;
  const absScore = Math.min(Math.log10(avg + 1) * 7, 15);
  const qualityScore = c.followers >= 5000 && er >= 0.1 ? 15 : c.followers >= 1000 && er >= 0.05 ? 10 : 5;
  return engScore + consistScore + followerScore + absScore + qualityScore;
}

async function search(query: string, lang: "ja" | "en", candidates: Map<string, Candidate>): Promise<void> {
  try {
    const result = await client.v2.search(query, {
      max_results: 100,
      "tweet.fields": ["public_metrics", "author_id"],
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
      const key = user.username.toLowerCase();
      const existing = candidates.get(key);
      if (existing) {
        existing.totalLikes += m.like_count;
        existing.totalRTs += m.retweet_count;
        existing.totalReplies += m.reply_count;
        existing.tweetsFound += 1;
        if (existing.sampleTweets.length < 3) existing.sampleTweets.push(tweet.text.slice(0, 100));
      } else {
        const um = user.public_metrics;
        candidates.set(key, {
          username: user.username, name: user.name, followers: um?.followers_count ?? 0,
          description: (user.description ?? "").slice(0, 200),
          totalLikes: m.like_count, totalRTs: m.retweet_count, totalReplies: m.reply_count,
          tweetsFound: 1, sampleTweets: [tweet.text.slice(0, 100)], lang,
        });
      }
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`  FAILED: ${msg.slice(0, 80)}`);
  }
}

async function main() {
  const dataPath = path.join(path.dirname(new URL(import.meta.url).pathname), "../data/airdrop-influencers.json");
  const existing = JSON.parse(await fs.readFile(dataPath, "utf-8"));

  const existingAll = new Set([
    ...(existing.japanese ?? []).map((c: { username: string }) => c.username.toLowerCase()),
    ...(existing.international ?? []).map((c: { username: string }) => c.username.toLowerCase()),
  ]);

  const candidates = new Map<string, Candidate>();
  const allQueries = [
    ...JA_QUERIES.map((q) => ({ q, lang: "ja" as const })),
    ...EN_QUERIES.map((q) => ({ q, lang: "en" as const })),
  ];

  console.log(`[Final Round] ${allQueries.length} queries, need ${50 - (existing.japanese.length + existing.international.length)} more influencers\n`);

  for (let i = 0; i < allQueries.length; i++) {
    const { q, lang } = allQueries[i];
    process.stdout.write(`  ${i + 1}/${allQueries.length}: ${q.slice(0, 55)}... `);
    await search(q, lang, candidates);
    console.log(`(${candidates.size} candidates)`);
    await new Promise((r) => setTimeout(r, 1500));
  }

  const newJa = [...candidates.values()]
    .filter((c) => c.lang === "ja" && !existingAll.has(c.username.toLowerCase()))
    .map((c) => ({ ...c, alphaScore: score(c) }))
    .filter((c) => c.alphaScore > 0)
    .sort((a, b) => b.alphaScore - a.alphaScore);

  const newEn = [...candidates.values()]
    .filter((c) => c.lang === "en" && !existingAll.has(c.username.toLowerCase()))
    .map((c) => ({ ...c, alphaScore: score(c) }))
    .filter((c) => c.alphaScore > 0)
    .sort((a, b) => b.alphaScore - a.alphaScore);

  const jaNeeded = Math.max(0, 20 - existing.japanese.length);
  const enNeeded = Math.max(0, 30 - existing.international.length);
  const jaAdd = newJa.slice(0, jaNeeded);
  const enAdd = newEn.slice(0, enNeeded);

  console.log(`\n[Final Round] New (>1K followers): ${newJa.length} JP, ${newEn.length} EN`);
  console.log(`[Final Round] Adding: ${jaAdd.length} JP, ${enAdd.length} EN`);

  if (jaAdd.length > 0) {
    console.log("\n--- New Japanese ---");
    for (const c of jaAdd) {
      const f = c.followers >= 1000 ? `${(c.followers / 1000).toFixed(1)}K` : String(c.followers);
      console.log(`  @${c.username.padEnd(22)} Followers: ${f.padStart(7)} | Alpha: ${c.alphaScore.toFixed(1)} | Tweets: ${c.tweetsFound}`);
    }
  }
  if (enAdd.length > 0) {
    console.log("\n--- New International ---");
    for (const c of enAdd) {
      const f = c.followers >= 1000000 ? `${(c.followers / 1000000).toFixed(1)}M` : c.followers >= 1000 ? `${(c.followers / 1000).toFixed(1)}K` : String(c.followers);
      console.log(`  @${c.username.padEnd(22)} Followers: ${f.padStart(7)} | Alpha: ${c.alphaScore.toFixed(1)} | Tweets: ${c.tweetsFound}`);
    }
  }

  const format = (c: Candidate & { alphaScore: number }) => {
    const total = c.totalLikes + c.totalRTs + c.totalReplies;
    const avg = c.tweetsFound > 0 ? total / c.tweetsFound : 0;
    const er = c.followers > 0 ? (avg / c.followers) * 100 : 0;
    return {
      username: c.username, name: c.name, followers: c.followers,
      alphaScore: Math.round(c.alphaScore * 10) / 10, engagementRate: `${er.toFixed(2)}%`,
      avgEngagement: Math.round(avg), tweetsFound: c.tweetsFound,
      description: c.description, sampleTweets: c.sampleTweets,
    };
  };

  const finalJa = [...existing.japanese, ...jaAdd.map(format)];
  const finalEn = [...existing.international, ...enAdd.map(format)];

  await fs.writeFile(dataPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    scoringVersion: "v2",
    notes: "Three rounds of queries. Target: 20 JP + 30 EN",
    totalQueriesUsed: (existing.totalQueriesUsed ?? 0) + allQueries.length,
    japanese: finalJa,
    international: finalEn,
  }, null, 2));

  const total = finalJa.length + finalEn.length;
  console.log(`\n[Final Round] TOTAL: ${finalJa.length} JP + ${finalEn.length} EN = ${total}/50`);
  if (total < 50) console.log(`[Final Round] Still short by ${50 - total}. Consider lowering follower threshold or adding known accounts manually.`);
}

main();
