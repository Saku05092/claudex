/**
 * Claudex API Server
 *
 * Serves airdrop campaign data, monitoring insights, and discovery pipeline.
 *
 * Endpoints:
 *   GET  /api/campaigns               - Active campaigns (from DB)
 *   GET  /api/campaigns/all           - All campaigns including ended
 *   GET  /api/campaigns/:id           - Single campaign by ID
 *   GET  /api/monitor                 - Full monitoring dashboard data
 *   GET  /api/monitor/stats           - Monitoring statistics
 *   GET  /api/monitor/trending        - Trending projects from tweets
 *   GET  /api/monitor/influencers     - Top influencers
 *   GET  /api/monitor/tweets          - Recent collected tweets
 *   POST /api/monitor/run/keyword     - Run keyword search
 *   POST /api/monitor/run/influencer  - Run influencer search
 *   POST /api/monitor/run/both        - Run both
 *   POST /api/discovery/run/tweet     - Run tweet discovery
 *   POST /api/discovery/run/defilama  - Run DeFiLlama discovery
 *   POST /api/discovery/run/all       - Run all discovery
 *   GET  /api/health                  - Health check
 */
import "dotenv/config";
import cron from "node-cron";
import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { CAMPAIGNS } from "./data.js";
import { createDatabase } from "../core/database.js";
import { createTweetAnalyzer } from "../monitoring/tweet-analyzer.js";
import { createTwitterSearchClient } from "../monitoring/twitter-search.js";
import { createTweetRepository } from "../monitoring/tweet-repository.js";
import { createMonitorRunner } from "../monitoring/monitor-runner.js";
import { createCampaignRepository } from "../discovery/campaign-repository.js";
import { createDiscoveryPipeline } from "../discovery/discovery-pipeline.js";
import type { RunResult } from "../monitoring/types.js";

const PORT = Number(process.env.CLAUDEX_API_PORT ?? 3001);
const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN ?? "";
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";
const MAX_RESULTS = Number(process.env.TWITTER_MONITOR_MAX_RESULTS ?? 10);

const db = createDatabase();
const analyzer = createTweetAnalyzer(db);

// Campaign repository (DB-backed)
const campaignRepo = createCampaignRepository(db);
const seeded = campaignRepo.seedFromArray(CAMPAIGNS);
if (seeded > 0) {
  console.log(`[Claudex API] Seeded ${seeded} campaigns into DB`);
}

// Monitor runner
const searchClient = BEARER_TOKEN ? createTwitterSearchClient(BEARER_TOKEN) : null;
const tweetRepository = createTweetRepository(db);

// Discovery pipeline
const discoveryPipeline = CLAUDE_API_KEY
  ? createDiscoveryPipeline({ db, claudeApiKey: CLAUDE_API_KEY, maxNewCampaigns: 5 })
  : null;

let runningJob: string | null = null;

function jsonResponse(data: unknown, status: number = 200): { body: string; status: number; headers: Record<string, string> } {
  return {
    body: JSON.stringify(data),
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  };
}

// --- Monitor Run Handler ---

