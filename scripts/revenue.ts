import "dotenv/config";
import { createRevenueTracker } from "../src/core/revenue-tracker.js";

const command = process.argv[2];

if (!command || !["summary", "record", "monthly"].includes(command)) {
  console.log(`Usage:
  npx tsx scripts/revenue.ts summary                                       # Show revenue summary
  npx tsx scripts/revenue.ts record <campaignId> <platform> <amount> <signups>  # Record revenue entry
  npx tsx scripts/revenue.ts monthly                                       # Monthly breakdown`);
  process.exit(1);
}

function main(): void {
  const tracker = createRevenueTracker();

  switch (command) {
    case "summary": {
      const days = process.argv[3] ? Number(process.argv[3]) : undefined;
      const summary = tracker.getRevenueSummary(days);

      console.log("=== Revenue Summary ===");
      if (days) {
        console.log(`Period: Last ${days} days`);
      }
      console.log(`Total Revenue:  $${summary.totalEstimatedRevenue.toFixed(2)}`);
      console.log(`Total Clicks:   ${summary.totalClicks}`);
      console.log(`Total Signups:  ${summary.totalSignups}`);

      if (summary.topCampaigns.length > 0) {
        console.log("\n--- Top Campaigns ---");
        for (const campaign of summary.topCampaigns) {
          console.log(
            `  ${campaign.name}: $${campaign.revenue.toFixed(2)} (${campaign.clicks} clicks)`
          );
        }
      }

      if (summary.revenueByPlatform.length > 0) {
        console.log("\n--- By Platform ---");
        for (const entry of summary.revenueByPlatform) {
          console.log(`  ${entry.platform}: $${entry.revenue.toFixed(2)}`);
        }
      }

      if (summary.revenueByMonth.length > 0) {
        console.log("\n--- By Month ---");
        for (const entry of summary.revenueByMonth) {
          console.log(`  ${entry.month}: $${entry.revenue.toFixed(2)}`);
        }
      }
      break;
    }

    case "record": {
      const campaignId = process.argv[3];
      const platform = process.argv[4];
      const amount = Number(process.argv[5]);
      const signups = Number(process.argv[6]);

      if (!campaignId || !platform || isNaN(amount) || isNaN(signups)) {
        console.error("Usage: npx tsx scripts/revenue.ts record <campaignId> <platform> <amount> <signups>");
        process.exit(1);
      }

      const entry = tracker.recordRevenue(campaignId, platform, amount, signups);
      console.log("Revenue recorded:");
      console.log(`  Campaign: ${entry.campaignId}`);
      console.log(`  Platform: ${entry.platform}`);
      console.log(`  Revenue:  $${entry.estimatedRevenue.toFixed(2)}`);
      console.log(`  Signups:  ${entry.referralSignups}`);
      console.log(`  At:       ${entry.recordedAt}`);
      break;
    }

    case "monthly": {
      const monthly = tracker.getMonthlyRevenue();

      console.log("=== Monthly Revenue ===");
      if (monthly.length === 0) {
        console.log("No revenue data yet.");
      } else {
        for (const entry of monthly) {
          console.log(
            `  ${entry.month}: $${entry.revenue.toFixed(2)} (${entry.signups} signups)`
          );
        }
      }
      break;
    }
  }

  process.exit(0);
}

main();
