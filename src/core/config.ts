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

  // Monitoring
  TWITTER_MONITOR_MAX_RESULTS: z.coerce.number().int().min(10).max(100).default(10).optional(),
  TWITTER_MONITOR_ENABLED: z.coerce.boolean().default(false).optional(),

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

export function getRequiredConfig<K extends keyof EnvConfig>(
  config: EnvConfig,
  key: K
): NonNullable<EnvConfig[K]> {
  const value = config[key];
  if (value === undefined || value === null || value === "") {
    throw new Error(
      `Missing required config: ${String(key)}. Check your .env file.`
    );
  }
  return value as NonNullable<EnvConfig[K]>;
}
