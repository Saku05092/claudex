/**
 * Content Pipeline CLI
 *
 * Usage:
 *   npx tsx scripts/content-pipeline.ts generate <pattern> [topic]
 *   npx tsx scripts/content-pipeline.ts list
 *   npx tsx scripts/content-pipeline.ts approve <id>
 *   npx tsx scripts/content-pipeline.ts reject <id>
 *   npx tsx scripts/content-pipeline.ts post <id>
 *   npx tsx scripts/content-pipeline.ts post-all
 *   npx tsx scripts/content-pipeline.ts auto <pattern> [topic]
 *
 * Patterns: personal_experience, educational_mini, alpha_roundup, comparison, deadline_urgency, news
 */
import "dotenv/config";
import {
  createContentPipeline,
  type ContentDraft,
  type PipelineConfig,
} from "../src/core/content-pipeline.js";
import type { PostResult } from "../src/core/multi-poster.js";
import type { TweetPattern } from "../src/core/airdrop-tweet-patterns.js";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function loadConfig(): PipelineConfig {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicApiKey) {
    console.error("[Error] ANTHROPIC_API_KEY not set in .env");
    process.exit(1);
  }

  const twitterConfig =
    process.env.TWITTER_API_KEY &&
    process.env.TWITTER_API_SECRET &&
    process.env.TWITTER_ACCESS_TOKEN &&
    process.env.TWITTER_ACCESS_TOKEN_SECRET
      ? {
          apiKey: process.env.TWITTER_API_KEY,
          apiSecret: process.env.TWITTER_API_SECRET,
          accessToken: process.env.TWITTER_ACCESS_TOKEN,
          accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
        }
      : undefined;

  return { anthropicApiKey, twitterConfig };
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

function printDraft(draft: ContentDraft): void {
  console.log(`  ID:       ${draft.id}`);
  console.log(`  Status:   ${draft.status}`);
  console.log(`  Category: ${draft.category}`);
  console.log(`  Language: ${draft.language}`);
  console.log(`  Platforms: ${draft.platforms.join(", ")}`);
  if (draft.referralLink) {
    console.log(`  Referral: ${draft.referralLink}`);
  }
  console.log(`  Created:  ${draft.createdAt}`);
  console.log(`  ${"─".repeat(50)}`);
  console.log(`  ${draft.text}`);
  console.log(`  ${"─".repeat(50)}`);
  console.log(`  [${draft.text.length} chars]`);
}

function printResults(results: readonly PostResult[]): void {
  for (const result of results) {
    if (result.success) {
      console.log(`  [OK] ${result.platform}: ${result.url ?? result.postId}`);
    } else {
      console.log(`  [FAIL] ${result.platform}: ${result.error}`);
    }
  }
}

function printUsage(): void {
  console.log(`
Content Pipeline CLI

Usage:
  npx tsx scripts/content-pipeline.ts generate <pattern> [topic]
  npx tsx scripts/content-pipeline.ts list
  npx tsx scripts/content-pipeline.ts approve <id>
  npx tsx scripts/content-pipeline.ts reject <id>
  npx tsx scripts/content-pipeline.ts post <id>
  npx tsx scripts/content-pipeline.ts post-all
  npx tsx scripts/content-pipeline.ts auto <pattern> [topic]

Patterns:
  personal_experience  - Share genuine first-hand experience
  educational_mini     - Short educational content
  alpha_roundup        - Weekly opportunity summary
  comparison           - Compare similar projects
  deadline_urgency     - Alert about approaching deadlines
  news                 - General news-style tweet
`);
}

// ---------------------------------------------------------------------------
// Valid patterns
// ---------------------------------------------------------------------------

const VALID_PATTERNS: readonly string[] = [
  "personal_experience",
  "educational_mini",
  "alpha_roundup",
  "comparison",
  "deadline_urgency",
  "news",
];

