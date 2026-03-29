import type { SearchQuery, RunResult, MonitorConfig } from "./types.js";
import type { createTwitterSearchClient } from "./twitter-search.js";
import type { createTweetRepository } from "./tweet-repository.js";
import { buildKeywordQueries } from "./keyword-queries.js";
import { batchInfluencerQueries } from "./influencer-batcher.js";
import { estimateCreditUsage, logCreditUsage } from "./credit-tracker.js";

interface MonitorDeps {
  readonly searchClient: ReturnType<typeof createTwitterSearchClient>;
  readonly repository: ReturnType<typeof createTweetRepository>;
  readonly config: MonitorConfig;
}

const DELAY_BETWEEN_QUERIES_MS = 1500;

async function executeQueries(
  queries: readonly SearchQuery[],
  deps: MonitorDeps,
  runType: "keyword" | "influencer"
): Promise<RunResult> {
  const { searchClient, repository, config } = deps;
  const run = repository.startRun(runType);

  let totalTweetsFound = 0;
  let totalTweetsNew = 0;
  let queriesExecuted = 0;

  try {
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      console.log(
        `  [${i + 1}/${queries.length}] ${query.label}: "${query.query.slice(0, 60)}..."`
      );

      try {
        const tweets = await searchClient.searchRecent(query.query, {
          maxResults: config.maxResults,
          sourceType: query.sourceType,
          sourceQuery: query.label,
        });

        queriesExecuted++;
        totalTweetsFound += tweets.length;

        const saveResult = repository.saveTweets(tweets);
        totalTweetsNew += saveResult.saved;

        console.log(
          `    Found: ${tweets.length} | New: ${saveResult.saved} | Dup: ${saveResult.duplicates}`
        );
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`    ERROR: ${msg.slice(0, 100)}`);
        queriesExecuted++;
      }

      if (i < queries.length - 1) {
        await new Promise((r) => setTimeout(r, DELAY_BETWEEN_QUERIES_MS));
      }
    }

    const creditEstimate = estimateCreditUsage(queriesExecuted, totalTweetsFound);
    logCreditUsage(creditEstimate);

    repository.completeRun(run.id, {
      queriesExecuted,
      tweetsFound: totalTweetsFound,
      tweetsNew: totalTweetsNew,
      estimatedCreditsUsed: creditEstimate.estimatedCost,
    });

    return {
      runId: run.id,
      runType,
      queriesExecuted,
      tweetsFound: totalTweetsFound,
      tweetsNew: totalTweetsNew,
      estimatedCreditsUsed: creditEstimate.estimatedCost,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    repository.failRun(run.id, msg);
    throw error;
  }
}

export function createMonitorRunner(deps: MonitorDeps) {
  async function runKeywordSearch(): Promise<RunResult> {
    console.log("[Monitor] Starting keyword search...");
    const queries = buildKeywordQueries();
    return executeQueries(queries, deps, "keyword");
  }

  async function runInfluencerSearch(): Promise<RunResult> {
    console.log("[Monitor] Starting influencer search...");
    const queries = await batchInfluencerQueries();
    return executeQueries(queries, deps, "influencer");
  }

  return { runKeywordSearch, runInfluencerSearch };
}
