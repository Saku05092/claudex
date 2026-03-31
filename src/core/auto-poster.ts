import cron from "node-cron";
import Anthropic from "@anthropic-ai/sdk";
import { createDatabase } from "./database.js";
import {
  TWEET_PATTERNS,
  buildTweetPrompt,
  getPatternById,
  WEEKLY_TWEET_MIX,
  type TweetPattern,
  type AirdropProjectData,
} from "./airdrop-tweet-patterns.js";
import {
  postToTwitter,
  type TwitterConfig,
  type PostResult,
} from "./multi-poster.js";
import { recordPost } from "./post-history.js";
import type Database from "better-sqlite3";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AutoPosterConfig {
  readonly anthropicApiKey: string;
  readonly twitterConfig: {
    readonly apiKey: string;
    readonly apiSecret: string;
    readonly accessToken: string;
    readonly accessTokenSecret: string;
  };
  readonly maxPostsPerDay: number;
  readonly activeHoursJST: readonly [number, number];
}

interface AutoPosterStatus {
  readonly isRunning: boolean;
  readonly todayPostCount: number;
  readonly maxPostsPerDay: number;
  readonly nextScheduledTime: string | null;
  readonly lastPostAt: string | null;
  readonly activeHoursJST: readonly [number, number];
}

interface AutoPostResult {
  readonly success: boolean;
  readonly pattern: TweetPattern;
  readonly tweetText?: string;
  readonly postResult?: PostResult;
  readonly error?: string;
}

// ---------------------------------------------------------------------------
// Day-of-week pattern mapping
// ---------------------------------------------------------------------------

const DAY_PATTERNS: readonly TweetPattern[] = [
  "engagement" as TweetPattern,      // Sunday (0) - placeholder, handled below
  "educational_mini",                  // Monday
  "personal_experience",               // Tuesday
  "educational_mini",                  // Wednesday
  "comparison",                        // Thursday
  "alpha_roundup",                     // Friday
  "personal_experience",               // Saturday
];

function getPatternForDay(dayOfWeek: number, db: Database.Database): TweetPattern {
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
  const dayName = dayNames[dayOfWeek];
  const mixPatterns = WEEKLY_TWEET_MIX[dayName as keyof typeof WEEKLY_TWEET_MIX];

  if (dayOfWeek === 0) {
    // Sunday: deadline_urgency if deadlines exist, else personal_experience
    const upcoming = db
      .prepare(
        "SELECT COUNT(*) as count FROM campaigns WHERE status = 'active' AND deadline != '' AND deadline > datetime('now')"
      )
      .get() as { count: number };

    return upcoming.count > 0 ? "deadline_urgency" : "personal_experience";
  }

  return mixPatterns[0] as TweetPattern;
}

// ---------------------------------------------------------------------------
// Auto Poster
// ---------------------------------------------------------------------------

interface AutoPosterApi {
  readonly start: () => void;
  readonly stop: () => void;
  readonly generateAndPost: (pattern?: TweetPattern, topic?: string) => Promise<AutoPostResult>;
  readonly getStatus: () => AutoPosterStatus;
}

