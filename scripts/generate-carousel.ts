import { CAMPAIGNS } from "../src/api/data.js";
import { generateFromCampaign } from "../src/core/carousel-pipeline.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const target = args[0];

  if (!target) {
    console.log(`Usage:
  npx tsx scripts/generate-carousel.ts <campaignId>
  npx tsx scripts/generate-carousel.ts all`);
    process.exit(1);
  }

  if (target === "all") {
    const activeCampaigns = CAMPAIGNS.filter(
      (c) => c.status === "active" && !c.tgeCompleted
    );
    console.log(
      `Generating carousels for ${activeCampaigns.length} active campaigns...\n`
    );

    for (const campaign of activeCampaigns) {
      console.log(`  ${campaign.name}...`);
      try {
        const paths = await generateFromCampaign(campaign);
        console.log(`    Generated ${paths.length} slides`);
        for (const p of paths) {
          console.log(`      ${p}`);
        }
        console.log();
      } catch (error) {
        console.error(
          `    Failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
    console.log("Done.");
    return;
  }

  const campaign = CAMPAIGNS.find((c) => c.id === target);
  if (!campaign) {
    console.error(`Campaign not found: ${target}`);
    console.log(
      `Available campaigns: ${CAMPAIGNS.map((c) => c.id).join(", ")}`
    );
    process.exit(1);
  }

  console.log(`Generating carousel for ${campaign.name}...\n`);
  const paths = await generateFromCampaign(campaign);
  console.log(`Generated ${paths.length} slides:`);
  for (const p of paths) {
    console.log(`  ${p}`);
  }
}

main().catch((error) => {
  console.error("Carousel generation failed:", error);
  process.exit(1);
});
