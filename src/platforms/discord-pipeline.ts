import {
  Client,
  GatewayIntentBits,
  Events,
  type Message,
} from "discord.js";
import { createProjectResearcher } from "../core/project-researcher.js";
import { publishToDashboard, removeFromDashboard } from "../core/dashboard-publisher.js";

interface DiscordPipelineConfig {
  readonly botToken: string;
  readonly anthropicApiKey: string;
  readonly adminChannelId?: string;
}

/**
 * Discord bot that accepts project research commands
 *
 * Commands:
 *   !research <project_name>           - Research a project
 *   !publish <project_name>            - Research and publish if suitable
 *   !remove <project_id>               - Remove a project from dashboard
 *   !batch <project1>, <project2>, ... - Research and publish multiple
 *   !help                              - Show commands
 */
export function createDiscordPipeline(config: DiscordPipelineConfig) {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  const researcher = createProjectResearcher({
    anthropicApiKey: config.anthropicApiKey,
  });

  client.on(Events.MessageCreate, async (message: Message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith("!")) return;

    // Optional: restrict to admin channel
    if (
      config.adminChannelId &&
      message.channel.id !== config.adminChannelId
    ) {
      return;
    }

    const parts = message.content.slice(1).split(" ");
    const command = parts[0].toLowerCase();
    const args = parts.slice(1).join(" ").trim();

    switch (command) {
      case "research":
        await handleResearch(message, args, false);
        break;
      case "publish":
        await handleResearch(message, args, true);
        break;
      case "remove":
        await handleRemove(message, args);
        break;
      case "batch":
        await handleBatch(message, args);
        break;
      case "help":
        await handleHelp(message);
        break;
      default:
        break;
    }
  });

  async function handleResearch(
    message: Message,
    projectName: string,
    autoPublish: boolean
  ): Promise<void> {
    if (!projectName) {
      await message.reply(
        "Usage: !research <project_name> or !publish <project_name>"
      );
      return;
    }

    await message.reply(`Researching: **${projectName}** ...`);

    try {
      const result = await researcher.research(projectName);

      const summary = [
        `**${result.name}** ${result.ticker ? `($${result.ticker})` : ""}`,
        `Tier: **${result.tier}** | Category: ${result.category} | Chain: ${result.chain}`,
        `Status: ${result.tgeCompleted ? "TGE Completed" : result.status}`,
        `Estimated Value: ${result.estimatedValue}`,
        `Funding: ${result.fundingRaised}`,
        `Backers: ${result.backers.join(", ") || "Unknown"}`,
        `Referral: ${result.referralLink || "None found"}`,
        `Risk: ${result.riskLevel}`,
        ``,
        `${result.description}`,
        ``,
        `Suitable: **${result.suitable ? "YES" : "NO"}**`,
        `Reason: ${result.reason}`,
      ].join("\n");

      await message.reply(summary);

      if (autoPublish && result.suitable) {
        const pubResult = await publishToDashboard(result);
        await message.reply(pubResult.message);
      }
    } catch (error) {
      await message.reply(
        `Research failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async function handleRemove(
    message: Message,
    projectId: string
  ): Promise<void> {
    if (!projectId) {
      await message.reply("Usage: !remove <project_id>");
      return;
    }

    const result = await removeFromDashboard(projectId);
    await message.reply(result.message);
  }

  async function handleBatch(
    message: Message,
    projectList: string
  ): Promise<void> {
    if (!projectList) {
      await message.reply("Usage: !batch Project1, Project2, Project3");
      return;
    }

    const projects = projectList.split(",").map((p) => p.trim()).filter(Boolean);
    await message.reply(
      `Batch processing ${projects.length} projects: ${projects.join(", ")}`
    );

    for (const name of projects) {
      try {
        await (message.channel as { send: (content: string) => Promise<unknown> }).send(`Researching: **${name}** ...`);
        const result = await researcher.research(name);

        const status = result.suitable
          ? `**${result.name}** (Tier ${result.tier}) - SUITABLE`
          : `**${result.name}** - NOT SUITABLE: ${result.reason}`;

        await (message.channel as { send: (content: string) => Promise<unknown> }).send(status);

        if (result.suitable) {
          const pubResult = await publishToDashboard(result);
          await (message.channel as { send: (content: string) => Promise<unknown> }).send(pubResult.message);
        }
      } catch (error) {
        await (message.channel as { send: (content: string) => Promise<unknown> }).send(
          `Failed: ${name} - ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    await (message.channel as { send: (content: string) => Promise<unknown> }).send("Batch processing complete.");
  }

  async function handleHelp(message: Message): Promise<void> {
    const help = [
      "**Claudex Pipeline Commands:**",
      "`!research <name>` - Research a project (no auto-publish)",
      "`!publish <name>` - Research and auto-publish if suitable",
      "`!remove <id>` - Remove a project from dashboard",
      "`!batch name1, name2, ...` - Research and publish multiple",
      "`!help` - Show this message",
    ].join("\n");

    await message.reply(help);
  }

  async function start(): Promise<void> {
    await client.login(config.botToken);
    console.log("[Discord Pipeline] Bot ready. Listening for commands.");
  }

  function stop(): void {
    client.destroy();
  }

  return { start, stop };
}
