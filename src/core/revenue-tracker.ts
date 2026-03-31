import { randomUUID } from "crypto";
import { createDatabase } from "./database.js";
import type Database from "better-sqlite3";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RevenueEntry {
  readonly campaignId: string;
  readonly platform: string;
  readonly estimatedRevenue: number;
  readonly referralSignups: number;
  readonly recordedAt: string;
}

export interface RevenueSummary {
  readonly totalEstimatedRevenue: number;
  readonly totalClicks: number;
  readonly totalSignups: number;
  readonly topCampaigns: readonly { readonly name: string; readonly revenue: number; readonly clicks: number }[];
  readonly revenueByMonth: readonly { readonly month: string; readonly revenue: number }[];
  readonly revenueByPlatform: readonly { readonly platform: string; readonly revenue: number }[];
}

interface CampaignRevenue {
  readonly campaignId: string;
  readonly campaignName: string;
  readonly totalRevenue: number;
  readonly totalSignups: number;
  readonly entries: readonly RevenueEntry[];
}

// ---------------------------------------------------------------------------
// Schema initialization
// ---------------------------------------------------------------------------

function ensureRevenueTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS revenue (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      estimated_revenue REAL DEFAULT 0,
      referral_signups INTEGER DEFAULT 0,
      recorded_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_revenue_campaign ON revenue(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_revenue_recorded ON revenue(recorded_at);
    CREATE INDEX IF NOT EXISTS idx_revenue_platform ON revenue(platform);
  `);
}

// ---------------------------------------------------------------------------
// Revenue Tracker
// ---------------------------------------------------------------------------

interface RevenueTrackerApi {
  readonly recordRevenue: (
    campaignId: string,
    platform: string,
    amount: number,
    signups: number
  ) => RevenueEntry;
  readonly getRevenueSummary: (days?: number) => RevenueSummary;
  readonly getRevenueByPlatform: () => readonly { readonly platform: string; readonly revenue: number; readonly signups: number }[];
  readonly getMonthlyRevenue: () => readonly { readonly month: string; readonly revenue: number; readonly signups: number }[];
  readonly getCampaignRevenue: (campaignId: string) => CampaignRevenue | null;
}

export function createRevenueTracker(): RevenueTrackerApi {
  const db = createDatabase();
  ensureRevenueTable(db);

  // --- Record revenue ---

  function recordRevenue(
    campaignId: string,
    platform: string,
    amount: number,
    signups: number
  ): RevenueEntry {
    const id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO revenue (id, campaign_id, platform, estimated_revenue, referral_signups, recorded_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, campaignId, platform, amount, signups, now);

    return {
      campaignId,
      platform,
      estimatedRevenue: amount,
      referralSignups: signups,
      recordedAt: now,
    };
  }

  // --- Revenue summary ---

  function getRevenueSummary(days?: number): RevenueSummary {
    const dateFilter = days
      ? `WHERE r.recorded_at > datetime('now', '-${days} days')`
      : "";

    // Total revenue
    const totals = db
      .prepare(
        `SELECT
          COALESCE(SUM(estimated_revenue), 0) as total_revenue,
          COALESCE(SUM(referral_signups), 0) as total_signups
        FROM revenue r ${dateFilter}`
      )
      .get() as { total_revenue: number; total_signups: number };

    // Total clicks from post_analytics
    const clicksRow = db
      .prepare(
        "SELECT COALESCE(SUM(clicks), 0) as total_clicks FROM post_analytics"
      )
      .get() as { total_clicks: number };

    // Top campaigns
    const topCampaignRows = db
      .prepare(
        `SELECT
          r.campaign_id,
          COALESCE(c.name, r.campaign_id) as name,
          SUM(r.estimated_revenue) as revenue,
          COALESCE(SUM(pa.clicks), 0) as clicks
        FROM revenue r
        LEFT JOIN campaigns c ON c.id = r.campaign_id
        LEFT JOIN post_analytics pa ON pa.post_id IN (
          SELECT sp.id FROM scheduled_posts sp WHERE sp.referral_link LIKE '%' || r.campaign_id || '%'
        )
        ${dateFilter}
        GROUP BY r.campaign_id
        ORDER BY revenue DESC
        LIMIT 10`
      )
      .all() as readonly { campaign_id: string; name: string; revenue: number; clicks: number }[];

    // Monthly revenue
    const monthlyRows = db
      .prepare(
        `SELECT
          strftime('%Y-%m', recorded_at) as month,
          SUM(estimated_revenue) as revenue
        FROM revenue
        GROUP BY month
        ORDER BY month DESC
        LIMIT 12`
      )
      .all() as readonly { month: string; revenue: number }[];

    // Revenue by platform
    const platformRows = db
      .prepare(
        `SELECT
          platform,
          SUM(estimated_revenue) as revenue
        FROM revenue
        ${dateFilter}
        GROUP BY platform
        ORDER BY revenue DESC`
      )
      .all() as readonly { platform: string; revenue: number }[];

    return {
      totalEstimatedRevenue: Math.round(totals.total_revenue * 100) / 100,
      totalClicks: clicksRow.total_clicks,
      totalSignups: totals.total_signups,
      topCampaigns: topCampaignRows.map((r) => ({
        name: r.name,
        revenue: Math.round(r.revenue * 100) / 100,
        clicks: r.clicks,
      })),
      revenueByMonth: monthlyRows.map((r) => ({
        month: r.month,
        revenue: Math.round(r.revenue * 100) / 100,
      })),
      revenueByPlatform: platformRows.map((r) => ({
        platform: r.platform,
        revenue: Math.round(r.revenue * 100) / 100,
      })),
    };
  }

  // --- Revenue by platform ---

  function getRevenueByPlatform(): readonly { readonly platform: string; readonly revenue: number; readonly signups: number }[] {
    const rows = db
      .prepare(
        `SELECT
          platform,
          SUM(estimated_revenue) as revenue,
          SUM(referral_signups) as signups
        FROM revenue
        GROUP BY platform
        ORDER BY revenue DESC`
      )
      .all() as readonly { platform: string; revenue: number; signups: number }[];

    return rows.map((r) => ({
      platform: r.platform,
      revenue: Math.round(r.revenue * 100) / 100,
      signups: r.signups,
    }));
  }

  // --- Monthly revenue ---

  function getMonthlyRevenue(): readonly { readonly month: string; readonly revenue: number; readonly signups: number }[] {
    const rows = db
      .prepare(
        `SELECT
          strftime('%Y-%m', recorded_at) as month,
          SUM(estimated_revenue) as revenue,
          SUM(referral_signups) as signups
        FROM revenue
        GROUP BY month
        ORDER BY month DESC
        LIMIT 12`
      )
      .all() as readonly { month: string; revenue: number; signups: number }[];

    return rows.map((r) => ({
      month: r.month,
      revenue: Math.round(r.revenue * 100) / 100,
      signups: r.signups,
    }));
  }

  // --- Campaign-specific revenue ---

  function getCampaignRevenue(campaignId: string): CampaignRevenue | null {
    const campaignRow = db
      .prepare("SELECT name FROM campaigns WHERE id = ?")
      .get(campaignId) as { name: string } | undefined;

    const entries = db
      .prepare(
        `SELECT campaign_id, platform, estimated_revenue, referral_signups, recorded_at
         FROM revenue
         WHERE campaign_id = ?
         ORDER BY recorded_at DESC`
      )
      .all(campaignId) as readonly {
        campaign_id: string;
        platform: string;
        estimated_revenue: number;
        referral_signups: number;
        recorded_at: string;
      }[];

    if (entries.length === 0 && !campaignRow) {
      return null;
    }

    const totalRevenue = entries.reduce((sum, e) => sum + e.estimated_revenue, 0);
    const totalSignups = entries.reduce((sum, e) => sum + e.referral_signups, 0);

    return {
      campaignId,
      campaignName: campaignRow?.name ?? campaignId,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalSignups,
      entries: entries.map((e) => ({
        campaignId: e.campaign_id,
        platform: e.platform,
        estimatedRevenue: e.estimated_revenue,
        referralSignups: e.referral_signups,
        recordedAt: e.recorded_at,
      })),
    };
  }

  return {
    recordRevenue,
    getRevenueSummary,
    getRevenueByPlatform,
    getMonthlyRevenue,
    getCampaignRevenue,
  };
}