export function createAutoPoster(config: AutoPosterConfig): AutoPosterApi {
  const db = createDatabase();
  const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });
  const twitterConfig: TwitterConfig = {
    apiKey: config.twitterConfig.apiKey,
    apiSecret: config.twitterConfig.apiSecret,
    accessToken: config.twitterConfig.accessToken,
    accessTokenSecret: config.twitterConfig.accessTokenSecret,
  };

  let cronTask: cron.ScheduledTask | null = null;
  let isRunning = false;
  let lastPostAt: string | null = null;

  // --- Helpers ---

  function getTodayPostCount(): number {
    const today = new Date().toISOString().slice(0, 10);
    const row = db
      .prepare(
        "SELECT COUNT(*) as count FROM scheduled_posts WHERE DATE(posted_at) = ? AND status = 'posted'"
      )
      .get(today) as { count: number };
    return row.count;
  }

  function getNextScheduledTime(): string | null {
    if (!isRunning) return null;

    const now = new Date();
    const jstHour = (now.getUTCHours() + 9) % 24;
    const [startHour, endHour] = config.activeHoursJST;

    // Find next even hour within active window
    let nextHour = jstHour % 2 === 0 ? jstHour + 2 : jstHour + 1;
    if (nextHour > endHour) {
      nextHour = startHour;
    }

    const nextDate = new Date(now);
    const utcNextHour = (nextHour - 9 + 24) % 24;
    if (utcNextHour <= now.getUTCHours() && nextHour <= jstHour) {
      nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    }
    nextDate.setUTCHours(utcNextHour, 0, 0, 0);

    return nextDate.toISOString();
  }

  function getRandomActiveCampaign(): AirdropProjectData | null {
    const rows = db
      .prepare(
        "SELECT * FROM campaigns WHERE status = 'active' ORDER BY RANDOM() LIMIT 1"
      )
      .all() as readonly Record<string, unknown>[];

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      name: (row.name as string) ?? "",
      ticker: (row.ticker as string) ?? "",
      category: (row.category as string) ?? "",
      chain: (row.chain as string) ?? "",
      description: (row.description as string) ?? "",
      tasks: JSON.parse((row.tasks as string) || "[]") as readonly string[],
      estimatedValue: (row.estimated_value as string) ?? "",
      fundingRaised: (row.funding_raised as string) ?? "",
      backers: JSON.parse((row.backers as string) || "[]") as readonly string[],
      referralLink: (row.referral_link as string) ?? "",
      referralReward: (row.referral_reward as string) ?? "",
      deadline: (row.deadline as string) ?? "",
      tgeDate: "",
      tokenAllocation: "",
      pointsProgram: "",
    };
  }

  // --- Generate content ---

  async function generateContent(
    pattern: TweetPattern,
    topic?: string
  ): Promise<string> {
    const projectData = getRandomActiveCampaign();

    let systemPrompt: string;
    let userPrompt: string;

    if (projectData) {
      const patternConfig = getPatternById(pattern);
      const prompts = buildTweetPrompt(patternConfig, projectData);
      systemPrompt = prompts.system;
      userPrompt = prompts.user;
    } else {
      const patternConfig = getPatternById(pattern);
      systemPrompt = patternConfig.systemPrompt;
      const fallbackTopic = topic ?? "DeFi trends and opportunities";
      userPrompt = patternConfig.userPromptTemplate
        .replace("{projectData}", fallbackTopic)
        .replace("{referralLink}", "none")
        .replace("{hasPR}", "no")
        .replace("{topic}", fallbackTopic);
    }

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    return response.content[0].type === "text" ? response.content[0].text : "";
  }

  // --- Generate and post ---

  async function generateAndPost(
    pattern?: TweetPattern,
    topic?: string
  ): Promise<AutoPostResult> {
    const todayCount = getTodayPostCount();
    if (todayCount >= config.maxPostsPerDay) {
      return {
        success: false,
        pattern: pattern ?? "personal_experience",
        error: `Daily limit reached (${todayCount}/${config.maxPostsPerDay})`,
      };
    }

    const now = new Date();
    const dayOfWeek = now.getDay();
    const selectedPattern = pattern ?? getPatternForDay(dayOfWeek, db);

    try {
      const tweetText = await generateContent(selectedPattern, topic);

      if (!tweetText.trim()) {
        return {
          success: false,
          pattern: selectedPattern,
          error: "Generated empty content",
        };
      }

      const postResult = await postToTwitter(tweetText, twitterConfig);

      if (postResult.success) {
        recordPost(
          "twitter",
          tweetText,
          selectedPattern,
          undefined,
          postResult.postId,
          postResult.url
        );
        lastPostAt = new Date().toISOString();
      }

      return {
        success: postResult.success,
        pattern: selectedPattern,
        tweetText,
        postResult,
        error: postResult.error,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        pattern: selectedPattern,
        error: message,
      };
    }
  }

  // --- Start cron ---

  function start(): void {
    if (cronTask) return;
    isRunning = true;

    // Run every 2 hours during active hours
    cronTask = cron.schedule(
      "0 */2 * * *",
      async () => {
        const now = new Date();
        const jstHour = (now.getUTCHours() + 9) % 24;
        const [startHour, endHour] = config.activeHoursJST;

        if (jstHour < startHour || jstHour > endHour) {
          return;
        }

        const todayCount = getTodayPostCount();
        if (todayCount >= config.maxPostsPerDay) {
          console.log(
            `[AutoPoster] Daily limit reached (${todayCount}/${config.maxPostsPerDay}). Skipping.`
          );
          return;
        }

        console.log(
          `[AutoPoster] Running scheduled post (${todayCount + 1}/${config.maxPostsPerDay})...`
        );

        const result = await generateAndPost();

        if (result.success) {
          console.log(
            `[AutoPoster] Posted [${result.pattern}]: ${result.tweetText?.slice(0, 60)}...`
          );
        } else {
          console.error(`[AutoPoster] Failed: ${result.error}`);
        }
      },
      { timezone: "Asia/Tokyo" }
    );

    console.log(
      `[AutoPoster] Started. Active hours JST: ${config.activeHoursJST[0]}-${config.activeHoursJST[1]}, max ${config.maxPostsPerDay}/day`
    );
  }

  // --- Stop ---

  function stop(): void {
    cronTask?.stop();
    cronTask = null;
    isRunning = false;
    console.log("[AutoPoster] Stopped.");
  }

  // --- Status ---

  function getStatus(): AutoPosterStatus {
    return {
      isRunning,
      todayPostCount: getTodayPostCount(),
      maxPostsPerDay: config.maxPostsPerDay,
      nextScheduledTime: getNextScheduledTime(),
      lastPostAt,
      activeHoursJST: config.activeHoursJST,
    };
  }

  return { start, stop, generateAndPost, getStatus };
}
