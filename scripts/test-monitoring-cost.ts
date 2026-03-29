/**
 * Test monitoring cost: two approaches
 *
 * Test 1: Keyword search (5 queries, daily use)
 * Test 2: from: OR search (batch user timeline, monthly use)
 *
 * Check console.x.com balance before and after each test.
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

// Load influencer list
const dataPath = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  "../data/airdrop-influencers.json"
);

interface SearchResult {
  query: string;
  tweetsFound: number;
  uniqueAuthors: number;
}

async function runSearch(query: string, label: string): Promise<SearchResult> {
  try {
    const result = await client.v2.search(query, {
      max_results: 100,
      "tweet.fields": ["public_metrics", "author_id", "created_at"],
      expansions: ["author_id"],
      "user.fields": ["username"],
    });

    const tweets = result.data?.data ?? [];
    const authors = new Set(tweets.map((t) => t.author_id));

    return { query: label, tweetsFound: tweets.length, uniqueAuthors: authors.size };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { query: label, tweetsFound: -1, uniqueAuthors: 0 };
  }
}

async function test1_keywordSearch(): Promise<void> {
  console.log("=== TEST 1: Keyword Search (Daily Monitoring) ===\n");
  console.log(">>> Check your balance on console.x.com NOW before continuing <<<\n");

  const queries = [
    "エアドロ TGE 確定 -is:retweet",
    "airdrop confirmed launch -is:retweet lang:en",
    "エアドロップ 新規 リファーラル -is:retweet lang:ja",
    "crypto airdrop snapshot eligible -is:retweet lang:en",
    "DeFi airdrop farming alpha -is:retweet lang:en",
  ];

  const results: SearchResult[] = [];

  for (let i = 0; i < queries.length; i++) {
    process.stdout.write(`  Query ${i + 1}/${queries.length}: `);
    const r = await runSearch(queries[i], queries[i].slice(0, 50));
    results.push(r);
    console.log(`${r.tweetsFound} tweets, ${r.uniqueAuthors} authors`);
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  console.log(`\n  Total queries: ${queries.length}`);
  console.log(`  Total tweets: ${results.reduce((s, r) => s + Math.max(r.tweetsFound, 0), 0)}`);
  console.log(`\n>>> Check balance again. Cost = (before - after) <<<\n`);
}

async function test2_fromSearch(): Promise<void> {
  console.log("=== TEST 2: from: OR Search (Monthly Timeline) ===\n");

  const data = JSON.parse(await fs.readFile(dataPath, "utf-8"));
  const allUsers: string[] = [
    ...(data.japanese ?? []).map((c: { username: string }) => c.username),
    ...(data.international ?? []).map((c: { username: string }) => c.username),
  ];

  console.log(`  Total accounts: ${allUsers.length}`);

  // X API query limit is 512 chars, so we need to split into batches
  const batches: string[][] = [];
  let currentBatch: string[] = [];
  let currentLength = 0;

  for (const user of allUsers) {
    // "from:username OR " = username.length + 9
    const addition = `from:${user} OR `.length;
    if (currentLength + addition > 480) {
      batches.push(currentBatch);
      currentBatch = [];
      currentLength = 0;
    }
    currentBatch.push(user);
    currentLength += addition;
  }
  if (currentBatch.length > 0) batches.push(currentBatch);

  console.log(`  Batches needed: ${batches.length} (query length limit: 512 chars)`);
  console.log();

  const results: SearchResult[] = [];

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const query = batch.map((u) => `from:${u}`).join(" OR ") + " -is:retweet";

    process.stdout.write(`  Batch ${i + 1}/${batches.length} (${batch.length} users, ${query.length} chars): `);
    const r = await runSearch(query, `Batch ${i + 1}: ${batch.slice(0, 3).join(", ")}...`);
    results.push(r);
    console.log(`${r.tweetsFound} tweets, ${r.uniqueAuthors} authors`);
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  console.log(`\n  Total batches/queries: ${batches.length}`);
  console.log(`  Total tweets: ${results.reduce((s, r) => s + Math.max(r.tweetsFound, 0), 0)}`);
  console.log(`\n>>> Check balance again. Cost = (before - after) <<<\n`);
}

async function main() {
  const mode = process.argv[2] ?? "both";

  if (mode === "1" || mode === "keyword" || mode === "both") {
    await test1_keywordSearch();
  }

  if (mode === "both") {
    console.log("---------------------------------------------------");
    console.log("Pausing 3 seconds before Test 2...\n");
    await new Promise((r) => setTimeout(r, 3000));
  }

  if (mode === "2" || mode === "from" || mode === "both") {
    await test2_fromSearch();
  }

  console.log("=== DONE ===");
  console.log("Compare your console.x.com balance to calculate exact costs.");
  console.log("This will help estimate monthly monitoring budget.");
}

main();