async function handleMonitorRun(mode: "keyword" | "influencer" | "both"): Promise<{ body: string; status: number; headers: Record<string, string> }> {
  if (!searchClient) {
    return jsonResponse({ error: "TWITTER_BEARER_TOKEN not configured" }, 500);
  }
  if (runningJob) {
    return jsonResponse({ error: "A job is already running", job: runningJob }, 409);
  }

  runningJob = `monitor:${mode}`;

  try {
    const runner = createMonitorRunner({
      searchClient,
      repository: tweetRepository,
      config: { maxResults: MAX_RESULTS, enabled: true, bearerToken: BEARER_TOKEN },
    });

    const results: RunResult[] = [];

    if (mode === "keyword" || mode === "both") {
      results.push(await runner.runKeywordSearch());
    }
    if (mode === "influencer" || mode === "both") {
      results.push(await runner.runInfluencerSearch());
    }

    const totalNew = results.reduce((s, r) => s + r.tweetsNew, 0);
    const totalFound = results.reduce((s, r) => s + r.tweetsFound, 0);
    const totalCost = results.reduce((s, r) => s + r.estimatedCreditsUsed, 0);

    return jsonResponse({
      status: "completed",
      mode,
      results: results.map((r) => ({
        runType: r.runType,
        queriesExecuted: r.queriesExecuted,
        tweetsFound: r.tweetsFound,
        tweetsNew: r.tweetsNew,
        estimatedCost: `$${r.estimatedCreditsUsed.toFixed(3)}`,
      })),
      summary: {
        totalFound,
        totalNew,
        totalInDb: tweetRepository.getTweetCount(),
        estimatedCost: `$${totalCost.toFixed(3)}`,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return jsonResponse({ error: "Monitor run failed", message: msg }, 500);
  } finally {
    runningJob = null;
  }
}

// --- Discovery Run Handler ---

async function handleDiscoveryRun(mode: "tweet" | "defilama" | "all"): Promise<{ body: string; status: number; headers: Record<string, string> }> {
  if (!discoveryPipeline) {
    return jsonResponse({ error: "ANTHROPIC_API_KEY not configured" }, 500);
  }
  if (runningJob) {
    return jsonResponse({ error: "A job is already running", job: runningJob }, 409);
  }

  runningJob = `discovery:${mode}`;

  try {
    if (mode === "tweet") {
      const result = await discoveryPipeline.runTweetDiscovery();
      return jsonResponse({ status: "completed", ...result, totalCampaigns: campaignRepo.getCount() });
    }
    if (mode === "defilama") {
      const result = await discoveryPipeline.runDeFiLlamaDiscovery();
      return jsonResponse({ status: "completed", ...result, totalCampaigns: campaignRepo.getCount() });
    }
    // all
    const results = await discoveryPipeline.runAll();
    const totalRegistered = results.reduce((s, r) => s + r.registered, 0);
    return jsonResponse({
      status: "completed",
      results,
      totalRegistered,
      totalCampaigns: campaignRepo.getCount(),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return jsonResponse({ error: "Discovery failed", message: msg }, 500);
  } finally {
    runningJob = null;
  }
}

// --- Route Handler ---

function routeRequest(path: string): { body: string; status: number; headers: Record<string, string> } {
  // Health
  if (path === "/api/health") {
    const stats = analyzer.getStats();
    return jsonResponse({
      status: "ok",
      service: "claudex-api",
      version: "0.3.0",
      campaigns: campaignRepo.getCount(),
      activeCampaigns: campaignRepo.getActive().length,
      monitoredTweets: stats.totalTweets,
      timestamp: new Date().toISOString(),
    });
  }

  // Campaigns (from DB)
  if (path === "/api/campaigns") {
    const active = campaignRepo.getActive();
    return jsonResponse({
      count: active.length,
      campaigns: active,
      updatedAt: new Date().toISOString(),
    });
  }
  if (path === "/api/campaigns/all") {
    const all = campaignRepo.getAll();
    return jsonResponse({
      count: all.length,
      campaigns: all,
      updatedAt: new Date().toISOString(),
    });
  }
  if (path.startsWith("/api/campaigns/")) {
    const id = path.replace("/api/campaigns/", "");
    const campaign = campaignRepo.getById(id);
    if (campaign) {
      return jsonResponse(campaign);
    }
    return jsonResponse({ error: "Campaign not found" }, 404);
  }

  // Monitor
  if (path === "/api/monitor") {
    return jsonResponse(analyzer.getDashboardData());
  }
  if (path === "/api/monitor/stats") {
    return jsonResponse(analyzer.getStats());
  }
  if (path === "/api/monitor/trending") {
    return jsonResponse(analyzer.getTrendingProjects());
  }
  if (path === "/api/monitor/influencers") {
    return jsonResponse(analyzer.getTopInfluencers());
  }
  if (path === "/api/monitor/tweets") {
    return jsonResponse(analyzer.getRecentTweets());
  }

  return jsonResponse({
    error: "Not found",
    availableEndpoints: [
      "GET /api/health",
      "GET /api/campaigns",
      "GET /api/campaigns/all",
      "GET /api/campaigns/:id",
      "GET /api/monitor",
      "GET /api/monitor/stats",
      "GET /api/monitor/trending",
      "GET /api/monitor/influencers",
      "GET /api/monitor/tweets",
      "POST /api/monitor/run/{keyword|influencer|both}",
      "POST /api/discovery/run/{tweet|defilama|all}",
    ],
  }, 404);
}

function sendResponse(res: ServerResponse, response: { body: string; status: number; headers: Record<string, string> }): void {
  res.writeHead(response.status, response.headers);
  res.end(response.body);
}

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  // POST endpoints
  if (req.method === "POST") {
    const monitorModes: Record<string, "keyword" | "influencer" | "both"> = {
      "/api/monitor/run/keyword": "keyword",
      "/api/monitor/run/influencer": "influencer",
      "/api/monitor/run/both": "both",
    };

    const discoveryModes: Record<string, "tweet" | "defilama" | "all"> = {
      "/api/discovery/run/tweet": "tweet",
      "/api/discovery/run/defilama": "defilama",
      "/api/discovery/run/all": "all",
    };

    const monitorMode = monitorModes[url.pathname];
    if (monitorMode) {
      handleMonitorRun(monitorMode).then(
        (response) => sendResponse(res, response),
        (error) => {
          const msg = error instanceof Error ? error.message : String(error);
          sendResponse(res, jsonResponse({ error: msg }, 500));
        }
      );
      return;
    }

    const discoveryMode = discoveryModes[url.pathname];
    if (discoveryMode) {
      handleDiscoveryRun(discoveryMode).then(
        (response) => sendResponse(res, response),
        (error) => {
          const msg = error instanceof Error ? error.message : String(error);
          sendResponse(res, jsonResponse({ error: msg }, 500));
        }
      );
      return;
    }

    sendResponse(res, jsonResponse({ error: "Not found" }, 404));
    return;
  }

  // GET endpoints
  sendResponse(res, routeRequest(url.pathname));
});

// --- Cron: Monitoring ---
if (searchClient) {
  const monitorRunner = createMonitorRunner({
    searchClient,
    repository: tweetRepository,
    config: { maxResults: MAX_RESULTS, enabled: true, bearerToken: BEARER_TOKEN },
  });

  // Daily keyword search at 06:00 JST
  cron.schedule("0 6 * * *", async () => {
    if (runningJob) return;
    runningJob = "cron:keyword";
    console.log("[Cron] Running daily keyword search...");
    try {
      const result = await monitorRunner.runKeywordSearch();
      console.log(`[Cron] Keyword done: ${result.tweetsNew} new tweets, ~$${result.estimatedCreditsUsed.toFixed(3)}`);
    } catch (error) {
      console.error("[Cron] Keyword search failed:", error);
    } finally {
      runningJob = null;
    }
  }, { timezone: "Asia/Tokyo" });
  console.log("[Claudex API] Cron: keyword search daily at 06:00 JST");

  // Bi-monthly influencer search on 1st and 15th at 06:30 JST
  cron.schedule("30 6 1,15 * *", async () => {
    if (runningJob) return;
    runningJob = "cron:influencer";
    console.log("[Cron] Running influencer search...");
    try {
      const result = await monitorRunner.runInfluencerSearch();
      console.log(`[Cron] Influencer done: ${result.tweetsNew} new tweets, ~$${result.estimatedCreditsUsed.toFixed(3)}`);
    } catch (error) {
      console.error("[Cron] Influencer search failed:", error);
    } finally {
      runningJob = null;
    }
  }, { timezone: "Asia/Tokyo" });
  console.log("[Claudex API] Cron: influencer search on 1st & 15th at 06:30 JST");
}

// --- Cron: Discovery every 6 hours ---
if (discoveryPipeline) {
  cron.schedule("0 */6 * * *", async () => {
    if (runningJob) return;
    runningJob = "cron:discovery";
    console.log("[Cron] Running scheduled discovery...");
    try {
      const results = await discoveryPipeline.runAll();
      const totalRegistered = results.reduce((s, r) => s + r.registered, 0);
      console.log(`[Cron] Discovery done: ${totalRegistered} new campaigns`);
    } catch (error) {
      console.error("[Cron] Discovery failed:", error);
    } finally {
      runningJob = null;
    }
  }, { timezone: "Asia/Tokyo" });
  console.log("[Claudex API] Cron: discovery every 6 hours");
}

server.listen(PORT, () => {
  const stats = analyzer.getStats();
  console.log(`[Claudex API] Running on http://localhost:${PORT}`);
  console.log(`[Claudex API] Campaigns: ${campaignRepo.getCount()} (${campaignRepo.getActive().length} active)`);
  console.log(`[Claudex API] Monitored tweets: ${stats.totalTweets}`);
});

process.on("SIGINT", () => {
  db.close();
  process.exit(0);
});
