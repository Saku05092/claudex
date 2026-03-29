/**
 * CLI for running the airdrop discovery pipeline.
 *
 * Usage:
 *   npx tsx scripts/run-discovery.ts --tweet        # Tweet-based discovery
 *   npx tsx scripts/run-discovery.ts --defilama     # DeFiLlama discovery
 *   npx tsx scripts/run-discovery.ts --all          # Both
 *   npx tsx scripts/run-discovery.ts --all --max=3  # Limit evaluations
 */
import "dotenv/config";
import { createDatabase } from "../src/core/database.js";
import { createCampaignRepository } from "../src/discovery/campaign-repository.js";
import { createDiscoveryPipeline, type DiscoveryResult } from "../src/discovery/discovery-pipeline.js";
import { CAMPAIGNS } from "../src/api/data.js";

const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!CLAUDE_API_KEY) {
  console.error("ANTHROPIC_API_KEY is not set in .env");
  process.exit(1);
}

const args = process.argv.slice(2);
const runTweet = args.includes("--tweet") || args.includes("--all");
const runDefiLlama = args.includes("--defilama") || args.includes("--all");
const maxArg = args.find((a) => a.startsWith("--max="));
const maxNew = maxArg ? parseInt(maxArg.split("=")[1], 10) : 5;

if (!runTweet && !runDefiLlama) {
  console.log("Usage:");
  console.log("  npx tsx scripts/run-discovery.ts --tweet");
  console.log("  npx tsx scripts/run-discovery.ts --defilama");
  console.log("  npx tsx scripts/run-discovery.ts --all");
  console.log("  npx tsx scripts/run-discovery.ts --all --max=3");
  process.exit(0);
}

async function main() {
  const db = createDatabase();

  // Seed existing campaigns into DB (idempotent)
  const repo = createCampaignRepository(db);
  const seeded = repo.seedFromArray(CAMPAIGNS);
  if (seeded > 0) {
    console.log(`[Discovery] Seeded ${seeded} existing campaigns into DB`);
  }
  console.log(`[Discovery] Current campaigns in DB: ${repo.getCount()}`);
  console.log(`[Discovery] Max new campaigns per source: ${maxNew}`);
  console.log();

  const pipeline = createDiscoveryPipeline({
    db,
    claudeApiKey: CLAUDE_API_KEY,
    maxNewCampaigns: maxNew,
  });

  const results: DiscoveryResult[] = [];

  if (runTweet) {
    results.push(await pipeline.runTweetDiscovery());
    console.log();
  }

  if (runDefiLlama) {
    results.push(await pipeline.runDeFiLlamaDiscovery());
    console.log();
  }

  // Summary
  console.log("=== DISCOVERY SUMMARY ===");
  for (const r of results) {
    console.log(`\n  [${r.mode}] Evaluated: ${r.evaluated} | Registered: ${r.registered} | Skipped: ${r.skipped}`);
    for (const c of r.campaigns) {
      const icon = c.action === "registered" ? "+" : c.action === "exists" ? "=" : "-";
      console.log(`    ${icon} ${c.name}: ${c.reason}`);
    }
  }

  const totalRegistered = results.reduce((s, r) => s + r.registered, 0);
  console.log(`\n  Total new campaigns: ${totalRegistered}`);
  console.log(`  Total campaigns in DB: ${repo.getCount()}`);

  db.close();
}

main().catch((error) => {
  console.error("[Discovery] Fatal error:", error);
  process.exit(1);
});
