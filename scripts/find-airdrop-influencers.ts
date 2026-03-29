/**
 * Find Airdrop Influencers via X API
 *
 * Searches for high-engagement airdrop tweets and ranks authors
 * by engagement metrics to identify alpha-providing influencers.
 *
 * Target: ~50 influencers (20 Japanese, 30 International)
 * Estimated credit cost: ~$0.75-1.00
 *
 * Usage: npx tsx scripts/find-airdrop-influencers.ts
 */
import "dotenv/config";
import { TwitterApi } from "twitter-api-v2";
import fs from "fs/promises";
import path from "path";

const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

if (!BEARER_TOKEN) {
  console.error("TWITTER_BEARER_TOKEN is not set in .env");
  process.exit(1);
}

const client = new TwitterApi(BEARER_TOKEN);

// Search queries: Japanese airdrop alpha
const JA_QUERIES = [
  "エアドロ alpha -is:retweet lang:ja",
  "airdrop 確定 -is:retweet lang:ja",
  "エアドロップ 案件 -is:retweet lang:ja",
  "airdrop リファ -is:retweet lang:ja",
  "TGE エアドロ -is:retweet lang:ja",
  "エアドロ 速報 -is:retweet lang:ja",
  "DeFi 新規 airdrop -is:retweet lang:ja",
];

// Search queries: International airdrop alpha
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

interface InfluencerCandidate {
  readonly userId: string;
  readonly username: string;
  readonly name: string;
  readonly followers: number;
  readonly following: number;
  readonly tweetCount: number;
  readonly verified: boolean;
  readonly description: string;
  readonly lang: "ja" | "en";
  // Aggregated from tweets found
  totalLikes: number;
  totalRTs: number;
  totalReplies: number;
  tweetsFound: number;
  sampleTweets: string[];
  avgEngagement: number;
  engagementRate: number;
  alphaScore: number;
}

