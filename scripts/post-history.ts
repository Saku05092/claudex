import {
  getPostHistory,
  getPostStats,
  getPostsByDate,
} from "../src/core/post-history.js";

function printUsage(): void {
  console.log(`Usage:
  npx tsx scripts/post-history.ts list [--limit=20]
  npx tsx scripts/post-history.ts stats
  npx tsx scripts/post-history.ts today`);
}

function parseLimit(args: readonly string[]): number {
  for (const arg of args) {
    const match = /^--limit=(\d+)$/.exec(arg);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  return 20;
}

function main(): void {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    printUsage();
    process.exit(1);
  }

  switch (command) {
    case "list": {
      const limit = parseLimit(args);
      const posts = getPostHistory(limit);
      if (posts.length === 0) {
        console.log("No posts recorded yet.");
        break;
      }
      console.log(`Recent posts (limit: ${limit}):\n`);
      for (const post of posts) {
        const preview = post.contentText.slice(0, 80).replace(/\n/g, " ");
        console.log(`  [${post.scheduledAt}] ${post.platform} | ${post.contentCategory}`);
        console.log(`    ${preview}${post.contentText.length > 80 ? "..." : ""}`);
        if (post.referralLink) {
          console.log(`    Referral: ${post.referralLink}`);
        }
        console.log();
      }
      break;
    }

    case "stats": {
      const stats = getPostStats();
      console.log(`Post Statistics:\n`);
      console.log(`  Total posts: ${stats.totalPosts}\n`);

      console.log("  By Platform:");
      for (const [platform, count] of Object.entries(stats.byPlatform)) {
        console.log(`    ${platform}: ${count}`);
      }

      console.log("\n  By Category:");
      for (const [category, count] of Object.entries(stats.byCategory)) {
        console.log(`    ${category}: ${count}`);
      }

      console.log("\n  By Day (last 30 days):");
      for (const [day, count] of Object.entries(stats.byDay)) {
        console.log(`    ${day}: ${count}`);
      }
      break;
    }

    case "today": {
      const today = new Date().toISOString().split("T")[0];
      const posts = getPostsByDate(today);
      if (posts.length === 0) {
        console.log(`No posts for today (${today}).`);
        break;
      }
      console.log(`Posts for ${today}:\n`);
      for (const post of posts) {
        const preview = post.contentText.slice(0, 80).replace(/\n/g, " ");
        console.log(`  [${post.scheduledAt}] ${post.platform} | ${post.contentCategory}`);
        console.log(`    ${preview}${post.contentText.length > 80 ? "..." : ""}`);
        console.log();
      }
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      printUsage();
      process.exit(1);
  }
}

main();
