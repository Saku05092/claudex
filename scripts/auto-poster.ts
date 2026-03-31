import "dotenv/config";
import { createAutoPoster, type AutoPosterConfig } from "../src/core/auto-poster.js";

const command = process.argv[2];

if (!command || !["start", "test", "status", "stop"].includes(command)) {
  console.log(`Usage:
  npx tsx scripts/auto-poster.ts start     # Start auto-posting daemon
  npx tsx scripts/auto-poster.ts test      # Generate + post once (for testing)
  npx tsx scripts/auto-poster.ts status    # Show today's stats
  npx tsx scripts/auto-poster.ts stop      # (sends SIGINT)`);
  process.exit(1);
}

function getConfig(): AutoPosterConfig {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

  if (!anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY not set");
  }
  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    throw new Error("Twitter API credentials not fully set (TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET)");
  }

  return {
    anthropicApiKey,
    twitterConfig: { apiKey, apiSecret, accessToken, accessTokenSecret },
    maxPostsPerDay: Number(process.env.AUTO_POSTER_MAX_POSTS ?? 5),
    activeHoursJST: [
      Number(process.env.AUTO_POSTER_START_HOUR ?? 8),
      Number(process.env.AUTO_POSTER_END_HOUR ?? 23),
    ] as [number, number],
  };
}

async function main(): Promise<void> {
  const config = getConfig();
  const poster = createAutoPoster(config);

  switch (command) {
    case "start": {
      console.log("[AutoPoster] Starting daemon...");
      poster.start();

      const status = poster.getStatus();
      console.log(`[AutoPoster] Today's posts: ${status.todayPostCount}/${status.maxPostsPerDay}`);
      console.log(`[AutoPoster] Active hours: ${status.activeHoursJST[0]}-${status.activeHoursJST[1]} JST`);
      console.log("[AutoPoster] Press Ctrl+C to stop.");

      process.on("SIGINT", () => {
        poster.stop();
        process.exit(0);
      });
      process.on("SIGTERM", () => {
        poster.stop();
        process.exit(0);
      });
      break;
    }

    case "test": {
      console.log("[AutoPoster] Generating and posting one tweet...");
      const pattern = (process.argv[3] ?? undefined) as import("../src/core/airdrop-tweet-patterns.js").TweetPattern | undefined;
      const topic = process.argv[4] ?? undefined;
      const result = await poster.generateAndPost(pattern, topic);

      if (result.success) {
        console.log(`[AutoPoster] Posted [${result.pattern}]:`);
        console.log(result.tweetText);
        console.log(`URL: ${result.postResult?.url}`);
      } else {
        console.error(`[AutoPoster] Failed: ${result.error}`);
      }
      process.exit(result.success ? 0 : 1);
      break;
    }

    case "status": {
      const status = poster.getStatus();
      console.log("=== Auto-Poster Status ===");
      console.log(`Running:        ${status.isRunning ? "Yes" : "No"}`);
      console.log(`Today's posts:  ${status.todayPostCount}/${status.maxPostsPerDay}`);
      console.log(`Active hours:   ${status.activeHoursJST[0]}-${status.activeHoursJST[1]} JST`);
      console.log(`Last post at:   ${status.lastPostAt ?? "N/A"}`);
      console.log(`Next scheduled: ${status.nextScheduledTime ?? "N/A"}`);
      process.exit(0);
      break;
    }

    case "stop": {
      console.log("[AutoPoster] Sending SIGINT to stop daemon...");
      process.kill(process.pid, "SIGINT");
      break;
    }
  }
}

main().catch((error) => {
  console.error("[AutoPoster] Fatal error:", error);
  process.exit(1);
});
