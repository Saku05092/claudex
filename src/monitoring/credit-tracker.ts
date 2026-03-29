import type { CreditEstimate } from "./types.js";

/**
 * Estimates X API credit usage based on empirical measurements.
 *
 * Observed rates (2026-03):
 * - Cost is proportional to tweets returned, not queries sent
 * - ~$0.002-0.005 per tweet returned
 * - Failed queries (400 errors) are refunded
 */
const COST_PER_TWEET = 0.005;

export function estimateCreditUsage(
  queriesRun: number,
  tweetsReturned: number
): CreditEstimate {
  return {
    queriesRun,
    tweetsReturned,
    estimatedCost: tweetsReturned * COST_PER_TWEET,
  };
}

export function logCreditUsage(estimate: CreditEstimate): void {
  console.log(
    `[Monitor Credit] Queries: ${estimate.queriesRun} | ` +
      `Tweets: ${estimate.tweetsReturned} | ` +
      `Est. cost: $${estimate.estimatedCost.toFixed(3)}`
  );
}
