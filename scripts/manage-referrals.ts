import {
  setReferralLink,
  getReferralLink,
  getAllReferralLinks,
  buildReferralUrl,
} from "../src/core/referral-manager.js";

type Platform = "twitter" | "telegram" | "discord" | "instagram" | "web";

const VALID_PLATFORMS: readonly Platform[] = [
  "twitter",
  "telegram",
  "discord",
  "instagram",
  "web",
];

function printUsage(): void {
  console.log(`Usage:
  npx tsx scripts/manage-referrals.ts set <campaignId> <url>
  npx tsx scripts/manage-referrals.ts get <campaignId>
  npx tsx scripts/manage-referrals.ts list
  npx tsx scripts/manage-referrals.ts build <campaignId> <platform>`);
}

function main(): void {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    printUsage();
    process.exit(1);
  }

  switch (command) {
    case "set": {
      const campaignId = args[1];
      const url = args[2];
      if (!campaignId || !url) {
        console.error("Error: campaignId and url are required");
        printUsage();
        process.exit(1);
      }
      try {
        const parsed = new URL(url);
        if (!["https:", "http:"].includes(parsed.protocol)) {
          console.error("Error: only http/https URLs are allowed");
          process.exit(1);
        }
      } catch {
        console.error("Error: invalid URL format");
        process.exit(1);
      }
      setReferralLink(campaignId, url);
      console.log(`Referral link set for ${campaignId}: ${url}`);
      break;
    }

    case "get": {
      const campaignId = args[1];
      if (!campaignId) {
        console.error("Error: campaignId is required");
        printUsage();
        process.exit(1);
      }
      const link = getReferralLink(campaignId);
      if (link) {
        console.log(`${campaignId}: ${link}`);
      } else {
        console.log(`No referral link found for ${campaignId}`);
      }
      break;
    }

    case "list": {
      const links = getAllReferralLinks();
      if (links.length === 0) {
        console.log("No referral links configured.");
        break;
      }
      console.log("Referral Links:\n");
      for (const entry of links) {
        console.log(`  ${entry.campaignId} (${entry.campaignName})`);
        console.log(`    ${entry.referralLink}\n`);
      }
      break;
    }

    case "build": {
      const campaignId = args[1];
      const platform = args[2] as Platform;
      if (!campaignId || !platform) {
        console.error("Error: campaignId and platform are required");
        printUsage();
        process.exit(1);
      }
      if (!VALID_PLATFORMS.includes(platform)) {
        console.error(
          `Error: platform must be one of: ${VALID_PLATFORMS.join(", ")}`
        );
        process.exit(1);
      }
      const url = buildReferralUrl(campaignId, platform);
      if (url) {
        console.log(`UTM URL for ${campaignId} (${platform}):\n  ${url}`);
      } else {
        console.log(`No referral link found for ${campaignId}`);
      }
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      printUsage();
      process.exit(1);
  }
}

main();
