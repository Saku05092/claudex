/**
 * Supplemental influencer search to reach 50 target.
 * Different keywords to find accounts not caught by first round.
 * Merges with existing data, deduplicates, and re-scores.
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

// Additional JP queries (different keywords)
const JA_EXTRA = [
  "エアドロ まとめ 今週 -is:retweet lang:ja",
  "airdrop 参加方法 -is:retweet lang:ja",
  "エアドロ ポイント 貯め -is:retweet lang:ja",
  "クリプト alpha 情報 -is:retweet lang:ja",
];

// Additional EN queries (broader, different angles)
const EN_EXTRA = [
  "best airdrop opportunity 2026 -is:retweet lang:en",
  "airdrop claim guide tutorial -is:retweet lang:en",
  "upcoming token airdrop eligibility -is:retweet lang:en",
  "free crypto airdrop verified -is:retweet lang:en",
  "airdrop thread alpha leak -is:retweet lang:en",
  "points farming crypto protocol -is:retweet lang:en",
  "testnet airdrop mainnet launch -is:retweet lang:en",
  "DeFi yield farming new protocol -is:retweet lang:en",
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

  let consistScore = 0;
  if (c.tweetsFound >= 5) consistScore = 25;
  else if (c.tweetsFound >= 3) consistScore = 20;
  else if (c.tweetsFound >= 2) consistScore = 15;
  else consistScore = 3;

  let followerScore = 0;
  if (c.followers >= 50000 && c.followers <= 500000) followerScore = 20;
  else if (c.followers >= 10000) followerScore = 18;
  else if (c.followers >= 5000) followerScore = 15;
  else if (c.followers >= 1000) followerScore = 12;
  else if (c.followers > 500000) followerScore = 10;

  const absScore = Math.min(Math.log10(avg + 1) * 7, 15);
  const qualityScore = c.followers >= 5000 && er >= 0.1 ? 15 : c.followers >= 1000 && er >= 0.05 ? 10 : 5;

  return engScore + consistScore + followerScore + absScore + qualityScore;
}

async function search(
  query: string,
  lang: "ja" | "en",
  candidates: Map<string, Candidate>
): Promise<void> {
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
        if (existing.sampleTweets.length < 3) {
          existing.sampleTweets.push(tweet.text.slice(0, 100));
        }
      } else {
        const um = user.public_metrics;
        candidates.set(key, {
          username: user.username,
          name: user.name,
          followers: um?.followers_count ?? 0,
          description: (user.description ?? "").slice(0, 200),
          totalLikes: m.like_count,
          totalRTs: m.retweet_count,
          totalReplies: m.reply_count,
          tweetsFound: 1,
          sampleTweets: [tweet.text.slice(0, 100)],
          lang,
        });
      }
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`  FAILED: ${msg.slice(0, 80)}`);
  }
}

async function main() {
  const dataPath = path.join(
    path.dirname(new URL(import.meta.url).pathname),
    "../data/airdrop-influencers.json"
  );
  const existing = JSON.parse(await fs.readFile(dataPath, "utf-8"));

  // Collect existing usernames to track overlap
  const existingJa = new Set(
    (existing.japanese ?? []).map((c: { username: string }) => c.username.toLowerCase())
  );
  const existingEn = new Set(
    (existing.international ?? []).map((c: { username: string }) => c.username.toLowerCase())
  );

  const candidates = new Map<string, Candidate>();
  const allQueries = [
    ...JA_EXTRA.map((q) => ({ q, lang: "ja" as const })),
    ...EN_EXTRA.map((q) => ({ q, lang: "en" as const })),
  ];

  console.log(`[Supplement] Running ${allQueries.length} additional queries...\n`);

  for (let i = 0; i < allQueries.length; i++) {
    const { q, lang } = allQueries[i];
    process.stdout.write(`  ${i + 1}/${allQueries.length}: ${q.slice(0, 55)}... `);
    await search(q, lang, candidates);
    console.log(`(${candidates.size} new candidates)`);
    await new Promise((r) => setTimeout(r, 1500));
  }

  // Score and filter new candidates
  const newJa = [...candidates.values()]
    .filter((c) => c.lang === "ja" && !existingJa.has(c.username.toLowerCase()))
    .map((c) => ({ ...c, alphaScore: score(c) }))
    .filter((c) => c.alphaScore > 0)
    .sort((a, b) => b.alphaScore - a.alphaScore);

  const newEn = [...candidates.values()]
    .filter((c) => c.lang === "en" && !existingEn.has(c.username.toLowerCase()))
    .map((c) => ({ ...c, alphaScore: score(c) }))
    .filter((c) => c.alphaScore > 0)
    .sort((a, b) => b.alphaScore - a.alphaScore);

  const jaNeeded = Math.max(0, 20 - (existing.japanese?.length ?? 0));
  const enNeeded = Math.max(0, 30 - (existing.international?.length ?? 0));

  const jaAdd = newJa.slice(0, jaNeeded);
  const enAdd = newEn.slice(0, enNeeded);

  console.log(`\n[Supplement] New unique candidates: ${newJa.length} JP, ${newEn.length} EN`);
  console.log(`[Supplement] Adding: ${jaAdd.length} JP, ${enAdd.length} EN`);

  if (jaAdd.length > 0) {
    console.log("\n--- New Japanese Influencers ---");
    for (const c of jaAdd) {
      const fStr = c.followers >= 1000 ? `${(c.followers / 1000).toFixed(1)}K` : String(c.followers);
      console.log(`  @${c.username.padEnd(22)} Followers: ${fStr.padStart(8)} | Alpha: ${c.alphaScore.toFixed(1)}`);
    }
  }

  if (enAdd.length > 0) {
    console.log("\n--- New International Influencers ---");
    for (const c of enAdd) {
      const fStr = c.followers >= 1000000 ? `${(c.followers / 1000000).toFixed(1)}M` :
        c.followers >= 1000 ? `${(c.followers / 1000).toFixed(1)}K` : String(c.followers);
      console.log(`  @${c.username.padEnd(22)} Followers: ${fStr.padStart(8)} | Alpha: ${c.alphaScore.toFixed(1)}`);
    }
  }

  // Merge
  const format = (c: Candidate & { alphaScore: number }) => {
    const total = c.totalLikes + c.totalRTs + c.totalReplies;
    const avg = c.tweetsFound > 0 ? total / c.tweetsFound : 0;
    const er = c.followers > 0 ? (avg / c.followers) * 100 : 0;
    return {
      username: c.username,
      name: c.name,
      followers: c.followers,
      alphaScore: Math.round(c.alphaScore * 10) / 10,
      engagementRate: `${er.toFixed(2)}%`,
      avgEngagement: Math.round(avg),
      tweetsFound: c.tweetsFound,
      description: c.description,
      sampleTweets: c.sampleTweets,
    };
  };

  const finalJa = [...(existing.japanese ?? []), ...jaAdd.map(format)];
  const finalEn = [...(existing.international ?? []), ...enAdd.map(format)];

  const output = {
    generatedAt: new Date().toISOString(),
    scoringVersion: "v2",
    notes: "Supplemented with additional queries to reach 50 target",
    totalQueriesUsed: (existing.totalQueriesUsed ?? 15) + allQueries.length,
    japanese: finalJa,
    international: finalEn,
  };

  await fs.writeFile(dataPath, JSON.stringify(output, null, 2));
  console.log(`\n[Supplement] Final total: ${finalJa.length} JP + ${finalEn.length} EN = ${finalJa.length + finalEn.length}`);
}

main();
