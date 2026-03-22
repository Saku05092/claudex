import {
  fetchNewProtocols,
  checkForReferralProgram,
} from "../src/scrapers/defilama.js";

async function main(): Promise<void> {
  console.log("=== DeFiLlama New Protocol Scanner ===");
  console.log(`Scan date: ${new Date().toISOString()}`);
  console.log("Criteria: Listed in last 7 days, TVL > $100,000\n");

  console.log("Fetching protocols from DeFiLlama API...");
  const newProtocols = await fetchNewProtocols(7);

  if (newProtocols.length === 0) {
    console.log("No new protocols found matching criteria.");
    return;
  }

  const sorted = [...newProtocols].sort((a, b) => b.tvl - a.tvl);
  const top10 = sorted.slice(0, 10);

  console.log(`Found ${newProtocols.length} new protocol(s). Showing top ${top10.length} by TVL:\n`);
  console.log("-".repeat(80));

  for (const [index, protocol] of top10.entries()) {
    const rank = index + 1;
    const tvlFormatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(protocol.tvl);

    console.log(
      `\n#${rank} ${protocol.name}` +
        `\n   Category: ${protocol.category}` +
        `\n   Chain:    ${protocol.chain}` +
        `\n   TVL:      ${tvlFormatted}` +
        `\n   24h:      ${protocol.tvlChange24h > 0 ? "+" : ""}${protocol.tvlChange24h?.toFixed(2) ?? "N/A"}%` +
        `\n   Listed:   ${protocol.firstSeen.toISOString().split("T")[0]}` +
        `\n   Website:  ${protocol.website}` +
        (protocol.twitter ? `\n   Twitter:  @${protocol.twitter}` : "")
    );
  }

  console.log("\n" + "=".repeat(80));
  console.log("Checking top 10 websites for referral programs...\n");

  const results: Array<{
    readonly name: string;
    readonly hasReferral: boolean;
    readonly referralUrl?: string;
  }> = [];

  for (const protocol of top10) {
    if (!protocol.website) {
      results.push({ name: protocol.name, hasReferral: false });
      continue;
    }

    process.stdout.write(`  Checking ${protocol.name}... `);
    const referralResult = await checkForReferralProgram(protocol.website);
    results.push({
      name: protocol.name,
      hasReferral: referralResult.hasReferral,
      referralUrl: referralResult.referralUrl,
    });
    console.log(referralResult.hasReferral ? "FOUND" : "none");
  }

  console.log("\n" + "=".repeat(80));
  console.log("REFERRAL PROGRAM SUMMARY\n");

  const withReferral = results.filter((r) => r.hasReferral);
  const withoutReferral = results.filter((r) => !r.hasReferral);

  if (withReferral.length > 0) {
    console.log(`Protocols WITH referral programs (${withReferral.length}):`);
    for (const r of withReferral) {
      console.log(`  [+] ${r.name}${r.referralUrl ? ` -> ${r.referralUrl}` : ""}`);
    }
  } else {
    console.log("No referral programs detected in top 10.");
  }

  if (withoutReferral.length > 0) {
    console.log(`\nProtocols without referral programs (${withoutReferral.length}):`);
    for (const r of withoutReferral) {
      console.log(`  [-] ${r.name}`);
    }
  }

  console.log(`\nTotal new protocols found: ${newProtocols.length}`);
  console.log(`Referral programs detected: ${withReferral.length}/${top10.length}`);
  console.log("\nScan complete.");
}

main().catch((error: unknown) => {
  console.error("Scanner failed:", error);
  process.exit(1);
});
