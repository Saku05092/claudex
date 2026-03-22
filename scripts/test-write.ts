import "dotenv/config";
import { TwitterApi } from "twitter-api-v2";

async function test() {
  const key = process.env.TWITTER_API_KEY;
  const secret = process.env.TWITTER_API_SECRET;
  const token = process.env.TWITTER_ACCESS_TOKEN;
  const tokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

  if (!key || !secret || !token || !tokenSecret) {
    console.error("Missing Twitter credentials in .env");
    return;
  }

  const client = new TwitterApi({
    appKey: key,
    appSecret: secret,
    accessToken: token,
    accessSecret: tokenSecret,
  });

  // Check current access level
  try {
    const me = await client.v2.me();
    console.log("Read OK:", me.data.username);
  } catch (e: unknown) {
    const err = e as { code?: number; message?: string };
    console.log("Read result:", err.message);
  }

  // Test write
  try {
    const result = await client.v2.tweet("hello world - test");
    console.log("Write OK! Tweet ID:", result.data.id);
    await client.v2.deleteTweet(result.data.id);
    console.log("Deleted test tweet");
  } catch (e: unknown) {
    const err = e as { code?: number; data?: unknown; headers?: Record<string, string> };
    console.log("Write failed. Code:", err.code);
    console.log("Data:", JSON.stringify(err.data));
  }
}

test();
