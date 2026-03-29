import cron from "node-cron";
import type { createMonitorRunner } from "./monitor-runner.js";

interface MonitorSchedulerDeps {
  readonly runner: ReturnType<typeof createMonitorRunner>;
  readonly enabled: boolean;
}

export function createMonitorScheduler(deps: MonitorSchedulerDeps) {
  const tasks: cron.ScheduledTask[] = [];

  function start(): void {
    if (!deps.enabled) {
      console.log("[Monitor Scheduler] Disabled (TWITTER_MONITOR_ENABLED=false)");
      return;
    }

    // Daily keyword search at 6:00 AM JST
    const keywordTask = cron.schedule(
      "0 6 * * *",
      async () => {
        console.log("[Monitor Scheduler] Running daily keyword search...");
        try {
          const result = await deps.runner.runKeywordSearch();
          console.log(
            `[Monitor Scheduler] Keyword done: ${result.tweetsNew} new tweets, ~$${result.estimatedCreditsUsed.toFixed(3)}`
          );
        } catch (error) {
          console.error("[Monitor Scheduler] Keyword search failed:", error);
        }
      },
      { timezone: "Asia/Tokyo" }
    );
    tasks.push(keywordTask);

    // Bi-monthly influencer search at 6:00 AM JST on 1st and 15th
    const influencerTask = cron.schedule(
      "0 6 1,15 * *",
      async () => {
        console.log("[Monitor Scheduler] Running influencer search...");
        try {
          const result = await deps.runner.runInfluencerSearch();
          console.log(
            `[Monitor Scheduler] Influencer done: ${result.tweetsNew} new tweets, ~$${result.estimatedCreditsUsed.toFixed(3)}`
          );
        } catch (error) {
          console.error("[Monitor Scheduler] Influencer search failed:", error);
        }
      },
      { timezone: "Asia/Tokyo" }
    );
    tasks.push(influencerTask);

    console.log("[Monitor Scheduler] Started");
    console.log("  - Keyword search: Daily at 06:00 JST");
    console.log("  - Influencer search: 1st & 15th at 06:00 JST");
  }

  function stop(): void {
    for (const task of tasks) {
      task.stop();
    }
    console.log("[Monitor Scheduler] Stopped");
  }

  return { start, stop };
}
