import type Database from "better-sqlite3";
import type { AirdropCampaign } from "../api/data.js";

export interface StoredCampaign extends AirdropCampaign {
  readonly source: "manual" | "tweet" | "defilama";
  readonly verified: boolean;
}

export function createCampaignRepository(db: Database.Database) {
  const insertCampaign = db.prepare(`
    INSERT OR IGNORE INTO campaigns
      (id, name, ticker, category, chain, tier, status, tge_completed,
       description, tasks, estimated_value, funding_raised, backers,
       website, twitter, referral_link, referral_reward,
       risk_level, deadline, added_at, source, verified)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const upsertCampaign = db.prepare(`
    INSERT OR REPLACE INTO campaigns
      (id, name, ticker, category, chain, tier, status, tge_completed,
       description, tasks, estimated_value, funding_raised, backers,
       website, twitter, referral_link, referral_reward,
       risk_level, deadline, added_at, source, verified, updated_at)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  const selectAll = db.prepare("SELECT * FROM campaigns ORDER BY tier, name");
  const selectActive = db.prepare(
    "SELECT * FROM campaigns WHERE status = 'active' AND tge_completed = 0 ORDER BY tier, name"
  );
  const selectById = db.prepare("SELECT * FROM campaigns WHERE id = ?");
  const selectByName = db.prepare(
    "SELECT * FROM campaigns WHERE LOWER(name) = LOWER(?)"
  );
  const countAll = db.prepare("SELECT COUNT(*) as count FROM campaigns");

  function mapRow(row: Record<string, unknown>): StoredCampaign {
    return {
      id: row.id as string,
      name: row.name as string,
      ticker: row.ticker as string,
      category: row.category as string,
      chain: row.chain as string,
      tier: row.tier as "S" | "A" | "B" | "C",
      status: row.status as "active" | "upcoming" | "ended",
      tgeCompleted: (row.tge_completed as number) === 1,
      description: row.description as string,
      tasks: JSON.parse((row.tasks as string) || "[]"),
      estimatedValue: row.estimated_value as string,
      fundingRaised: row.funding_raised as string,
      backers: JSON.parse((row.backers as string) || "[]"),
      website: row.website as string,
      twitter: row.twitter as string,
      referralLink: row.referral_link as string,
      referralReward: row.referral_reward as string,
      riskLevel: row.risk_level as "low" | "medium" | "high",
      deadline: row.deadline as string,
      addedAt: row.added_at as string,
      source: row.source as "manual" | "tweet" | "defilama",
      verified: (row.verified as number) === 1,
    };
  }

  function getAll(): readonly StoredCampaign[] {
    return (selectAll.all() as Record<string, unknown>[]).map(mapRow);
  }

  function getActive(): readonly StoredCampaign[] {
    return (selectActive.all() as Record<string, unknown>[]).map(mapRow);
  }

  function getById(id: string): StoredCampaign | undefined {
    const row = selectById.get(id) as Record<string, unknown> | undefined;
    return row ? mapRow(row) : undefined;
  }

  function existsById(id: string): boolean {
    return selectById.get(id) !== undefined;
  }

  function existsByName(name: string): boolean {
    return selectByName.get(name) !== undefined;
  }

  function getCount(): number {
    return (countAll.get() as { count: number }).count;
  }

  function upsert(
    campaign: AirdropCampaign,
    source: "manual" | "tweet" | "defilama" = "manual",
    verified: boolean = false
  ): void {
    upsertCampaign.run(
      campaign.id,
      campaign.name,
      campaign.ticker,
      campaign.category,
      campaign.chain,
      campaign.tier,
      campaign.status,
      campaign.tgeCompleted ? 1 : 0,
      campaign.description,
      JSON.stringify(campaign.tasks),
      campaign.estimatedValue,
      campaign.fundingRaised,
      JSON.stringify(campaign.backers),
      campaign.website,
      campaign.twitter,
      campaign.referralLink,
      campaign.referralReward,
      campaign.riskLevel,
      campaign.deadline,
      campaign.addedAt,
      source,
      verified ? 1 : 0
    );
  }

  function seedFromArray(campaigns: readonly AirdropCampaign[]): number {
    let inserted = 0;
    const seed = db.transaction(() => {
      for (const c of campaigns) {
        const result = insertCampaign.run(
          c.id, c.name, c.ticker, c.category, c.chain,
          c.tier, c.status, c.tgeCompleted ? 1 : 0,
          c.description, JSON.stringify(c.tasks),
          c.estimatedValue, c.fundingRaised, JSON.stringify(c.backers),
          c.website, c.twitter, c.referralLink, c.referralReward,
          c.riskLevel, c.deadline, c.addedAt, "manual", 1
        );
        if (result.changes > 0) inserted++;
      }
    });
    seed();
    return inserted;
  }

  function getAllNames(): readonly string[] {
    const rows = db.prepare("SELECT name FROM campaigns").all() as { name: string }[];
    return rows.map((r) => r.name);
  }

  return {
    getAll, getActive, getById, existsById, existsByName,
    getCount, upsert, seedFromArray, getAllNames,
  };
}
