import { TwitterApi } from "twitter-api-v2";
import type { GeneratedContent } from "../core/types.js";

interface TwitterConfig {
  readonly apiKey: string;
  readonly apiSecret: string;
  readonly accessToken: string;
  readonly accessTokenSecret: string;
}

export function createTwitterClient(config: TwitterConfig) {
  const client = new TwitterApi({
    appKey: config.apiKey,
    appSecret: config.apiSecret,
    accessToken: config.accessToken,
    accessSecret: config.accessTokenSecret,
  });

  const rwClient = client.readWrite;

  async function postTweet(content: GeneratedContent): Promise<string> {
    const tweetText = formatTweetText(content);
    const result = await rwClient.v2.tweet(tweetText);
    return result.data.id;
  }

  async function postThread(
    contents: readonly GeneratedContent[]
  ): Promise<readonly string[]> {
    const tweetIds: string[] = [];
    let previousTweetId: string | undefined;

    for (const content of contents) {
      const tweetText = formatTweetText(content);
      const options = previousTweetId
        ? { reply: { in_reply_to_tweet_id: previousTweetId } }
        : {};

      const result = await rwClient.v2.tweet(tweetText, options);
      tweetIds.push(result.data.id);
      previousTweetId = result.data.id;
    }

    return tweetIds;
  }

  async function verifyCredentials(): Promise<boolean> {
    try {
      await rwClient.v2.me();
      return true;
    } catch {
      return false;
    }
  }

  return { postTweet, postThread, verifyCredentials };
}

function formatTweetText(content: GeneratedContent): string {
  const parts: string[] = [content.text];

  if (content.referralLink) {
    parts.push(`\n${content.referralLink}`);
  }

  if (content.hashtags.length > 0) {
    parts.push(`\n${content.hashtags.join(" ")}`);
  }

  // Ensure disclaimer is present
  if (!content.text.includes("DYOR") && !content.text.includes("NFA")) {
    parts.push(`\n${content.disclaimer}`);
  }

  const fullText = parts.join("");

  // Twitter limit: 280 chars
  if (fullText.length > 280) {
    return fullText.slice(0, 277) + "...";
  }

  return fullText;
}
