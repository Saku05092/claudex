import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { fetchAllProtocols } from "../scrapers/defilama.js";
import { checkForReferralProgram } from "../scrapers/defilama.js";

const ProjectResearchSchema = z.object({
  name: z.string().default(""),
  ticker: z.string().default(""),
  category: z.string().default("other"),
  chain: z.string().default("unknown"),
  description: z.string().default(""),
  descriptionEn: z.string().default(""),
  tier: z.enum(["S", "A", "B", "C"]).default("C"),
  status: z.enum(["active", "upcoming", "ended"]).default("active"),
  tgeCompleted: z.boolean().default(false),
  tasks: z.array(z.string()).default([]),
  estimatedValue: z.string().default("unknown"),
  fundingRaised: z.string().default("unknown"),
  backers: z.array(z.string()).default([]),
  website: z.string().default(""),
  twitter: z.string().default(""),
  referralReward: z.string().default(""),
  riskLevel: z.enum(["low", "medium", "high"]).default("high"),
  mentionCount: z.number().default(0),
  suitable: z.boolean().default(false),
  reason: z.string().default(""),
});

/**
 * Research result from investigating a project
 */
export interface ProjectResearch {
  readonly name: string;
  readonly ticker: string;
  readonly category: string;
  readonly chain: string;
  readonly description: string;
  readonly descriptionEn: string;
  readonly tier: "S" | "A" | "B" | "C";
  readonly status: "active" | "upcoming" | "ended";
  readonly tgeCompleted: boolean;
  readonly tasks: readonly string[];
  readonly estimatedValue: string;
  readonly fundingRaised: string;
  readonly backers: readonly string[];
  readonly website: string;
  readonly twitter: string;
  readonly referralLink: string;
  readonly referralReward: string;
  readonly riskLevel: "low" | "medium" | "high";
  readonly mentionCount: number;
  readonly suitable: boolean;
  readonly reason: string;
}

interface ResearchDeps {
  readonly anthropicApiKey: string;
}

export function createProjectResearcher(deps: ResearchDeps) {
  const client = new Anthropic({ apiKey: deps.anthropicApiKey });

  /**
   * Research a project by name using Claude API
   */
  async function research(projectName: string): Promise<ProjectResearch> {
    console.log(`[Research] Investigating: ${projectName}`);

    // Step 1: Check DeFiLlama for on-chain data
    const defiLlamaData = await checkDeFiLlama(projectName);
    console.log(
      `[Research] DeFiLlama: ${defiLlamaData ? `Found (TVL: $${defiLlamaData.tvl.toLocaleString()})` : "Not found"}`
    );

    // Step 2: Check for referral program
    let referralInfo: { hasReferral: boolean; referralUrl?: string } = { hasReferral: false };
    if (defiLlamaData?.website) {
      referralInfo = await checkForReferralProgram(defiLlamaData.website);
      console.log(
        `[Research] Referral: ${referralInfo.hasReferral ? `Found (${referralInfo.referralUrl ?? "check manually"})` : "Not found"}`
      );
    }

    // Step 3: Use Claude to research and evaluate
    const evaluation = await evaluateWithClaude(
      projectName,
      defiLlamaData,
      referralInfo
    );

    return evaluation;
  }

  async function checkDeFiLlama(
    name: string
  ): Promise<{
    readonly name: string;
    readonly tvl: number;
    readonly category: string;
    readonly chain: string;
    readonly website: string;
    readonly twitter: string | undefined;
  } | null> {
    try {
      const protocols = await fetchAllProtocols();
      const match = protocols.find(
        (p) => p.name.toLowerCase() === name.toLowerCase()
      );
      if (match) {
        return {
          name: match.name,
          tvl: match.tvl,
          category: match.category,
          chain: match.chain,
          website: match.website,
          twitter: match.twitter,
        };
      }
      // Fuzzy match
      const fuzzy = protocols.find((p) =>
        p.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(p.name.toLowerCase())
      );
      if (fuzzy) {
        return {
          name: fuzzy.name,
          tvl: fuzzy.tvl,
          category: fuzzy.category,
          chain: fuzzy.chain,
          website: fuzzy.website,
          twitter: fuzzy.twitter,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  async function evaluateWithClaude(
    projectName: string,
    defiLlamaData: Awaited<ReturnType<typeof checkDeFiLlama>>,
    referralInfo: { hasReferral: boolean; referralUrl?: string }
  ): Promise<ProjectResearch> {
    const contextParts = [
      `Project: ${projectName}`,
    ];

    if (defiLlamaData) {
      contextParts.push(
        `DeFiLlama data: TVL=$${defiLlamaData.tvl.toLocaleString()}, Category=${defiLlamaData.category}, Chain=${defiLlamaData.chain}, Website=${defiLlamaData.website}`
      );
    }

    if (referralInfo.hasReferral) {
      contextParts.push(
        `Referral program detected: ${referralInfo.referralUrl ?? "URL unknown"}`
      );
    }

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      system: `You are a crypto project analyst. Evaluate projects for airdrop potential and referral opportunities targeting Japanese DeFi beginners.

Return a JSON object with these fields:
- name: string (official project name)
- ticker: string (token ticker if known, empty if none)
- category: "defi" | "dex" | "bridge" | "lending" | "nft" | "gaming" | "infra" | "social" | "other"
- chain: string (primary chain)
- description: string (Japanese, 1-2 sentences for beginners)
- descriptionEn: string (English version)
- tier: "S" | "A" | "B" | "C" (S=confirmed airdrop/big project, A=very likely, B=possible, C=speculative)
- status: "active" | "upcoming" | "ended"
- tgeCompleted: boolean
- tasks: string[] (Japanese, what users should do, 3-5 items)
- estimatedValue: string (e.g. "$100-500" or "unknown")
- fundingRaised: string (e.g. "$10M" or "unknown")
- backers: string[] (notable investors)
- website: string
- twitter: string (handle with @)
- referralReward: string (reward description if known)
- riskLevel: "low" | "medium" | "high"
- mentionCount: number (estimated, based on your knowledge of how discussed this project is)
- suitable: boolean (true if worth adding to our airdrop dashboard)
- reason: string (Japanese, why suitable or not suitable)

Only return the JSON object, nothing else.`,
      messages: [
        {
          role: "user",
          content: `Evaluate this crypto project for our airdrop/referral dashboard:\n\n${contextParts.join("\n")}`,
        },
      ],
    });

    const rawText =
      response.content[0].type === "text" ? response.content[0].text : "{}";

    // Extract JSON from potential markdown code blocks
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    const text = jsonMatch ? jsonMatch[1].trim() : rawText.trim();

    try {
      const parsed = ProjectResearchSchema.parse(JSON.parse(text));
      return {
        ...parsed,
        referralLink: referralInfo.referralUrl ?? "",
      };
    } catch {
      return {
        name: projectName,
        ticker: "",
        category: "other",
        chain: "unknown",
        description: `${projectName}の調査中にエラーが発生しました。`,
        descriptionEn: `Error researching ${projectName}.`,
        tier: "C" as const,
        status: "active" as const,
        tgeCompleted: false,
        tasks: [],
        estimatedValue: "unknown",
        fundingRaised: "unknown",
        backers: [],
        website: "",
        twitter: "",
        referralLink: "",
        referralReward: "",
        riskLevel: "high" as const,
        mentionCount: 0,
        suitable: false,
        reason: "調査中にパースエラーが発生しました。手動確認が必要です。",
      };
    }
  }

  return { research };
}