async function searchAndCollect(
  query: string,
  lang: "ja" | "en",
  candidates: Map<string, InfluencerCandidate>
): Promise<void> {
  try {
    const result = await client.v2.search(query, {
      max_results: 100,
      "tweet.fields": ["created_at", "public_metrics", "author_id"],
      expansions: ["author_id"],
      "user.fields": [
        "username",
        "name",
        "public_metrics",
        "description",
        "verified",
      ],
    });

    const tweets = result.data?.data ?? [];
    const users = result.includes?.users ?? [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    for (const tweet of tweets) {
      const user = userMap.get(tweet.author_id ?? "");
      if (!user) continue;

      const metrics = tweet.public_metrics;
      if (!metrics) continue;

      const totalEngagement =
        metrics.like_count + metrics.retweet_count + metrics.reply_count;

      const existing = candidates.get(user.id);
      if (existing) {
        existing.totalLikes += metrics.like_count;
        existing.totalRTs += metrics.retweet_count;
        existing.totalReplies += metrics.reply_count;
        existing.tweetsFound += 1;
        if (existing.sampleTweets.length < 3) {
          existing.sampleTweets.push(tweet.text.slice(0, 100));
        }
      } else {
        const userMetrics = user.public_metrics;
        const followers = userMetrics?.followers_count ?? 0;

        candidates.set(user.id, {
          userId: user.id,
          username: user.username,
          name: user.name,
          followers,
          following: userMetrics?.following_count ?? 0,
          tweetCount: userMetrics?.tweet_count ?? 0,
          verified: user.verified ?? false,
          description: (user.description ?? "").slice(0, 200),
          lang,
          totalLikes: metrics.like_count,
          totalRTs: metrics.retweet_count,
          totalReplies: metrics.reply_count,
          tweetsFound: 1,
          sampleTweets: [tweet.text.slice(0, 100)],
          avgEngagement: 0,
          engagementRate: 0,
          alphaScore: 0,
        });
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`  Query failed: "${query.slice(0, 40)}..." - ${message}`);
  }
}

function calculateAlphaScore(c: InfluencerCandidate): number {
  const totalEngagement = c.totalLikes + c.totalRTs + c.totalReplies;
  c.avgEngagement = c.tweetsFound > 0 ? totalEngagement / c.tweetsFound : 0;
  c.engagementRate =
    c.followers > 0 ? (c.avgEngagement / c.followers) * 100 : 0;

  // Alpha Score formula:
  // - High engagement rate = likely provides valuable info
  // - Multiple tweets found = consistently talks about airdrops
  // - Moderate follower count (1K-500K) = not too big, not too small
  // - High RT ratio = people share their info (alpha signal)

  const engagementScore = Math.min(c.engagementRate * 10, 30);
  const consistencyScore = Math.min(c.tweetsFound * 5, 20);
  const rtRatio =
    totalEngagement > 0 ? c.totalRTs / totalEngagement : 0;
  const rtScore = rtRatio * 20;

  // Follower sweet spot: 1K-500K (penalize very small or very large)
  let followerScore = 0;
  if (c.followers >= 1000 && c.followers <= 500000) {
    followerScore = 15;
  } else if (c.followers >= 500 && c.followers < 1000) {
    followerScore = 8;
  } else if (c.followers > 500000) {
    followerScore = 10;
  } else {
    followerScore = 2;
  }

  // Absolute engagement bonus
  const absEngagementScore = Math.min(
    Math.log10(totalEngagement + 1) * 5,
    15
  );

  c.alphaScore =
    engagementScore +
    consistencyScore +
    rtScore +
    followerScore +
    absEngagementScore;

  return c.alphaScore;
}

async function main() {
  const candidates = new Map<string, InfluencerCandidate>();
  let queryCount = 0;

  // Japanese queries
  console.log("[Influencer Finder] Searching Japanese airdrop tweets...");
  for (const query of JA_QUERIES) {
    process.stdout.write(`  Query ${queryCount + 1}/${JA_QUERIES.length + EN_QUERIES.length}: `);
    process.stdout.write(`${query.slice(0, 50)}... `);
    await searchAndCollect(query, "ja", candidates);
    queryCount++;
    console.log(`(${candidates.size} candidates total)`);
    // Rate limit: 1 request per second
    await new Promise((r) => setTimeout(r, 1500));
  }

  // English queries
  console.log("[Influencer Finder] Searching English airdrop tweets...");
  for (const query of EN_QUERIES) {
    process.stdout.write(`  Query ${queryCount + 1}/${JA_QUERIES.length + EN_QUERIES.length}: `);
    process.stdout.write(`${query.slice(0, 50)}... `);
    await searchAndCollect(query, "en", candidates);
    queryCount++;
    console.log(`(${candidates.size} candidates total)`);
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log(
    `\n[Influencer Finder] Total queries: ${queryCount} (~$${(queryCount * 0.05).toFixed(2)} estimated)`
  );
  console.log(
    `[Influencer Finder] Total unique candidates: ${candidates.size}`
  );

  // Calculate alpha scores
  for (const candidate of candidates.values()) {
    calculateAlphaScore(candidate);
  }

  // Sort by alpha score
  const allCandidates = [...candidates.values()].sort(
    (a, b) => b.alphaScore - a.alphaScore
  );

  // Select top 20 Japanese + top 30 English
  const jaCandidates = allCandidates.filter((c) => c.lang === "ja");
  const enCandidates = allCandidates.filter((c) => c.lang === "en");

  const topJa = jaCandidates.slice(0, 20);
  const topEn = enCandidates.slice(0, 30);
  const finalList = [...topJa, ...topEn];

  // Print results
  console.log("\n=== TOP JAPANESE AIRDROP INFLUENCERS ===\n");
  printTable(topJa);

  console.log("\n=== TOP INTERNATIONAL AIRDROP INFLUENCERS ===\n");
  printTable(topEn);

  // Save to file
  const outputPath = path.join(
    path.dirname(new URL(import.meta.url).pathname),
    "../data/airdrop-influencers.json"
  );

  const output = {
    generatedAt: new Date().toISOString(),
    queriesUsed: queryCount,
    estimatedCost: `$${(queryCount * 0.05).toFixed(2)}`,
    totalCandidatesScanned: candidates.size,
    japanese: topJa.map(formatForExport),
    international: topEn.map(formatForExport),
  };

  await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
  console.log(`\n[Influencer Finder] Saved to ${outputPath}`);
}

function formatForExport(c: InfluencerCandidate) {
  return {
    username: c.username,
    name: c.name,
    followers: c.followers,
    alphaScore: Math.round(c.alphaScore * 10) / 10,
    engagementRate: `${c.engagementRate.toFixed(2)}%`,
    avgEngagement: Math.round(c.avgEngagement),
    tweetsFound: c.tweetsFound,
    description: c.description,
    sampleTweets: c.sampleTweets,
  };
}

function printTable(list: readonly InfluencerCandidate[]): void {
  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    console.log(
      `${String(i + 1).padStart(2)}. @${c.username.padEnd(20)} ` +
        `Followers: ${formatNumber(c.followers).padStart(8)} | ` +
        `Alpha: ${c.alphaScore.toFixed(1).padStart(5)} | ` +
        `ER: ${c.engagementRate.toFixed(2).padStart(6)}% | ` +
        `Tweets: ${c.tweetsFound}`
    );
  }
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

main();
