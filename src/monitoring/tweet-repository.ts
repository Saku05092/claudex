import type Database from "better-sqlite3";
import { randomUUID } from "crypto";
import type { CollectedTweet, MonitorRun } from "./types.js";

interface SaveResult {
  readonly saved: number;
  readonly duplicates: number;
}

interface RunStats {
  readonly queriesExecuted: number;
  readonly tweetsFound: number;
  readonly tweetsNew: number;
  readonly estimatedCreditsUsed: number;
}

export function createTweetRepository(db: Database.Database) {
  const insertTweet = db.prepare(`
    INSERT OR IGNORE INTO collected_tweets
      (tweet_id, author_id, author_username, author_name, author_followers,
       text, language, retweet_count, reply_count, like_count, quote_count,
       tweeted_at, source_type, source_query)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertRun = db.prepare(`
    INSERT INTO monitor_runs (id, run_type, started_at, status)
    VALUES (?, ?, ?, 'running')
  `);

  const updateRunComplete = db.prepare(`
    UPDATE monitor_runs
    SET completed_at = ?, queries_executed = ?, tweets_found = ?,
        tweets_new = ?, estimated_credits_used = ?, status = 'completed'
    WHERE id = ?
  `);

  const updateRunFailed = db.prepare(`
    UPDATE monitor_runs
    SET completed_at = ?, status = 'failed', error = ?
    WHERE id = ?
  `);

  const selectRecentTweets = db.prepare(`
    SELECT * FROM collected_tweets
    ORDER BY tweeted_at DESC
    LIMIT ?
  `);

  const countTweets = db.prepare(
    "SELECT COUNT(*) as count FROM collected_tweets"
  );

  function saveTweets(tweets: readonly CollectedTweet[]): SaveResult {
    let saved = 0;

    const saveAll = db.transaction(() => {
      for (const t of tweets) {
        const result = insertTweet.run(
          t.tweetId,
          t.authorId,
          t.authorUsername,
          t.authorName ?? null,
          t.authorFollowers ?? null,
          t.text,
          t.language ?? null,
          t.retweetCount,
          t.replyCount,
          t.likeCount,
          t.quoteCount,
          t.tweetedAt,
          t.sourceType,
          t.sourceQuery
        );
        if (result.changes > 0) saved++;
      }
    });

    saveAll();

    return {
      saved,
      duplicates: tweets.length - saved,
    };
  }

  function startRun(runType: "keyword" | "influencer"): MonitorRun {
    const id = randomUUID();
    const startedAt = new Date().toISOString();
    insertRun.run(id, runType, startedAt);
    return {
      id,
      runType,
      startedAt,
      queriesExecuted: 0,
      tweetsFound: 0,
      tweetsNew: 0,
      estimatedCreditsUsed: 0,
      status: "running",
    };
  }

  function completeRun(runId: string, stats: RunStats): void {
    updateRunComplete.run(
      new Date().toISOString(),
      stats.queriesExecuted,
      stats.tweetsFound,
      stats.tweetsNew,
      stats.estimatedCreditsUsed,
      runId
    );
  }

  function failRun(runId: string, error: string): void {
    updateRunFailed.run(new Date().toISOString(), error, runId);
  }

  function getRecentTweets(limit: number = 20): readonly CollectedTweet[] {
    const rows = selectRecentTweets.all(limit) as readonly Record<string, unknown>[];
    return rows.map(mapRowToTweet);
  }

  function getTweetCount(): number {
    const row = countTweets.get() as { count: number };
    return row.count;
  }

  return { saveTweets, startRun, completeRun, failRun, getRecentTweets, getTweetCount };
}

function mapRowToTweet(row: Record<string, unknown>): CollectedTweet {
  return {
    tweetId: row.tweet_id as string,
    authorId: row.author_id as string,
    authorUsername: row.author_username as string,
    authorName: (row.author_name as string) ?? undefined,
    authorFollowers: (row.author_followers as number) ?? undefined,
    text: row.text as string,
    language: (row.language as string) ?? undefined,
    retweetCount: row.retweet_count as number,
    replyCount: row.reply_count as number,
    likeCount: row.like_count as number,
    quoteCount: row.quote_count as number,
    tweetedAt: row.tweeted_at as string,
    sourceType: row.source_type as "keyword" | "influencer",
    sourceQuery: row.source_query as string,
  };
}
