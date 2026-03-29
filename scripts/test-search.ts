/**
 * X API Search Test
 *
 * Purpose: Test consumption-based search API with minimal credit usage.
 * Fetches only 10 tweets to check how many credits are consumed.
 *
 * Usage: npx tsx scripts/test-search.ts [query]
 * Default query: "airdrop crypto -is:retweet lang:ja"
 */
import "dotenv/config";
import { TwitterApi } from "twitter-api-v2";

const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

if (!BEARER_TOKEN) {
  console.error("TWITTER_BEARER_TOKEN is not set in .env");
  process.exit(1);
}

const query = process.argv[2] ?? "airdrop crypto -is:retweet lang:ja";
const maxResults = 10; // Minimum to save credits

async function main() {
  console.log(`[Search Test] Query: "${query}"`);
  console.log(`[Search Test] Max results: ${maxResults}`);
  console.log(`[Search Test] Sending request...`);
  console.log();

  const client = new TwitterApi(BEARER_TOKEN);

  try {
    const result = await client.v2.search(query, {
      max_results: maxResults,
      "tweet.fields": [
        "created_at",
        "public_metrics",
        "author_id",
        "lang",
      ],
      expansions: ["author_id"],
      "user.fields": ["username", "name", "public_metrics"],
    });

    const tweets = result.data?.data ?? [];
    const users = result.includes?.users ?? [];

    console.log(`[Search Test] Results: ${tweets.length} tweets found`);
    console.log();

    // Build user lookup map
    const userMap = new Map(users.map((u) => [u.id, u]));

    for (const tweet of tweets) {
      const user = userMap.get(tweet.author_id ?? "");
      const metrics = tweet.public_metrics;
      console.log("---");
      console.log(`@${user?.username ?? "unknown"} (${user?.name ?? ""})`);
      console.log(`  ${tweet.text.slice(0, 120)}${tweet.text.length > 120 ? "..." : ""}`);
      console.log(`  ${tweet.created_at}`);
      if (metrics) {
        console.log(
          `  Likes: ${metrics.like_count} | RT: ${metrics.retweet_count} | Replies: ${metrics.reply_count}`
        );
      }
    }

    console.log();
    console.log("[Search Test] Done. Check console.x.com for credit consumption.");
    console.log("[Search Test] Compare your balance before/after to see the cost.");
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("[Search Test] Error:", error.message);
      if ("data" in error) {
        console.error("[Search Test] API Response:", JSON.stringify((error as { data: unknown }).data, null, 2));
      }
    } else {
      console.error("[Search Test] Error:", error);
    }
    process.exit(1);
  }
}

main();
