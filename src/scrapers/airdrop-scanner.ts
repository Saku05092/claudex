import type { AirdropOpportunity } from "../data/airdrop-opportunities.js";
import { checkForReferralProgram, fetchProtocolTvl } from "./defilama.js";

// --- Evaluation Criteria ---

interface EvaluationSignal {
  readonly name: string;
  readonly weight: number;
  readonly met: boolean;
  readonly detail: string;
}

interface EvaluationResult {
  readonly score: number;
  readonly maxScore: number;
  readonly tier: AirdropOpportunity["tier"];
  readonly signals: readonly EvaluationSignal[];
  readonly recommendation: string;
}

interface ReferralCheckResult {
  readonly hasReferral: boolean;
  readonly referralUrl?: string;
}

interface DashboardEntry {
  readonly id: string;
  readonly name: string;
  readonly tier: string;
  readonly tierEmoji: string;
  readonly status: string;
  readonly chain: string;
  readonly description: string;
  readonly estimatedValue: string;
  readonly mentionCount: number;
  readonly riskLevel: string;
  readonly fundingRaised: string;
  readonly topMentions: readonly string[];
  readonly taskCount: number;
  readonly hasReferral: boolean;
  readonly deadline: string;
}

interface MergeUpdate {
  readonly newMentionCount: number;
  readonly newMentionedBy: readonly string[];
  readonly source: string;
}

// --- Scoring Constants ---

const FUNDING_THRESHOLD = 5_000_000;
const TVL_THRESHOLD = 1_000_000;
const INFLUENCER_MENTION_THRESHOLD = 3;

const SIGNAL_WEIGHTS = {
  funding: 25,
  tvl: 20,
  influencerMentions: 20,
  referralProgram: 15,
  tokenAnnounced: 20,
} as const;

// --- Evaluation Functions ---

export function evaluateAirdropOpportunity(params: {
  readonly fundingRaised: number;
  readonly tvl: number;
  readonly influencerMentionCount: number;
  readonly hasReferralProgram: boolean;
  readonly tokenAnnounced: boolean;
  readonly projectName: string;
}): EvaluationResult {
  const signals: readonly EvaluationSignal[] = [
    {
      name: "Funding",
      weight: SIGNAL_WEIGHTS.funding,
      met: params.fundingRaised >= FUNDING_THRESHOLD,
      detail:
        params.fundingRaised >= FUNDING_THRESHOLD
          ? `Raised $${(params.fundingRaised / 1_000_000).toFixed(1)}M (above $5M threshold)`
          : `Raised $${(params.fundingRaised / 1_000_000).toFixed(1)}M (below $5M threshold)`,
    },
    {
      name: "TVL",
      weight: SIGNAL_WEIGHTS.tvl,
      met: params.tvl >= TVL_THRESHOLD,
      detail:
        params.tvl >= TVL_THRESHOLD
          ? `TVL $${(params.tvl / 1_000_000).toFixed(1)}M (above $1M threshold)`
          : `TVL $${(params.tvl / 1_000_000).toFixed(1)}M (below $1M threshold)`,
    },
    {
      name: "Influencer Mentions",
      weight: SIGNAL_WEIGHTS.influencerMentions,
      met: params.influencerMentionCount >= INFLUENCER_MENTION_THRESHOLD,
      detail: `${params.influencerMentionCount} influencers mention this (threshold: ${INFLUENCER_MENTION_THRESHOLD})`,
    },
    {
      name: "Referral Program",
      weight: SIGNAL_WEIGHTS.referralProgram,
      met: params.hasReferralProgram,
      detail: params.hasReferralProgram
        ? "Active referral/points program detected"
        : "No referral program detected",
    },
    {
      name: "Token Announced",
      weight: SIGNAL_WEIGHTS.tokenAnnounced,
      met: params.tokenAnnounced,
      detail: params.tokenAnnounced
        ? "Token officially announced or confirmed"
        : "No token announcement found",
    },
  ];

  const score = signals
    .filter((s) => s.met)
    .reduce((sum, s) => sum + s.weight, 0);
  const maxScore = signals.reduce((sum, s) => sum + s.weight, 0);
  const tier = scoreTier(score, maxScore);

  const recommendation = buildRecommendation(tier, signals, params.projectName);

  return { score, maxScore, tier, signals, recommendation };
}

function scoreTier(
  score: number,
  maxScore: number
): AirdropOpportunity["tier"] {
  const percentage = score / maxScore;
  if (percentage >= 0.8) return "S";
  if (percentage >= 0.6) return "A";
  if (percentage >= 0.4) return "B";
  return "C";
}

