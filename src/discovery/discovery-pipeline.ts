import type Database from "better-sqlite3";
import { createCampaignRepository } from "./campaign-repository.js";
import { createCampaignEvaluator, type ProjectCandidate } from "./campaign-evaluator.js";
import { createTweetAnalyzer } from "../monitoring/tweet-analyzer.js";
import { fetchNewProtocols, checkForReferralProgram } from "../scrapers/defilama.js";

export interface DiscoveryResult {
  readonly mode: string;
  readonly evaluated: number;
  readonly registered: number;
  readonly skipped: number;
  readonly campaigns: readonly {
    readonly name: string;
    readonly action: "registered" | "skipped" | "exists";
    readonly reason: string;
  }[];
}

interface PipelineDeps {
  readonly db: Database.Database;
  readonly claudeApiKey: string;
  readonly maxNewCampaigns?: number;
}

export function createDiscoveryPipeline(deps: PipelineDeps) {
  const { db, claudeApiKey } = deps;
  const maxNew = deps.maxNewCampaigns ?? 5;

  const repo = createCampaignRepository(db);
  const evaluator = createCampaignEvaluator(claudeApiKey);
  const analyzer = createTweetAnalyzer(db);

  async function runTweetDiscovery(): Promise<DiscoveryResult> {
    console.log("[Discovery] Starting tweet-based discovery...");

    const knownNames = repo.getAllNames();
    const unknowns = analyzer.extractUnknownProjects(knownNames);

    console.log(`[Discovery] Found ${unknowns.length} unknown project candidates`);

    const results: DiscoveryResult["campaigns"][number][] = [];
    let evaluated = 0;
    let registered = 0;
    let skipped = 0;

    // Evaluate top candidates (capped)
    const toEvaluate = unknowns.slice(0, maxNew);

    for (const candidate of toEvaluate) {
      console.log(`  Evaluating: ${candidate.name} (${candidate.mentions} mentions)`);

      if (repo.existsByName(candidate.name)) {
        results.push({ name: candidate.name, action: "exists", reason: "Already registered" });
        skipped++;
        continue;
      }

      evaluated++;
      const result = await evaluator.evaluate({
        name: candidate.name,
        mentions: candidate.mentions,
        sampleTweets: candidate.sampleTweets,
      });

      if (result.worthy && result.campaign) {
        // Check again by generated ID
        if (!repo.existsById(result.campaign.id)) {
          repo.upsert(result.campaign, "tweet", false);
          registered++;
          results.push({ name: candidate.name, action: "registered", reason: result.reason });
          console.log(`    -> Registered as campaign: ${result.campaign.name} (${result.campaign.tier}-tier)`);
        } else {
          results.push({ name: candidate.name, action: "exists", reason: "ID already exists" });
          skipped++;
        }
      } else {
        results.push({ name: candidate.name, action: "skipped", reason: result.reason });
        skipped++;
        console.log(`    -> Skipped: ${result.reason}`);
      }

      // Rate limit for Claude API
      await new Promise((r) => setTimeout(r, 500));
    }

    console.log(`[Discovery] Tweet discovery done: ${registered} registered, ${skipped} skipped`);

    return { mode: "tweet", evaluated, registered, skipped, campaigns: results };
  }

  async function runDeFiLlamaDiscovery(): Promise<DiscoveryResult> {
    console.log("[Discovery] Starting DeFiLlama discovery...");

    const results: DiscoveryResult["campaigns"][number][] = [];
    let evaluated = 0;
    let registered = 0;
    let skipped = 0;

    try {
      const newProtocols = await fetchNewProtocols(14); // last 2 weeks
      console.log(`[Discovery] Found ${newProtocols.length} new protocols (14 days)`);

      // Sort by TVL, check top ones for referral
      const topProtocols = [...newProtocols]
        .sort((a, b) => b.tvl - a.tvl)
        .slice(0, 15);

      for (const protocol of topProtocols) {
        if (repo.existsByName(protocol.name)) {
          results.push({ name: protocol.name, action: "exists", reason: "Already registered" });
          skipped++;
          continue;
        }

        console.log(`  Checking referral: ${protocol.name} (TVL: $${protocol.tvl.toLocaleString()})`);

        const referralCheck = await checkForReferralProgram(protocol.website);

        // Only evaluate protocols with referral programs or high TVL
        if (!referralCheck.hasReferral && protocol.tvl < 5_000_000) {
          results.push({ name: protocol.name, action: "skipped", reason: "No referral, low TVL" });
          skipped++;
          continue;
        }

        evaluated++;
        const candidate: ProjectCandidate = {
          name: protocol.name,
          mentions: 0,
          sampleTweets: [],
          defiLlamaData: {
            category: protocol.category,
            chain: protocol.chain,
            tvl: protocol.tvl,
            website: protocol.website,
            twitter: protocol.twitter,
            hasReferral: referralCheck.hasReferral,
            referralUrl: referralCheck.referralUrl,
          },
        };

        const result = await evaluator.evaluate(candidate);

        if (result.worthy && result.campaign) {
          if (!repo.existsById(result.campaign.id)) {
            repo.upsert(result.campaign, "defilama", false);
            registered++;
            results.push({ name: protocol.name, action: "registered", reason: result.reason });
            console.log(`    -> Registered: ${result.campaign.name} (${result.campaign.tier}-tier)`);
          } else {
            results.push({ name: protocol.name, action: "exists", reason: "ID already exists" });
            skipped++;
          }
        } else {
          results.push({ name: protocol.name, action: "skipped", reason: result.reason });
          skipped++;
          console.log(`    -> Skipped: ${result.reason}`);
        }

        // Rate limit
        await new Promise((r) => setTimeout(r, 1000));

        if (registered >= maxNew) break;
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[Discovery] DeFiLlama error: ${msg}`);
    }

    console.log(`[Discovery] DeFiLlama discovery done: ${registered} registered, ${skipped} skipped`);

    return { mode: "defilama", evaluated, registered, skipped, campaigns: results };
  }

  async function runAll(): Promise<readonly DiscoveryResult[]> {
    const tweetResult = await runTweetDiscovery();
    const defiResult = await runDeFiLlamaDiscovery();
    return [tweetResult, defiResult];
  }

  return { runTweetDiscovery, runDeFiLlamaDiscovery, runAll };
}
