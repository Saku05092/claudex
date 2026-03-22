import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  type TextChannel,
} from "discord.js";
import type { GeneratedContent, ContentCategory } from "../core/types.js";

const CATEGORY_COLORS: Record<ContentCategory, number> = {
  protocol_intro: 0x6366f1,
  airdrop_alert: 0xf59e0b,
  defi_guide: 0x10b981,
  market_update: 0x3b82f6,
  card_comparison: 0x8b5cf6,
  referral_promo: 0xec4899,
  engagement: 0x06b6d4,
};

export function createDiscordBot(token: string) {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
    ],
  });

  async function postToChannel(
    channelId: string,
    content: GeneratedContent
  ): Promise<string> {
    const channel = (await client.channels.fetch(
      channelId
    )) as TextChannel;

    const embed = buildEmbed(content);
    const message = await channel.send({ embeds: [embed] });
    return message.id;
  }

  async function start(): Promise<void> {
    await client.login(token);
  }

  function stop(): void {
    client.destroy();
  }

  return { postToChannel, start, stop };
}

function buildEmbed(content: GeneratedContent): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(CATEGORY_COLORS[content.category])
    .setDescription(content.text)
    .setFooter({ text: content.disclaimer })
    .setTimestamp();

  if (content.referralLink) {
    embed.addFields({
      name: "Link",
      value: content.referralLink,
      inline: false,
    });
  }

  if (content.hashtags.length > 0) {
    embed.addFields({
      name: "Tags",
      value: content.hashtags.join(" "),
      inline: false,
    });
  }

  return embed;
}
