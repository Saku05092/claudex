import "dotenv/config";
import { TwitterApi } from "twitter-api-v2";

async function verify() {
  const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY!,
    appSecret: process.env.TWITTER_API_SECRET!,
    accessToken: process.env.TWITTER_ACCESS_TOKEN!,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
  });

  try {
    const me = await client.v2.me();
    console.log("[OK] Twitter API connected");
    console.log(`  Account: @${me.data.username}`);
    console.log(`  Name: ${me.data.name}`);
    console.log(`  ID: ${me.data.id}`);
  } catch (error: unknown) {
    const err = error as { code?: number; message?: string };
    console.error("[FAIL] Twitter API connection failed");
    console.error(`  Error: ${err.message ?? String(error)}`);

    if (err.code === 403) {
      console.error("  -> Free tier does not support user lookup.");
      console.error("  -> Trying tweet post test instead...");
      await testPost(client);
    }
  }
}

async function testPost(client: TwitterApi) {
  try {
    // Dry run - post and immediately delete
    const tweet = await client.v2.tweet(
      "Test post from Claudex - please ignore. Deleting shortly."
    );
    console.log(`[OK] Tweet posted successfully (ID: ${tweet.data.id})`);

    // Delete the test tweet
    await client.v2.deleteTweet(tweet.data.id);
    console.log("[OK] Test tweet deleted");
  } catch (error: unknown) {
    const err = error as { code?: number; message?: string };
    console.error(`[FAIL] Tweet post failed: ${err.message ?? String(error)}`);
  }
}

verify();
