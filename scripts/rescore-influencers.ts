/**
 * Re-score airdrop influencers from existing data.
 * No API calls - just recalculates alpha scores with improved logic.
 *
 * Changes from v1:
 * - Minimum 1,000 followers (removes spam/micro accounts)
 * - Consistency bonus: tweetsFound >= 2 gets significant boost
 * - Penalize one-hit wonders more heavily
 * - Better follower sweet spot weighting
 */
import fs from "fs/promises";
import path from "path";

interface RawInfluencer {
  username: string;
  name: string;
  followers: number;
  alphaScore: number;
  engagementRate: string;
  avgEngagement: number;
  tweetsFound: number;
  description: string;
  sampleTweets: string[];
}

interface ScoredInfluencer extends RawInfluencer {
  newAlphaScore: number;
  newEngagementRate: string;
}

function rescore(c: RawInfluencer): number {
  // Filter: minimum 1,000 followers
  if (c.followers < 1000) return -1;

  const er = parseFloat(c.engagementRate);

  // 1. Engagement Rate Score (max 25)
  //    Cap at reasonable levels to avoid micro-account inflation
  const engScore = Math.min(er * 8, 25);

  // 2. Consistency Score (max 25) - much higher weight
  //    tweetsFound >= 2 = consistently posting airdrop content
  let consistScore = 0;
  if (c.tweetsFound >= 5) consistScore = 25;
  else if (c.tweetsFound >= 3) consistScore = 20;
  else if (c.tweetsFound >= 2) consistScore = 15;
  else consistScore = 3; // one-hit wonders get minimal score

  // 3. Follower Tier Score (max 20)
  let followerScore = 0;
  if (c.followers >= 50000 && c.followers <= 500000) followerScore = 20; // big but not mega
  else if (c.followers >= 10000 && c.followers < 50000) followerScore = 18;
  else if (c.followers >= 5000 && c.followers < 10000) followerScore = 15;
  else if (c.followers >= 1000 && c.followers < 5000) followerScore = 12;
  else if (c.followers > 500000) followerScore = 10; // mega accounts less likely alpha

  // 4. Absolute Engagement Score (max 15)
  const absScore = Math.min(Math.log10(c.avgEngagement + 1) * 7, 15);

  // 5. Quality Signal Score (max 15)
  //    High followers + decent ER = genuine authority
  const qualityScore =
    c.followers >= 5000 && er >= 0.1
      ? 15
      : c.followers >= 1000 && er >= 0.05
        ? 10
        : 5;

  return engScore + consistScore + followerScore + absScore + qualityScore;
}

async function main() {
  const dataPath = path.join(
    path.dirname(new URL(import.meta.url).pathname),
    "../data/airdrop-influencers.json"
  );

  const data = JSON.parse(await fs.readFile(dataPath, "utf-8"));
  const jaRaw: RawInfluencer[] = data.japanese;
  const enRaw: RawInfluencer[] = data.international;

  console.log(`[Re-score] Input: ${jaRaw.length} JP, ${enRaw.length} EN`);

  // Re-score and filter
  const jaScored = jaRaw
    .map((c) => ({ ...c, newAlphaScore: rescore(c) }))
    .filter((c) => c.newAlphaScore > 0)
    .sort((a, b) => b.newAlphaScore - a.newAlphaScore);

  const enScored = enRaw
    .map((c) => ({ ...c, newAlphaScore: rescore(c) }))
    .filter((c) => c.newAlphaScore > 0)
    .sort((a, b) => b.newAlphaScore - a.newAlphaScore);

  console.log(`[Re-score] After filter (>=1K followers): ${jaScored.length} JP, ${enScored.length} EN`);

  // Print JP
  console.log("\n=== JAPANESE AIRDROP INFLUENCERS (Re-scored) ===\n");
  printTable(jaScored);

  // Print EN
  console.log("\n=== INTERNATIONAL AIRDROP INFLUENCERS (Re-scored) ===\n");
  printTable(enScored);

  // Save updated
  const output = {
    generatedAt: new Date().toISOString(),
    scoringVersion: "v2",
    notes: "Re-scored with min 1K followers, consistency bonus, quality signals",
    totalQueriesUsed: data.totalQueriesUsed ?? data.queriesUsed ?? 15,
    japanese: jaScored.map(formatExport),
    international: enScored.map(formatExport),
  };

  await fs.writeFile(dataPath, JSON.stringify(output, null, 2));
  console.log(`\n[Re-score] Saved to ${dataPath}`);
  console.log(`[Re-score] Final: ${jaScored.length} JP + ${enScored.length} EN = ${jaScored.length + enScored.length} total`);

  if (jaScored.length + enScored.length < 50) {
    const jaNeeded = Math.max(0, 20 - jaScored.length);
    const enNeeded = Math.max(0, 30 - enScored.length);
    console.log(`\n[Re-score] WARNING: Below target of 50.`);
    if (jaNeeded > 0) console.log(`  Need ${jaNeeded} more JP influencers`);
    if (enNeeded > 0) console.log(`  Need ${enNeeded} more EN influencers`);
    console.log(`  Recommendation: Run additional queries with different keywords to expand the pool.`);
  }
}

function formatExport(c: RawInfluencer & { newAlphaScore: number }) {
  return {
    username: c.username,
    name: c.name,
    followers: c.followers,
    alphaScore: Math.round(c.newAlphaScore * 10) / 10,
    engagementRate: c.engagementRate,
    avgEngagement: c.avgEngagement,
    tweetsFound: c.tweetsFound,
    description: c.description,
    sampleTweets: c.sampleTweets,
  };
}

function printTable(list: readonly (RawInfluencer & { newAlphaScore: number })[]): void {
  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    const fStr =
      c.followers >= 1000000
        ? `${(c.followers / 1000000).toFixed(1)}M`
        : c.followers >= 1000
          ? `${(c.followers / 1000).toFixed(1)}K`
          : String(c.followers);
    console.log(
      `${String(i + 1).padStart(2)}. @${c.username.padEnd(22)} ` +
        `Followers: ${fStr.padStart(8)} | ` +
        `Alpha: ${c.newAlphaScore.toFixed(1).padStart(5)} | ` +
        `ER: ${c.engagementRate.padStart(7)} | ` +
        `Tweets: ${c.tweetsFound} | ` +
        `${c.description.slice(0, 40)}`
    );
  }
}

main();
