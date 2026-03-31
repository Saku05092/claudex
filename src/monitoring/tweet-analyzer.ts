import type Database from "better-sqlite3";

/**
 * Analyzes collected tweets to extract trending projects,
 * top influencers, and recent activity for the dashboard.
 */

export interface TrendingProject {
  readonly name: string;
  readonly mentions: number;
  readonly totalLikes: number;
  readonly totalRTs: number;
  readonly topTweet: string;
  readonly topAuthor: string;
  readonly firstSeen: string;
  readonly lastSeen: string;
}

export interface TopInfluencer {
  readonly username: string;
  readonly name: string;
  readonly followers: number;
  readonly tweetsCaptured: number;
  readonly totalEngagement: number;
  readonly avgEngagement: number;
  readonly recentTweet: string;
}

export interface RecentTweet {
  readonly tweetId: string;
  readonly authorUsername: string;
  readonly authorName: string;
  readonly text: string;
  readonly likeCount: number;
  readonly retweetCount: number;
  readonly replyCount: number;
  readonly tweetedAt: string;
  readonly sourceType: string;
}

export interface MonitorStats {
  readonly totalTweets: number;
  readonly tweetsLast24h: number;
  readonly tweetsLast7d: number;
  readonly uniqueAuthors: number;
  readonly totalRuns: number;
  readonly lastRunAt: string | null;
  readonly estimatedTotalCost: number;
}

export interface MonitorDashboardData {
  readonly stats: MonitorStats;
  readonly trendingProjects: readonly TrendingProject[];
  readonly topInfluencers: readonly TopInfluencer[];
  readonly recentTweets: readonly RecentTweet[];
  readonly updatedAt: string;
}

// Known airdrop project keywords to track
const PROJECT_PATTERNS: readonly { readonly name: string; readonly patterns: readonly RegExp[] }[] = [
  { name: "edgeX", patterns: [/\bedgex\b/i, /\bedge\s*x\b/i] },
  { name: "OpenSea", patterns: [/\bopensea\b/i, /\$SEA\b/] },
  { name: "Polymarket", patterns: [/\bpolymarket\b/i, /\$POLY\b/] },
  { name: "Linea", patterns: [/\blinea\b/i, /\bLXP\b/] },
  { name: "Eclipse", patterns: [/\beclipse\b/i] },
  { name: "Hyperlane", patterns: [/\bhyperlane\b/i] },
  { name: "Lighter", patterns: [/\blighter\b/i] },
  { name: "Phantom", patterns: [/\bphantom\b/i] },
  { name: "Ambient", patterns: [/\bambient\b/i] },
  { name: "Karak", patterns: [/\bkarak\b/i] },
  { name: "Hyperliquid", patterns: [/\bhyperliquid\b/i, /\$HYPE\b/] },
  { name: "LayerZero", patterns: [/\blayerzero\b/i, /\$ZRO\b/] },
  { name: "Berachain", patterns: [/\bberachain\b/i, /\$BERA\b/] },
  { name: "Monad", patterns: [/\bmonad\b/i] },
  { name: "Scroll", patterns: [/\bscroll\b/i] },
  { name: "zkSync", patterns: [/\bzksync\b/i] },
  { name: "StarkNet", patterns: [/\bstarknet\b/i] },
  { name: "Blast", patterns: [/\bblast\b/i] },
  { name: "Decibel", patterns: [/\bdecibel\b/i] },
  { name: "Pacifica", patterns: [/\bpacifica\b/i] },
];

