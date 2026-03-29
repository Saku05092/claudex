import Anthropic from "@anthropic-ai/sdk";
import type { AirdropCampaign } from "../api/data.js";

export interface ProjectCandidate {
  readonly name: string;
  readonly mentions: number;
  readonly sampleTweets: readonly string[];
  readonly defiLlamaData?: {
    readonly category: string;
    readonly chain: string;
    readonly tvl: number;
    readonly website: string;
    readonly twitter?: string;
    readonly hasReferral: boolean;
    readonly referralUrl?: string;
  };
}

export interface EvaluationResult {
  readonly worthy: boolean;
  readonly reason: string;
  readonly campaign?: AirdropCampaign;
}

export function createCampaignEvaluator(apiKey: string) {
  const client = new Anthropic({ apiKey });

  async function evaluate(candidate: ProjectCandidate): Promise<EvaluationResult> {
    const prompt = buildEvaluationPrompt(candidate);

    try {
      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      });

      const text = response.content[0].type === "text" ? response.content[0].text : "";

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { worthy: false, reason: "Failed to parse evaluation response" };
      }

      const parsed = JSON.parse(jsonMatch[0]);

      if (!parsed.worthy) {
        return { worthy: false, reason: parsed.reason ?? "Not deemed worthy" };
      }

      const id = candidate.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const today = new Date().toISOString().split("T")[0];

      const campaign: AirdropCampaign = {
        id,
        name: parsed.name ?? candidate.name,
        ticker: parsed.ticker ?? "",
        category: parsed.category ?? "Other",
        chain: parsed.chain ?? "",
        tier: validateTier(parsed.tier),
        status: "active",
        tgeCompleted: false,
        description: parsed.description ?? "",
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
        estimatedValue: parsed.estimatedValue ?? "",
        fundingRaised: parsed.fundingRaised ?? "",
        backers: Array.isArray(parsed.backers) ? parsed.backers : [],
        website: parsed.website ?? candidate.defiLlamaData?.website ?? "",
        twitter: parsed.twitter ?? candidate.defiLlamaData?.twitter ?? "",
        referralLink: parsed.referralLink ?? candidate.defiLlamaData?.referralUrl ?? "",
        referralReward: parsed.referralReward ?? "",
        riskLevel: validateRisk(parsed.riskLevel),
        deadline: parsed.deadline ?? "",
        addedAt: today,
      };

      return {
        worthy: true,
        reason: parsed.reason ?? "Evaluated as worthy",
        campaign,
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      return { worthy: false, reason: `Evaluation error: ${msg}` };
    }
  }

  return { evaluate };
}

const SYSTEM_PROMPT = `You are a crypto airdrop analyst evaluating potential airdrop opportunities for Japanese users.
Your task is to determine if a project is a legitimate airdrop opportunity worth tracking.

Respond ONLY with valid JSON (no markdown, no code blocks) in this format:
{
  "worthy": true/false,
  "reason": "Brief explanation in Japanese",
  "name": "Official project name",
  "ticker": "$TICKER or empty",
  "category": "DEX/L2/Bridge/Wallet/NFT/Restaking/Lending/Other",
  "chain": "Ethereum/Solana/Multi-chain/etc",
  "tier": "S/A/B/C",
  "description": "Brief description in Japanese (2-3 sentences)",
  "tasks": [{"title": "Task title", "description": "What to do"}],
  "estimatedValue": "$100-500",
  "fundingRaised": "$XM or empty",
  "backers": ["Backer1", "Backer2"],
  "website": "https://...",
  "twitter": "@handle",
  "referralLink": "",
  "referralReward": "",
  "riskLevel": "low/medium/high",
  "deadline": "2026-XX-XX or empty"
}

Tier criteria:
- S: Massive funding ($100M+), confirmed airdrop, major backers
- A: Significant funding ($10M+), likely airdrop, notable backers
- B: Moderate potential, some community evidence
- C: Early stage, speculative

Mark as NOT worthy if:
- Obvious scam or rug pull indicators
- No evidence of actual project/product
- Already completed TGE with no future airdrop
- Too vague to evaluate`;

function buildEvaluationPrompt(candidate: ProjectCandidate): string {
  const parts: string[] = [
    `Evaluate this project as a potential airdrop opportunity:`,
    ``,
    `Project Name: ${candidate.name}`,
    `Mentions in airdrop tweets: ${candidate.mentions}`,
  ];

  if (candidate.defiLlamaData) {
    const d = candidate.defiLlamaData;
    parts.push(``);
    parts.push(`DeFiLlama Data:`);
    parts.push(`  Category: ${d.category}`);
    parts.push(`  Chain: ${d.chain}`);
    parts.push(`  TVL: $${d.tvl.toLocaleString()}`);
    parts.push(`  Website: ${d.website}`);
    if (d.twitter) parts.push(`  Twitter: ${d.twitter}`);
    parts.push(`  Has Referral Program: ${d.hasReferral}`);
    if (d.referralUrl) parts.push(`  Referral URL: ${d.referralUrl}`);
  }

  if (candidate.sampleTweets.length > 0) {
    parts.push(``);
    parts.push(`Sample tweets mentioning this project:`);
    for (const tweet of candidate.sampleTweets) {
      parts.push(`  - "${tweet}"`);
    }
  }

  return parts.join("\n");
}

function validateTier(tier: unknown): "S" | "A" | "B" | "C" {
  if (tier === "S" || tier === "A" || tier === "B" || tier === "C") return tier;
  return "B";
}

function validateRisk(risk: unknown): "low" | "medium" | "high" {
  if (risk === "low" || risk === "medium" || risk === "high") return risk;
  return "high";
}