function buildRecommendation(
  tier: AirdropOpportunity["tier"],
  signals: readonly EvaluationSignal[],
  projectName: string
): string {
  const metSignals = signals.filter((s) => s.met);
  const missedSignals = signals.filter((s) => !s.met);

  const tierDescriptions: Record<AirdropOpportunity["tier"], string> = {
    S: "High-priority target",
    A: "Strong candidate",
    B: "Worth monitoring",
    C: "Speculative, low priority",
  };

  const parts = [
    `[${tier}] ${projectName}: ${tierDescriptions[tier]}.`,
    `Positive signals: ${metSignals.map((s) => s.name).join(", ") || "None"}.`,
  ];

  if (missedSignals.length > 0) {
    parts.push(
      `Missing: ${missedSignals.map((s) => s.name).join(", ")}.`
    );
  }

  return parts.join(" ");
}

// --- Referral Check ---

export async function checkProjectReferral(
  websiteUrl: string
): Promise<ReferralCheckResult> {
  return checkForReferralProgram(websiteUrl);
}

// --- TVL Check ---

export async function checkProjectTvl(
  protocolSlug: string
): Promise<{ readonly tvl: number; readonly hasSignificantTvl: boolean }> {
  try {
    const data = await fetchProtocolTvl(protocolSlug);
    return {
      tvl: data.tvl,
      hasSignificantTvl: data.tvl >= TVL_THRESHOLD,
    };
  } catch {
    return { tvl: 0, hasSignificantTvl: false };
  }
}

// --- Dashboard Formatting ---

export function formatForDashboard(
  opportunity: AirdropOpportunity
): DashboardEntry {
  const tierEmojis: Record<AirdropOpportunity["tier"], string> = {
    S: "[S]",
    A: "[A]",
    B: "[B]",
    C: "[C]",
  };

  return {
    id: opportunity.id,
    name: opportunity.name,
    tier: opportunity.tier,
    tierEmoji: tierEmojis[opportunity.tier],
    status: opportunity.status,
    chain: opportunity.chain,
    description: opportunity.description,
    estimatedValue: opportunity.estimatedValue ?? "Unknown",
    mentionCount: opportunity.mentionCount,
    riskLevel: opportunity.riskLevel,
    fundingRaised: opportunity.fundingRaised ?? "Unknown",
    topMentions: opportunity.mentionedBy.slice(0, 5),
    taskCount: opportunity.tasks.length,
    hasReferral: opportunity.referralLink !== undefined && opportunity.referralLink !== "",
    deadline: opportunity.deadline ?? "No deadline",
  };
}

export function formatAllForDashboard(
  opportunities: readonly AirdropOpportunity[]
): readonly DashboardEntry[] {
  return [...opportunities]
    .sort((a, b) => {
      const tierOrder: Record<AirdropOpportunity["tier"], number> = {
        S: 0,
        A: 1,
        B: 2,
        C: 3,
      };
      const tierDiff = tierOrder[a.tier] - tierOrder[b.tier];
      if (tierDiff !== 0) return tierDiff;
      return b.mentionCount - a.mentionCount;
    })
    .map(formatForDashboard);
}

// --- Merge / Update Logic ---

export function mergeOpportunityUpdate(
  existing: AirdropOpportunity,
  update: MergeUpdate
): AirdropOpportunity {
  const combinedMentionedBy = [
    ...new Set([...existing.mentionedBy, ...update.newMentionedBy]),
  ];

  return {
    ...existing,
    mentionCount: Math.max(existing.mentionCount, update.newMentionCount),
    mentionedBy: combinedMentionedBy,
    updatedAt: new Date().toISOString(),
  };
}

export function mergeOpportunitySets(
  existing: readonly AirdropOpportunity[],
  incoming: readonly AirdropOpportunity[]
): readonly AirdropOpportunity[] {
  const existingMap = new Map(existing.map((o) => [o.id, o]));

  const updatedExisting = existing.map((existingOpp) => {
    const match = incoming.find((i) => i.id === existingOpp.id);
    if (!match) return existingOpp;

    return mergeOpportunityUpdate(existingOpp, {
      newMentionCount: match.mentionCount,
      newMentionedBy: [...match.mentionedBy],
      source: "merge",
    });
  });

  const newOpportunities = incoming.filter((i) => !existingMap.has(i.id));

  return [...updatedExisting, ...newOpportunities];
}

// --- Parsing Helpers ---

export function parseFundingString(funding: string): number {
  const match = funding.match(/\$?([\d.]+)\s*(M|B)/i);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const multiplier = match[2].toUpperCase() === "B" ? 1_000_000_000 : 1_000_000;
  return value * multiplier;
}

export function assessRiskLevel(
  opportunity: AirdropOpportunity
): AirdropOpportunity["riskLevel"] {
  const funding = parseFundingString(opportunity.fundingRaised ?? "");
  const hasStrongBackers =
    (opportunity.backers ?? []).length >= 2;

  if (funding >= 50_000_000 && hasStrongBackers && opportunity.mentionCount >= 5) {
    return "low";
  }
  if (funding >= 10_000_000 || (hasStrongBackers && opportunity.mentionCount >= 3)) {
    return "medium";
  }
  return "high";
}