export function createTweetAnalyzer(db: Database.Database) {
  function getStats(): MonitorStats {
    const total = db.prepare("SELECT COUNT(*) as count FROM collected_tweets").get() as { count: number };
    const last24h = db.prepare(
      "SELECT COUNT(*) as count FROM collected_tweets WHERE collected_at > datetime('now', '-1 day')"
    ).get() as { count: number };
    const last7d = db.prepare(
      "SELECT COUNT(*) as count FROM collected_tweets WHERE collected_at > datetime('now', '-7 days')"
    ).get() as { count: number };
    const authors = db.prepare(
      "SELECT COUNT(DISTINCT author_username) as count FROM collected_tweets"
    ).get() as { count: number };
    const runs = db.prepare("SELECT COUNT(*) as count FROM monitor_runs").get() as { count: number };
    const lastRun = db.prepare(
      "SELECT started_at FROM monitor_runs ORDER BY started_at DESC LIMIT 1"
    ).get() as { started_at: string } | undefined;
    const costSum = db.prepare(
      "SELECT COALESCE(SUM(estimated_credits_used), 0) as total FROM monitor_runs WHERE status = 'completed'"
    ).get() as { total: number };

    return {
      totalTweets: total.count,
      tweetsLast24h: last24h.count,
      tweetsLast7d: last7d.count,
      uniqueAuthors: authors.count,
      totalRuns: runs.count,
      lastRunAt: lastRun?.started_at ?? null,
      estimatedTotalCost: Math.round(costSum.total * 1000) / 1000,
    };
  }

  function getTrendingProjects(limit: number = 15): readonly TrendingProject[] {
    const rows = db.prepare(
      "SELECT tweet_id, author_username, text, like_count, retweet_count, tweeted_at FROM collected_tweets WHERE tweeted_at > datetime('now', '-30 days') ORDER BY tweeted_at DESC LIMIT 1000"
    ).all() as readonly {
      tweet_id: string;
      author_username: string;
      text: string;
      like_count: number;
      retweet_count: number;
      tweeted_at: string;
    }[];

    const projectMap = new Map<string, {
      mentions: number;
      totalLikes: number;
      totalRTs: number;
      topTweet: string;
      topAuthor: string;
      topEngagement: number;
      firstSeen: string;
      lastSeen: string;
    }>();

    for (const row of rows) {
      for (const project of PROJECT_PATTERNS) {
        const matched = project.patterns.some((p) => p.test(row.text));
        if (!matched) continue;

        const existing = projectMap.get(project.name);
        const engagement = row.like_count + row.retweet_count;

        if (existing) {
          projectMap.set(project.name, {
            mentions: existing.mentions + 1,
            totalLikes: existing.totalLikes + row.like_count,
            totalRTs: existing.totalRTs + row.retweet_count,
            topTweet: engagement > existing.topEngagement ? row.text : existing.topTweet,
            topAuthor: engagement > existing.topEngagement ? row.author_username : existing.topAuthor,
            topEngagement: Math.max(engagement, existing.topEngagement),
            firstSeen: row.tweeted_at < existing.firstSeen ? row.tweeted_at : existing.firstSeen,
            lastSeen: row.tweeted_at > existing.lastSeen ? row.tweeted_at : existing.lastSeen,
          });
        } else {
          projectMap.set(project.name, {
            mentions: 1,
            totalLikes: row.like_count,
            totalRTs: row.retweet_count,
            topTweet: row.text,
            topAuthor: row.author_username,
            topEngagement: engagement,
            firstSeen: row.tweeted_at,
            lastSeen: row.tweeted_at,
          });
        }
      }
    }

    return [...projectMap.entries()]
      .map(([name, data]) => ({
        name,
        mentions: data.mentions,
        totalLikes: data.totalLikes,
        totalRTs: data.totalRTs,
        topTweet: data.topTweet.slice(0, 200),
        topAuthor: data.topAuthor,
        firstSeen: data.firstSeen,
        lastSeen: data.lastSeen,
      }))
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, limit);
  }

  function getTopInfluencers(limit: number = 20): readonly TopInfluencer[] {
    const rows = db.prepare(`
      SELECT
        author_username,
        MAX(author_name) as author_name,
        MAX(author_followers) as author_followers,
        COUNT(*) as tweets_captured,
        SUM(like_count + retweet_count + reply_count) as total_engagement,
        MAX(text) as recent_tweet
      FROM collected_tweets
      GROUP BY author_username
      ORDER BY total_engagement DESC
      LIMIT ?
    `).all(limit) as readonly {
      author_username: string;
      author_name: string;
      author_followers: number;
      tweets_captured: number;
      total_engagement: number;
      recent_tweet: string;
    }[];

    return rows.map((r) => ({
      username: r.author_username,
      name: r.author_name ?? r.author_username,
      followers: r.author_followers ?? 0,
      tweetsCaptured: r.tweets_captured,
      totalEngagement: r.total_engagement,
      avgEngagement: r.tweets_captured > 0 ? Math.round(r.total_engagement / r.tweets_captured) : 0,
      recentTweet: (r.recent_tweet ?? "").slice(0, 150),
    }));
  }

  function getRecentTweets(limit: number = 30): readonly RecentTweet[] {
    const rows = db.prepare(`
      SELECT tweet_id, author_username, author_name, text,
             like_count, retweet_count, reply_count, tweeted_at, source_type
      FROM collected_tweets
      ORDER BY tweeted_at DESC
      LIMIT ?
    `).all(limit) as readonly {
      tweet_id: string;
      author_username: string;
      author_name: string;
      text: string;
      like_count: number;
      retweet_count: number;
      reply_count: number;
      tweeted_at: string;
      source_type: string;
    }[];

    return rows.map((r) => ({
      tweetId: r.tweet_id,
      authorUsername: r.author_username,
      authorName: r.author_name ?? r.author_username,
      text: r.text.slice(0, 280),
      likeCount: r.like_count,
      retweetCount: r.retweet_count,
      replyCount: r.reply_count,
      tweetedAt: r.tweeted_at,
      sourceType: r.source_type,
    }));
  }

  function getDashboardData(): MonitorDashboardData {
    return {
      stats: getStats(),
      trendingProjects: getTrendingProjects(),
      topInfluencers: getTopInfluencers(),
      recentTweets: getRecentTweets(),
      updatedAt: new Date().toISOString(),
    };
  }

  function extractUnknownProjects(
    knownNames: readonly string[]
  ): readonly { name: string; mentions: number; sampleTweets: readonly string[] }[] {
    const knownLower = new Set(knownNames.map((n) => n.toLowerCase()));

    // Airdrop-related keywords to ensure context
    const airdropKeywords = /airdrop|エアドロ|testnet|points|ポイント|TGE|token|farming|claim/i;

    const rows = db.prepare(
      "SELECT text FROM collected_tweets WHERE tweeted_at > datetime('now', '-30 days') ORDER BY tweeted_at DESC LIMIT 1000"
    ).all() as readonly { text: string }[];

    const candidates = new Map<string, { count: number; samples: string[] }>();

    for (const row of rows) {
      if (!airdropKeywords.test(row.text)) continue;

      // Extract $TICKER patterns
      const tickers = row.text.match(/\$[A-Z]{2,10}/g) ?? [];
      for (const ticker of tickers) {
        const name = ticker.slice(1); // remove $
        addCandidate(name, row.text, candidates, knownLower);
      }

      // Extract @handle mentions near airdrop keywords
      const handles = row.text.match(/@([A-Za-z0-9_]{3,20})/g) ?? [];
      for (const handle of handles) {
        // Skip common bot/platform handles
        if (/^@(YouTube|Discord|telegram|github|opensea)$/i.test(handle)) continue;
        // Only include handles that appear as project names (capitalized in text)
        const cleanHandle = handle.slice(1);
        if (row.text.includes(cleanHandle) && /^[A-Z]/.test(cleanHandle)) {
          addCandidate(cleanHandle, row.text, candidates, knownLower);
        }
      }

      // Extract capitalized project-like names (2+ words or single word near keywords)
      const projectNames = row.text.match(/\b[A-Z][a-zA-Z]{2,15}(?:\s+[A-Z][a-zA-Z]+)?\b/g) ?? [];
      for (const pn of projectNames) {
        // Skip common English words
        if (/^(The|This|That|What|How|New|Best|Free|Just|From|With|Your|They|Will|Have|Been|Does|About|After)$/i.test(pn)) continue;
        if (pn.length < 4) continue;
        addCandidate(pn, row.text, candidates, knownLower);
      }
    }

    return [...candidates.entries()]
      .filter(([, data]) => data.count >= 2)
      .map(([name, data]) => ({
        name,
        mentions: data.count,
        sampleTweets: data.samples,
      }))
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 20);
  }

  return { getStats, getTrendingProjects, getTopInfluencers, getRecentTweets, getDashboardData, extractUnknownProjects };
}

function addCandidate(
  name: string,
  tweetText: string,
  candidates: Map<string, { count: number; samples: string[] }>,
  knownLower: Set<string>
): void {
  if (knownLower.has(name.toLowerCase())) return;
  if (name.length < 3) return;

  const existing = candidates.get(name);
  if (existing) {
    existing.count += 1;
    if (existing.samples.length < 3) {
      existing.samples.push(tweetText.slice(0, 150));
    }
  } else {
    candidates.set(name, { count: 1, samples: [tweetText.slice(0, 150)] });
  }
}
