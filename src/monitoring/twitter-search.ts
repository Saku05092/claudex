import { TwitterApi } from "twitter-api-v2";
import type { CollectedTweet } from "./types.js";

interface SearchOptions {
  readonly maxResults: number;
  readonly sourceType: "keyword" | "influencer";
  readonly sourceQuery: string;
}

export function createTwitterSearchClient(bearerToken: string) {
  const client = new TwitterApi(bearerToken);

  async function searchRecent(
    query: string,
    options: SearchOptions
  ): Promise<readonly CollectedTweet[]> {
    const result = await client.v2.search(query, {
      max_results: options.maxResults,
      "tweet.fields": ["created_at", "public_metrics", "author_id", "lang"],
      expansions: ["author_id"],
      "user.fields": ["username", "name", "public_metrics"],
    });

    const tweets = result.data?.data ?? [];
    const users = result.includes?.users ?? [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    return tweets.map((tweet) => {
      const user = userMap.get(tweet.author_id ?? "");
      const metrics = tweet.public_metrics;

      return {
        tweetId: tweet.id,
        authorId: tweet.author_id ?? "",
        authorUsername: user?.username ?? "unknown",
        authorName: user?.name,
        authorFollowers: user?.public_metrics?.followers_count,
        text: tweet.text,
        language: tweet.lang,
        retweetCount: metrics?.retweet_count ?? 0,
        replyCount: metrics?.reply_count ?? 0,
        likeCount: metrics?.like_count ?? 0,
        quoteCount: metrics?.quote_count ?? 0,
        tweetedAt: tweet.created_at ?? new Date().toISOString(),
        sourceType: options.sourceType,
        sourceQuery: options.sourceQuery,
      };
    });
  }

  return { searchRecent };
}
