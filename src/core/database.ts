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
  `);
}
