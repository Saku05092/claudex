import "dotenv/config";
import { createReferralDetector } from "../src/core/referral-detector.js";

const command = process.argv[2];

if (!command || !["scan", "auto"].includes(command)) {
  console.log(`Usage:
  npx tsx scripts/detect-referrals.ts scan    # Scan and display results
  npx tsx scripts/detect-referrals.ts auto    # Scan + auto-register high confidence`);
  process.exit(1);
}

async function main(): Promise<void> {
  const detector = createReferralDetector();

  console.log("[ReferralDetector] Scanning for new referral programs...");
  const scanResult = await detector.scanForNewReferrals();

  console.log(`\n=== Scan Results ===`);
  console.log(`Protocols scanned (DeFiLlama): ${scanResult.scannedProtocols}`);
  console.log(`Trending projects scanned:     ${scanResult.scannedTrending}`);
  console.log(`Referral programs detected:    ${scanResult.detected.length}`);

  if (scanResult.detected.length === 0) {
    console.log("\nNo new referral programs detected.");
    process.exit(0);
  }

  console.log("\n--- Detected Referrals ---");
  for (const referral of scanResult.detected) {
    const confidenceTag =
      referral.confidence === "high"
        ? "[HIGH]"
        : referral.confidence === "medium"
          ? "[MED]"
          : "[LOW]";
    console.log(
      `  ${confidenceTag} ${referral.campaignName} (${referral.source}) - ${referral.referralUrl || "URL unknown"}`
    );
  }

  if (command === "auto") {
    console.log("\n--- Auto-registering high-confidence referrals ---");
    const registerResult = detector.autoRegisterReferrals(scanResult.detected);

    console.log(`Registered: ${registerResult.registered}`);
    console.log(`Skipped:    ${registerResult.skipped}`);

    for (const detail of registerResult.details) {
      const tag = detail.status === "registered" ? "[OK]" : "[SKIP]";
      console.log(`  ${tag} ${detail.campaignName}`);
    }
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("[ReferralDetector] Fatal error:", error);
  process.exit(1);
});
