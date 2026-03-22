/**
 * CLI Pipeline: Research a project and optionally publish to dashboard
 *
 * Usage:
 *   npx tsx scripts/research-project.ts "ProjectName"
 *   npx tsx scripts/research-project.ts "ProjectName" --publish
 *   npx tsx scripts/research-project.ts "Project1" "Project2" "Project3" --publish
 */
import "dotenv/config";
import { createProjectResearcher } from "../src/core/project-researcher.js";
import { publishToDashboard } from "../src/core/dashboard-publisher.js";

async function main() {
  const args = process.argv.slice(2);
  const shouldPublish = args.includes("--publish");
  const projectNames = args.filter((a) => !a.startsWith("--"));

  if (projectNames.length === 0) {
    console.log("Usage: npx tsx scripts/research-project.ts <project_name> [--publish]");
    console.log("");
    console.log("Examples:");
    console.log('  npx tsx scripts/research-project.ts "Pendle"');
    console.log('  npx tsx scripts/research-project.ts "Pendle" --publish');
    console.log('  npx tsx scripts/research-project.ts "Pendle" "Morpho" "Kamino" --publish');
    process.exit(1);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[Error] ANTHROPIC_API_KEY not set in .env");
    process.exit(1);
  }

  const researcher = createProjectResearcher({ anthropicApiKey: apiKey });

  for (const name of projectNames) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`[Pipeline] Researching: ${name}`);
    console.log("=".repeat(60));

    try {
      const result = await researcher.research(name);

      console.log("\n--- Research Result ---");
      console.log(`Name:        ${result.name}`);
      console.log(`Ticker:      ${result.ticker || "(none)"}`);
      console.log(`Category:    ${result.category}`);
      console.log(`Chain:       ${result.chain}`);
      console.log(`Tier:        ${result.tier}`);
      console.log(`Status:      ${result.status}`);
      console.log(`TGE:         ${result.tgeCompleted ? "Completed" : "Not yet"}`);
      console.log(`Est. Value:  ${result.estimatedValue}`);
      console.log(`Funding:     ${result.fundingRaised}`);
      console.log(`Backers:     ${result.backers.join(", ") || "(unknown)"}`);
      console.log(`Referral:    ${result.referralLink || "(none)"}`);
      console.log(`Risk:        ${result.riskLevel}`);
      console.log(`Suitable:    ${result.suitable ? "YES" : "NO"}`);
      console.log(`Reason:      ${result.reason}`);
      console.log(`Description: ${result.description}`);
      console.log(`Tasks:       ${result.tasks.join(" / ") || "(none)"}`);

      if (shouldPublish) {
        if (result.suitable) {
          console.log("\n[Pipeline] Publishing to dashboard...");
          const pubResult = await publishToDashboard(result);
          console.log(pubResult.message);
        } else {
          console.log(`\n[Pipeline] Skipping publish: ${result.reason}`);
        }
      } else {
        if (result.suitable) {
          console.log(
            "\n[Pipeline] Project is suitable. Run with --publish to add to dashboard."
          );
        }
      }
    } catch (error) {
      console.error(`[Error] Failed to research ${name}:`, error);
    }
  }

  console.log("\n[Pipeline] Done.");
}

main();