function validatePattern(pattern: string): TweetPattern | "news" {
  if (!VALID_PATTERNS.includes(pattern)) {
    console.error(
      `[Error] Invalid pattern: "${pattern}". Valid patterns: ${VALID_PATTERNS.join(", ")}`
    );
    process.exit(1);
  }
  return pattern as TweetPattern | "news";
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function cmdGenerate(
  pipeline: ReturnType<typeof createContentPipeline>,
  args: readonly string[]
): Promise<void> {
  const patternArg = args[0];
  if (!patternArg) {
    console.error("[Error] Pattern required. Usage: generate <pattern> [topic]");
    process.exit(1);
  }

  const pattern = validatePattern(patternArg);
  const topic = args.slice(1).join(" ") || "DeFi general topic";

  console.log(`\nGenerating draft with pattern: ${pattern}`);
  console.log(`Topic: ${topic}\n`);

  const draft = await pipeline.generateDraft(topic, pattern);

  console.log("[OK] Draft created:\n");
  printDraft(draft);
}

function cmdList(
  pipeline: ReturnType<typeof createContentPipeline>
): void {
  const drafts = pipeline.listDrafts();

  if (drafts.length === 0) {
    console.log("\nNo pending drafts found.");
    return;
  }

  console.log(`\n${drafts.length} draft(s) found:\n`);
  for (const draft of drafts) {
    printDraft(draft);
    console.log("");
  }
}

function cmdApprove(
  pipeline: ReturnType<typeof createContentPipeline>,
  draftId: string
): void {
  if (!draftId) {
    console.error("[Error] Draft ID required. Usage: approve <id>");
    process.exit(1);
  }

  const draft = pipeline.approveDraft(draftId);
  console.log(`\n[OK] Draft approved: ${draft.id}`);
  printDraft(draft);
}

function cmdReject(
  pipeline: ReturnType<typeof createContentPipeline>,
  draftId: string
): void {
  if (!draftId) {
    console.error("[Error] Draft ID required. Usage: reject <id>");
    process.exit(1);
  }

  const draft = pipeline.rejectDraft(draftId);
  console.log(`\n[OK] Draft rejected: ${draft.id}`);
}

async function cmdPost(
  pipeline: ReturnType<typeof createContentPipeline>,
  draftId: string
): Promise<void> {
  if (!draftId) {
    console.error("[Error] Draft ID required. Usage: post <id>");
    process.exit(1);
  }

  console.log(`\nPosting draft: ${draftId}`);

  const { draft, results } = await pipeline.postDraft(draftId);

  console.log(`\nDraft status: ${draft.status}`);
  printResults(results);
}

async function cmdPostAll(
  pipeline: ReturnType<typeof createContentPipeline>
): Promise<void> {
  console.log("\nPosting all approved drafts...\n");

  const outcomes = await pipeline.postApproved();

  if (outcomes.length === 0) {
    console.log("No approved drafts to post.");
    return;
  }

  for (const { draft, results } of outcomes) {
    console.log(`Draft ${draft.id} (${draft.status}):`);
    printResults(results);
    console.log("");
  }

  console.log(`${outcomes.length} draft(s) processed.`);
}

async function cmdAuto(
  pipeline: ReturnType<typeof createContentPipeline>,
  args: readonly string[]
): Promise<void> {
  const patternArg = args[0];
  if (!patternArg) {
    console.error("[Error] Pattern required. Usage: auto <pattern> [topic]");
    process.exit(1);
  }

  const pattern = validatePattern(patternArg);
  const topic = args.slice(1).join(" ") || "DeFi general topic";

  console.log(`\n[auto] Generating draft with pattern: ${pattern}`);
  console.log(`[auto] Topic: ${topic}\n`);

  const draft = await pipeline.generateDraft(topic, pattern);
  console.log("[auto] Draft generated:");
  printDraft(draft);

  console.log("\n[auto] Approving...");
  pipeline.approveDraft(draft.id);

  console.log("[auto] Posting...\n");
  const { draft: posted, results } = await pipeline.postDraft(draft.id);

  console.log(`[auto] Final status: ${posted.status}`);
  printResults(results);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "--help" || command === "-h") {
    printUsage();
    process.exit(0);
  }

  const config = loadConfig();
  const pipeline = createContentPipeline(config);

  switch (command) {
    case "generate":
      await cmdGenerate(pipeline, args.slice(1));
      break;
    case "list":
      cmdList(pipeline);
      break;
    case "approve":
      cmdApprove(pipeline, args[1]);
      break;
    case "reject":
      cmdReject(pipeline, args[1]);
      break;
    case "post":
      await cmdPost(pipeline, args[1]);
      break;
    case "post-all":
      await cmdPostAll(pipeline);
      break;
    case "auto":
      await cmdAuto(pipeline, args.slice(1));
      break;
    default:
      console.error(`[Error] Unknown command: ${command}`);
      printUsage();
      process.exit(1);
  }
}

main().catch((error) => {
  console.error("[Fatal]", error);
  process.exit(1);
});
