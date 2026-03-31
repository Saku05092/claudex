import { randomUUID } from "crypto";
import { createDatabase } from "./database.js";
import type Database from "better-sqlite3";

// Initialize click tracking table
export function initClickTracking(): void {
  const db = createDatabase();
  db.exec(`
    CREATE TABLE IF NOT EXISTS referral_clicks (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      content TEXT DEFAULT '',
      referrer TEXT DEFAULT '',
      user_agent TEXT DEFAULT '',
      clicked_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_clicks_campaign ON referral_clicks(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_clicks_platform ON referral_clicks(platform);
    CREATE INDEX IF NOT EXISTS idx_clicks_date ON referral_clicks(clicked_at);
  `);
  db.close();
}

interface ClickRecord {
  readonly id: string;
  readonly campaignId: string;
  readonly platform: string;
  readonly content: string;
  readonly referrer: string;
  readonly userAgent: string;
  readonly clickedAt: string;
}

interface PlatformClicks {
  readonly [platform: string]: number;
}

interface DailyClickCount {
  readonly date: string;
  readonly clicks: number;
}

interface CampaignClickCount {
  readonly campaignId: string;
  readonly totalClicks: number;
}

interface ClickSummary {
  readonly totalClicks: number;
  readonly clicksToday: number;
  readonly topCampaign: string | null;
  readonly topCampaignClicks: number;
}

export function trackClick(
  db: Database.Database,
  campaignId: string,
  platform: string,
  content: string,
  referrer?: string,
  userAgent?: string
): ClickRecord {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO referral_clicks (id, campaign_id, platform, content, referrer, user_agent)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, campaignId, platform, content, referrer ?? "", userAgent ?? "");

  return {
    id,
    campaignId,
    platform,
    content,
    referrer: referrer ?? "",
    userAgent: userAgent ?? "",
    clickedAt: new Date().toISOString(),
  };
}

export function getClicksByPlatform(
  db: Database.Database,
  campaignId: string
): PlatformClicks {
  const rows = db
    .prepare(
      `SELECT platform, COUNT(*) as count
       FROM referral_clicks
       WHERE campaign_id = ?
       GROUP BY platform`
    )
    .all(campaignId) as readonly { platform: string; count: number }[];

  const result: Record<string, number> = {};
  for (const row of rows) {
    result[row.platform] = row.count;
  }
  return result;
}

export function getClicksByDate(
  db: Database.Database,
  campaignId: string,
  days: number
): readonly DailyClickCount[] {
  const rows = db
    .prepare(
      `SELECT DATE(clicked_at) as date, COUNT(*) as clicks
       FROM referral_clicks
       WHERE campaign_id = ?
         AND clicked_at >= datetime('now', ? || ' days')
       GROUP BY DATE(clicked_at)
       ORDER BY date ASC`
    )
    .all(campaignId, `-${days}`) as readonly { date: string; clicks: number }[];

  return rows.map((row) => ({
    date: row.date,
    clicks: row.clicks,
  }));
}

export function getTopCampaigns(
  db: Database.Database,
  limit: number
): readonly CampaignClickCount[] {
  const rows = db
    .prepare(
      `SELECT campaign_id, COUNT(*) as total_clicks
       FROM referral_clicks
       GROUP BY campaign_id
       ORDER BY total_clicks DESC
       LIMIT ?`
    )
    .all(limit) as readonly { campaign_id: string; total_clicks: number }[];

  return rows.map((row) => ({
    campaignId: row.campaign_id,
    totalClicks: row.total_clicks,
  }));
}

export function getClickSummary(db: Database.Database): ClickSummary {
  const totalRow = db
    .prepare("SELECT COUNT(*) as count FROM referral_clicks")
    .get() as { count: number };

  const todayRow = db
    .prepare(
      "SELECT COUNT(*) as count FROM referral_clicks WHERE DATE(clicked_at) = DATE('now')"
    )
    .get() as { count: number };

  const topRow = db
    .prepare(
      `SELECT campaign_id, COUNT(*) as total_clicks
       FROM referral_clicks
       GROUP BY campaign_id
       ORDER BY total_clicks DESC
       LIMIT 1`
    )
    .get() as { campaign_id: string; total_clicks: number } | undefined;

  return {
    totalClicks: totalRow.count,
    clicksToday: todayRow.count,
    topCampaign: topRow?.campaign_id ?? null,
    topCampaignClicks: topRow?.total_clicks ?? 0,
  };
}
