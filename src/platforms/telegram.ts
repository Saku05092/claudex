import { Bot, InputFile, type Context } from "grammy";
import type { GeneratedContent } from "../core/types.js";

export function createTelegramBot(token: string) {
  const bot = new Bot(token);

  async function postToChannel(
    channelId: string,
    content: GeneratedContent
  ): Promise<number> {
    const text = formatTelegramMessage(content);
    const result = await bot.api.sendMessage(channelId, text, {
      parse_mode: "HTML",
      link_preview_options: { is_disabled: false },
    });
    return result.message_id;
  }

  async function postImageToChannel(
    channelId: string,
    content: GeneratedContent,
    imagePath: string
  ): Promise<number> {
    const caption = formatTelegramMessage(content);
    const result = await bot.api.sendPhoto(
      channelId,
      new InputFile(imagePath),
      {
        caption,
        parse_mode: "HTML",
      }
    );
    return result.message_id;
  }

  function setupCommands(): void {
    bot.command("start", (ctx: Context) =>
      ctx.reply(
        "Welcome to Claudex! Get the latest DeFi insights and crypto card comparisons.\n\nUse /help to see available commands."
      )
    );

    bot.command("help", (ctx: Context) =>
      ctx.reply(
        "Available commands:\n" +
          "/cards - Compare crypto cards available in Japan\n" +
          "/new - Latest new DeFi protocols\n" +
          "/airdrops - Current airdrop opportunities\n" +
          "/guide <topic> - Quick DeFi guide"
      )
    );

    bot.command("cards", (ctx: Context) =>
      ctx.reply(
        "Crypto Cards for Japan:\n\n" +
          "1. Binance Japan Card (JCB) - 1.6% BNB\n" +
          "2. Tria Card (Visa) - Up to 6%\n" +
          "3. KAST Card (Visa) - Up to 12%\n" +
          "4. Slash Card - Coming soon\n\n" +
          "DYOR - NFA"
      )
    );
  }

  async function start(): Promise<void> {
    setupCommands();
    await bot.start();
  }

  function stop(): void {
    bot.stop();
  }

  return { postToChannel, postImageToChannel, start, stop };
}

function escapeHtmlAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "&#039;");
}

function formatTelegramMessage(content: GeneratedContent): string {
  const parts: string[] = [content.text];

  if (content.referralLink) {
    parts.push(`\n\n<a href="${escapeHtmlAttr(content.referralLink ?? "")}">Details</a>`);
  }

  if (content.hashtags.length > 0) {
    parts.push(`\n\n${content.hashtags.join(" ")}`);
  }

  if (!content.text.includes("DYOR")) {
    parts.push(`\n\n<i>${content.disclaimer}</i>`);
  }

  return parts.join("");
}
