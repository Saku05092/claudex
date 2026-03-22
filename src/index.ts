import { loadConfig } from "./core/config.js";
import { createDatabase } from "./core/database.js";
import { createContentGenerator } from "./core/content-generator.js";
import { createScheduler } from "./core/scheduler.js";
import { fetchNewProtocols, checkForReferralProgram } from "./scrapers/defilama.js";
import type { ScheduledPost } from "./core/types.js";

async function main() {
  console.log("[Claudex] Starting AI-powered crypto content system...");

  // Load configuration
  const config = loadConfig();
  console.log("[Claudex] Configuration loaded");

  // Initialize database
  const db = createDatabase();
  console.log("[Claudex] Database initialized");

  // Initialize content generator (if API key available)
  const contentGen = config.ANTHROPIC_API_KEY
    ? createContentGenerator(config.ANTHROPIC_API_KEY)
    : null;

  if (contentGen) {
    console.log("[Claudex] Content generator ready (Claude Haiku)");
  } else {
    console.log("[Claudex] Warning: No ANTHROPIC_API_KEY - content generation disabled");
  }

  // Scan for new protocols
  console.log("[Claudex] Scanning DeFiLlama for new protocols...");
  try {
    const newProtocols = await fetchNewProtocols(7);
    console.log(`[Claudex] Found ${newProtocols.length} new protocols (last 7 days)`);

    // Check top protocols for referral programs
    const topProtocols = [...newProtocols]
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, 10);

    for (const protocol of topProtocols) {
      const referralCheck = await checkForReferralProgram(protocol.website);
      if (referralCheck.hasReferral) {
        console.log(
          `[Claudex] Referral found: ${protocol.name} (${protocol.website}) -> ${referralCheck.referralUrl ?? "check manually"}`
        );
      }
    }
  } catch (error) {
    console.error("[Claudex] DeFiLlama scan failed:", error);
  }

  // Initialize scheduler (semi-auto mode: log posts for approval)
  const scheduler = createScheduler({
    onPostReady: async (post: ScheduledPost) => {
      console.log(
        `[Claudex] Post ready for approval:`,
        JSON.stringify({
          platform: post.platform,
          scheduledAt: post.scheduledAt,
          status: post.status,
        })
      );

      // In semi-auto mode, save to DB for manual approval
      const stmt = db.prepare(`
        INSERT INTO scheduled_posts (id, platform, content_text, content_category, language, scheduled_at, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
      `);

      stmt.run(
        post.id,
        post.platform,
        post.content.text || "[Content to be generated]",
        post.content.category,
        post.content.language,
        post.scheduledAt.toISOString()
      );
    },
  });

  console.log("[Claudex] Scheduler initialized (semi-auto mode)");
  console.log("[Claudex] System ready. Press Ctrl+C to stop.");

  // Start scheduler
  scheduler.start();

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n[Claudex] Shutting down...");
    scheduler.stop();
    db.close();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("[Claudex] Fatal error:", error);
  process.exit(1);
});
