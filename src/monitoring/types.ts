import { z } from "zod";

// --- Search Query ---

export interface SearchQuery {
  readonly query: string;
  readonly sourceType: "keyword" | "influencer";
  readonly label: string;
}

// --- Collected Tweet ---

export const CollectedTweetSchema = z.object({
  tweetId: z.string(),
  authorId: z.string(),
  authorUsername: z.string(),
  authorName: z.string().optional(),
  authorFollowers: z.number().int().optional(),
  text: z.string(),
  language: z.string().optional(),
  retweetCount: z.number().int().default(0),
  replyCount: z.number().int().default(0),
  likeCount: z.number().int().default(0),
  quoteCount: z.number().int().default(0),
  tweetedAt: z.string(),
  sourceType: z.enum(["keyword", "influencer"]),
  sourceQuery: z.string(),
});

export type CollectedTweet = z.infer<typeof CollectedTweetSchema>;

// --- Monitor Run ---

export const MonitorRunSchema = z.object({
  id: z.string(),
  runType: z.enum(["keyword", "influencer"]),
  startedAt: z.string(),
  completedAt: z.string().optional(),
  queriesExecuted: z.number().int().default(0),
  tweetsFound: z.number().int().default(0),
  tweetsNew: z.number().int().default(0),
  estimatedCreditsUsed: z.number().default(0),
  status: z.enum(["running", "completed", "failed"]).default("running"),
  error: z.string().optional(),
});

export type MonitorRun = z.infer<typeof MonitorRunSchema>;

// --- Run Result ---

export interface RunResult {
  readonly runId: string;
  readonly runType: "keyword" | "influencer";
  readonly queriesExecuted: number;
  readonly tweetsFound: number;
  readonly tweetsNew: number;
  readonly estimatedCreditsUsed: number;
}

// --- Monitor Config ---

export interface MonitorConfig {
  readonly maxResults: number;
  readonly enabled: boolean;
  readonly bearerToken: string;
}

// --- Credit Estimate ---

export interface CreditEstimate {
  readonly queriesRun: number;
  readonly tweetsReturned: number;
  readonly estimatedCost: number;
}
