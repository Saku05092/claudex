import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "../../data/claudex.db");

export function createDatabase(): Database.Database {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  initializeSchema(db);
  return db;
}

function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS crypto_cards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      issuer TEXT NOT NULL,
      network TEXT NOT NULL,
      japan_availability TEXT NOT NULL,
      cashback_percent TEXT,
      cashback_token TEXT,
      referral_reward TEXT,
      referral_link TEXT,
      annual_fee TEXT,
      features TEXT,
      website TEXT NOT NULL,
      japanese_support INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS defi_protocols (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      chain TEXT,
      tvl REAL,
      tvl_change_24h REAL,
      first_seen TEXT DEFAULT (datetime('now')),
      has_referral INTEGER DEFAULT 0,
      referral_url TEXT,
      referral_reward TEXT,
      website TEXT,
      twitter TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS scheduled_posts (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL,
      content_text TEXT NOT NULL,
      content_category TEXT NOT NULL,
      language TEXT DEFAULT 'ja',
      referral_link TEXT,
      disclaimer TEXT,
      hashtags TEXT,
      image_path TEXT,
      scheduled_at TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      posted_at TEXT,
      error TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS post_analytics (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES scheduled_posts(id),
      platform TEXT NOT NULL,
      impressions INTEGER DEFAULT 0,
      engagements INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      referral_signups INTEGER DEFAULT 0,
      recorded_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_posts_status ON scheduled_posts(status);
    CREATE INDEX IF NOT EXISTS idx_posts_scheduled ON scheduled_posts(scheduled_at);
    CREATE INDEX IF NOT EXISTS idx_protocols_first_seen ON defi_protocols(first_seen);

    CREATE TABLE IF NOT EXISTS collected_tweets (
      tweet_id TEXT PRIMARY KEY,
      author_id TEXT NOT NULL,
      author_username TEXT NOT NULL,
      author_name TEXT,
      author_followers INTEGER,
      text TEXT NOT NULL,
      language TEXT,
      retweet_count INTEGER DEFAULT 0,
      reply_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      quote_count INTEGER DEFAULT 0,
      tweeted_at TEXT NOT NULL,
      source_type TEXT NOT NULL CHECK(source_type IN ('keyword', 'influencer')),
      source_query TEXT NOT NULL,
      collected_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS monitor_runs (
      id TEXT PRIMARY KEY,
      run_type TEXT NOT NULL CHECK(run_type IN ('keyword', 'influencer')),
      started_at TEXT NOT NULL,
      completed_at TEXT,
      queries_executed INTEGER DEFAULT 0,
      tweets_found INTEGER DEFAULT 0,
      tweets_new INTEGER DEFAULT 0,
      estimated_credits_used REAL DEFAULT 0,
      status TEXT DEFAULT 'running' CHECK(status IN ('running', 'completed', 'failed')),
      error TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_tweets_author ON collected_tweets(author_username);
    CREATE INDEX IF NOT EXISTS idx_tweets_source ON collected_tweets(source_type);
    CREATE INDEX IF NOT EXISTS idx_tweets_tweeted ON collected_tweets(tweeted_at);
    CREATE INDEX IF NOT EXISTS idx_tweets_collected ON collected_tweets(collected_at);

    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      ticker TEXT DEFAULT '',
      category TEXT DEFAULT '',
      chain TEXT DEFAULT '',
      tier TEXT DEFAULT 'B' CHECK(tier IN ('S', 'A', 'B', 'C')),
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'upcoming', 'ended')),
      tge_completed INTEGER DEFAULT 0,
      description TEXT DEFAULT '',
      tasks TEXT DEFAULT '[]',
      estimated_value TEXT DEFAULT '',
      funding_raised TEXT DEFAULT '',
      backers TEXT DEFAULT '[]',
      website TEXT DEFAULT '',
      twitter TEXT DEFAULT '',
      referral_link TEXT DEFAULT '',
      referral_reward TEXT DEFAULT '',
      risk_level TEXT DEFAULT 'medium' CHECK(risk_level IN ('low', 'medium', 'high')),
      deadline TEXT DEFAULT '',
      added_at TEXT DEFAULT '',
      source TEXT DEFAULT 'manual' CHECK(source IN ('manual', 'tweet', 'defilama')),
      verified INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
    CREATE INDEX IF NOT EXISTS idx_campaigns_source ON campaigns(source);
  `);
}
