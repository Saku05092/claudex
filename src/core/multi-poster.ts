import { TwitterApi } from "twitter-api-v2";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PostResult {
  readonly platform: string;
  readonly success: boolean;
  readonly postId?: string;
  readonly url?: string;
  readonly error?: string;
}

export interface TwitterConfig {
  readonly apiKey: string;
  readonly apiSecret: string;
  readonly accessToken: string;
  readonly accessTokenSecret: string;
}

export interface MultiPostConfig {
  readonly twitter?: TwitterConfig;
}

// ---------------------------------------------------------------------------
// Disclaimers
// ---------------------------------------------------------------------------

const DYOR_MARKERS = ["DYOR", "NFA", "Do Your Own Research"] as const;

function ensureDisclaimer(text: string): string {
  const hasDisclaimer = DYOR_MARKERS.some((marker) => text.includes(marker));
  if (hasDisclaimer) {
    return text;
  }
  return `${text}\n\nDYOR/NFA`;
}

// ---------------------------------------------------------------------------
// Platform posters
// ---------------------------------------------------------------------------

export async function postToTwitter(
  text: string,
  config: TwitterConfig
): Promise<PostResult> {
  try {
    const client = new TwitterApi({
      appKey: config.apiKey,
      appSecret: config.apiSecret,
      accessToken: config.accessToken,
      accessSecret: config.accessTokenSecret,
    });

    const tweetText =
      text.length > 280 ? `${text.slice(0, 277)}...` : text;

    const result = await client.readWrite.v2.tweet(tweetText);
    const tweetId = result.data.id;

    return {
      platform: "twitter",
      success: true,
      postId: tweetId,
      url: `https://x.com/i/status/${tweetId}`,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    return {
      platform: "twitter",
      success: false,
      error: message,
    };
  }
}

// ---------------------------------------------------------------------------
// Multi-platform posting
// ---------------------------------------------------------------------------

export async function postToAll(
  text: string,
  platforms: readonly string[],
  config: MultiPostConfig
): Promise<readonly PostResult[]> {
  const textWithDisclaimer = ensureDisclaimer(text);
  const results: PostResult[] = [];

  const postPromises = platforms.map(async (platform) => {
    switch (platform) {
      case "twitter": {
        if (!config.twitter) {
          return {
            platform: "twitter",
            success: false,
            error: "Twitter config not provided",
          } satisfies PostResult;
        }
        return postToTwitter(textWithDisclaimer, config.twitter);
      }
      case "telegram": {
        return {
          platform: "telegram",
          success: false,
          error: "Telegram posting not yet implemented",
        } satisfies PostResult;
      }
      case "discord": {
        return {
          platform: "discord",
          success: false,
          error: "Discord posting not yet implemented",
        } satisfies PostResult;
      }
      case "instagram": {
        return {
          platform: "instagram",
          success: false,
          error: "Instagram posting not yet implemented",
        } satisfies PostResult;
      }
      default: {
        return {
          platform,
          success: false,
          error: `Unknown platform: ${platform}`,
        } satisfies PostResult;
      }
    }
  });

  const settled = await Promise.allSettled(postPromises);

  for (const result of settled) {
    if (result.status === "fulfilled") {
      results.push(result.value);
    } else {
      results.push({
        platform: "unknown",
        success: false,
        error: result.reason instanceof Error
          ? result.reason.message
          : String(result.reason),
      });
    }
  }

  return results;
}
