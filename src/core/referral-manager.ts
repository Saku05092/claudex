import { createDatabase } from "./database.js";
import { CAMPAIGNS, type AirdropCampaign } from "../api/data.js";
import type Database from "better-sqlite3";

type Platform = "twitter" | "telegram" | "discord" | "instagram" | "web";
type UtmContent = "tweet" | "post" | "story" | "cta";

interface ReferralEntry {
  readonly campaignId: string;
  readonly campaignName: string;
  readonly referralLink: string;
}

interface ClickStats {
  readonly campaignId: string;
  readonly totalClicks: number;
  readonly clicksByPlatform: Readonly<Record<string, number>>;
}

let _db: Database.Database | null = null;
function getDb(): Database.Database {
  if (!_db) {
    _db = createDatabase();
  }
  return _db;
}

export function setReferralLink(campaignId: string, url: string): void {
  const db = getDb();
  const existing = db
      .prepare("SELECT id FROM campaigns WHERE id = ?")
      .get(campaignId);

    if (existing) {
      db.prepare(
        "UPDATE campaigns SET referral_link = ?, updated_at = datetime('now') WHERE id = ?"
      ).run(url, campaignId);
    } else {
      const hardcoded = CAMPAIGNS.find((c) => c.id === campaignId);
      if (!hardcoded) {
        throw new Error(`Campaign not found: ${campaignId}`);
      }
      db.prepare(
        `INSERT INTO campaigns
          (id, name, ticker, category, chain, tier, status, tge_completed,
           description, tasks, estimated_value, funding_raised, backers,
           website, twitter, referral_link, referral_reward,
           risk_level, deadline, added_at, source, verified)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual', 1)`
      ).run(
        hardcoded.id,
        hardcoded.name,
        hardcoded.ticker,
        hardcoded.category,
        hardcoded.chain,
        hardcoded.tier,
        hardcoded.status,
        hardcoded.tgeCompleted ? 1 : 0,
        hardcoded.description,
        JSON.stringify(hardcoded.tasks),
        hardcoded.estimatedValue,
        hardcoded.fundingRaised,
        JSON.stringify(hardcoded.backers),
        hardcoded.website,
        hardcoded.twitter,
        url,
        hardcoded.referralReward,
        hardcoded.riskLevel,
        hardcoded.deadline,
        hardcoded.addedAt
      );
    }
}

export function getReferralLink(campaignId: string): string | undefined {
  const db = getDb();
  const row = db
    .prepare("SELECT referral_link FROM campaigns WHERE id = ?")
    .get(campaignId) as { referral_link: string } | undefined;

  if (row?.referral_link) {
    return row.referral_link;
  }

  const hardcoded = CAMPAIGNS.find((c) => c.id === campaignId);
  return hardcoded?.referralLink || undefined;
}

export function getAllReferralLinks(): readonly ReferralEntry[] {
  const db = getDb();
  const dbRows = db
    .prepare(
      "SELECT id, name, referral_link FROM campaigns WHERE referral_link IS NOT NULL AND referral_link != ''"
    )
    .all() as readonly { id: string; name: string; referral_link: string }[];

  const dbMap = new Map(dbRows.map((r) => [r.id, r]));

  const merged: ReferralEntry[] = [];

  for (const row of dbRows) {
    merged.push({
      campaignId: row.id,
      campaignName: row.name,
      referralLink: row.referral_link,
    });
  }

  for (const campaign of CAMPAIGNS) {
    if (campaign.referralLink && !dbMap.has(campaign.id)) {
      merged.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        referralLink: campaign.referralLink,
      });
    }
  }

  return merged;
}

export function buildReferralUrl(
  campaignId: string,
  platform: Platform,
  content: UtmContent = "post"
): string | undefined {
  const baseUrl = getReferralLink(campaignId);
  if (!baseUrl) {
    return undefined;
  }

  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    return undefined;
  }

  if (!["https:", "http:"].includes(url.protocol)) {
    return undefined;
  }

  url.searchParams.set("utm_source", "claudex");
  url.searchParams.set("utm_medium", platform);
  url.searchParams.set("utm_campaign", campaignId);
  url.searchParams.set("utm_content", content);

  return url.toString();
}

export function getClickStats(campaignId: string): ClickStats {
  return {
    campaignId,
    totalClicks: 0,
    clicksByPlatform: {},
  };
}

export function getCampaignsWithReferrals(): readonly AirdropCampaign[] {
  const db = getDb();
  const dbRows = db
    .prepare(
      "SELECT id, referral_link FROM campaigns WHERE referral_link IS NOT NULL AND referral_link != ''"
    )
    .all() as readonly { id: string; referral_link: string }[];

  const referralMap = new Map(dbRows.map((r) => [r.id, r.referral_link]));

  return CAMPAIGNS.map((campaign) => {
    const dbLink = referralMap.get(campaign.id);
    if (dbLink) {
      return { ...campaign, referralLink: dbLink };
    }
    return campaign;
  });
}
