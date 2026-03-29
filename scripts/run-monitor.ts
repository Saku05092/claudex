/**
 * CLI for running the X monitoring system.
 *
 * Usage:
 *   npx tsx scripts/run-monitor.ts --keyword          # Daily keyword search
 *   npx tsx scripts/run-monitor.ts --influencer        # Bi-monthly influencer search
 *   npx tsx scripts/run-monitor.ts --both              # Both
 *   npx tsx scripts/run-monitor.ts --keyword --max=20  # Custom max results
 */
import "dotenv/config";
import { createDatabase } from "../src/core/database.js";
import { createTwitterSearchClient } from "../src/monitoring/twitter-search.js";
import { createTweetRepository } from "../src/monitoring/tweet-repository.js";
import { createMonitorRunner } from "../src/monitoring/monitor-runner.js";
import type { RunResult, MonitorConfig } from "../src/monitoring/types.js";

const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
if (!BEARER_TOKEN) {
  console.error("TWITTER_BEARER_TOKEN is not set in .env");
  process.exit(1);
}

const args = process.argv.slice(2);
const runKeyword = args.includes("--keyword") || args.includes("--both");
const runInfluencer = args.includes("--influencer") || args.includes("--both");
const maxArg = args.find((a) => a.startsWith("--max="));
const maxResults = maxArg ? parseInt(maxArg.split("=")[1], 10) : 10;

if (!runKeyword && !runInfluencer) {
  console.log("Usage:");
  console.log("  npx tsx scripts/run-monitor.ts --keyword");
  console.log("  npx tsx scripts/run-monitor.ts --influencer");
  console.log("  npx tsx scripts/run-monitor.ts --both");
  console.log("  npx tsx scripts/run-monitor.ts --keyword --max=20");
  process.exit(0);
}

async function main() {
  const db = createDatabase();
  const searchClient = createTwitterSearchClient(BEARER_TOKEN!);
  const repository = createTweetRepository(db);

  const config: MonitorConfig = {
    maxResults,
    enabled: true,
    bearerToken: BEARER_TOKEN!,
  };

  const runner = createMonitorRunner({ searchClient, repository, config });
  const results: RunResult[] = [];

  console.log(`[Monitor CLI] Max results per query: ${maxResults}`);
  console.log();

  if (runKeyword) {
    const result = await runner.runKeywordSearch();
    results.push(result);
    console.log();
  }

  if (runInfluencer) {
    const result = await runner.runInfluencerSearch();
    results.push(result);
    console.log();
  }

  // Summary
  console.log("=== MONITORING SUMMARY ===");
  for (const r of results) {
    console.log(
      `  ${r.runType.padEnd(12)} | Queries: ${r.queriesExecuted} | ` +
        `Found: ${r.tweetsFound} | New: ${r.tweetsNew} | ` +
        `Est. cost: $${r.estimatedCreditsUsed.toFixed(3)}`
    );
  }

  const totalCost = results.reduce((s, r) => s + r.estimatedCreditsUsed, 0);
  const totalNew = results.reduce((s, r) => s + r.tweetsNew, 0);
  const totalInDb = repository.getTweetCount();

  console.log();
  console.log(`  Total new tweets saved: ${totalNew}`);
  console.log(`  Total tweets in DB: ${totalInDb}`);
  console.log(`  Estimated total cost: $${totalCost.toFixed(3)}`);

  db.close();
}

main().catch((error) => {
  console.error("[Monitor CLI] Fatal error:", error);
  process.exit(1);
});
