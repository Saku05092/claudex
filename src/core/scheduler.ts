import cron from "node-cron";
import type { PostSchedule, ScheduledPost, PlatformId } from "./types.js";
import { DEFAULT_SCHEDULE } from "./types.js";
import { randomUUID } from "crypto";

interface SchedulerDeps {
  readonly onPostReady: (post: ScheduledPost) => Promise<void>;
  readonly schedule?: PostSchedule;
}

export function createScheduler(deps: SchedulerDeps) {
  const schedule = deps.schedule ?? DEFAULT_SCHEDULE;
  let cronTask: cron.ScheduledTask | null = null;

  function start(): void {
    // Run every hour during active hours (JST)
    cronTask = cron.schedule(
      "0 * * * *",
      async () => {
        const now = new Date();
        const jstHour =
          (now.getUTCHours() + 9) % 24;

        if (
          jstHour < schedule.activeHoursJST[0] ||
          jstHour > schedule.activeHoursJST[1]
        ) {
          return;
        }

        // Determine if we should post this hour
        const shouldPost = Math.random() < 0.4; // ~40% chance per hour = ~5 posts in 15 active hours
        if (!shouldPost) return;

        const platform = pickRandomPlatform(schedule.platforms);
        const post = createPendingPost(platform);
        await deps.onPostReady(post);
      },
      { timezone: "Asia/Tokyo" }
    );
  }

  function stop(): void {
    cronTask?.stop();
    cronTask = null;
  }

  return { start, stop };
}

function pickRandomPlatform(
  platforms: readonly PlatformId[]
): PlatformId {
  const index = Math.floor(Math.random() * platforms.length);
  return platforms[index];
}

function createPendingPost(platform: PlatformId): ScheduledPost {
  return {
    id: randomUUID(),
    content: {
      text: "",
      category: "engagement",
      language: "ja",
      platforms: [platform],
      disclaimer: "DYOR - NFA. PR",
      hashtags: [],
      imageRequired: platform === "instagram",
    },
    platform,
    scheduledAt: new Date(),
    status: "pending",
  };
}
