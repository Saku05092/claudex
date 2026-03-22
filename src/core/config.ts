import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  // Twitter (Free tier)
  TWITTER_API_KEY: z.string().optional(),
  TWITTER_API_SECRET: z.string().optional(),
  TWITTER_ACCESS_TOKEN: z.string().optional(),
  TWITTER_ACCESS_TOKEN_SECRET: z.string().optional(),
  TWITTER_BEARER_TOKEN: z.string().optional(),

  // Discord
  DISCORD_BOT_TOKEN: z.string().optional(),
  DISCORD_CLIENT_ID: z.string().optional(),

  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().optional(),

  // Instagram / Meta
  META_ACCESS_TOKEN: z.string().optional(),
  INSTAGRAM_BUSINESS_ACCOUNT_ID: z.string().optional(),

  // Claude API
  ANTHROPIC_API_KEY: z.string().optional(),

  // Optional
  CRYPTOPANIC_API_KEY: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function loadConfig(): EnvConfig {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(
      `Invalid environment configuration: ${result.error.message}`
    );
  }
  return result.data;
}

export function getRequiredConfig(
  config: EnvConfig,
  key: keyof EnvConfig
): string {
  const value = config[key];
  if (!value) {
    throw new Error(
      `Missing required config: ${key}. Check your .env file.`
    );
  }
  return value;
}
