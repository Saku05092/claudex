import { z } from "zod";

// --- Platform Types ---

export const PlatformId = z.enum([
  "twitter",
  "discord",
  "telegram",
  "instagram",
]);
export type PlatformId = z.infer<typeof PlatformId>;

// --- Content Types ---

export const ContentCategory = z.enum([
  "protocol_intro",
  "airdrop_alert",
  "defi_guide",
  "market_update",
  "card_comparison",
  "referral_promo",
  "engagement",
]);
export type ContentCategory = z.infer<typeof ContentCategory>;

export const ContentLanguage = z.enum(["ja", "en"]);
export type ContentLanguage = z.infer<typeof ContentLanguage>;

export interface GeneratedContent {
  readonly text: string;
  readonly category: ContentCategory;
  readonly language: ContentLanguage;
  readonly platforms: readonly PlatformId[];
  readonly referralLink?: string;
  readonly disclaimer: string;
  readonly hashtags: readonly string[];
  readonly imageRequired: boolean;
}

export interface ScheduledPost {
  readonly id: string;
  readonly content: GeneratedContent;
  readonly platform: PlatformId;
  readonly scheduledAt: Date;
  readonly status: "pending" | "approved" | "posted" | "failed";
  readonly postedAt?: Date;
  readonly error?: string;
}

// --- Crypto Card Types ---

export const CardAvailability = z.enum([
  "japan_native",
  "japan_available",
  "japan_unconfirmed",
  "japan_unavailable",
]);
export type CardAvailability = z.infer<typeof CardAvailability>;

export interface CryptoCard {
  readonly id: string;
  readonly name: string;
  readonly issuer: string;
  readonly network: "visa" | "mastercard" | "jcb";
  readonly japanAvailability: CardAvailability;
  readonly cashbackPercent: string;
  readonly cashbackToken: string;
  readonly referralReward: string;
  readonly referralLink?: string;
  readonly annualFee: string;
  readonly features: readonly string[];
  readonly website: string;
  readonly japaneseSupport: boolean;
  readonly notes: string;
}

// --- Protocol Types ---

export interface DeFiProtocol {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly chain: string;
  readonly tvl: number;
  readonly tvlChange24h: number;
  readonly firstSeen: Date;
  readonly hasReferral: boolean;
  readonly referralUrl?: string;
  readonly referralReward?: string;
  readonly website: string;
  readonly twitter?: string;
}

// --- Scheduler Types ---

export interface PostSchedule {
  readonly maxPostsPerDay: number;
  readonly minPostsPerDay: number;
  readonly activeHoursJST: readonly [number, number];
  readonly platforms: readonly PlatformId[];
}

export const DEFAULT_SCHEDULE: PostSchedule = {
  maxPostsPerDay: 5,
  minPostsPerDay: 0,
  activeHoursJST: [8, 23],
  platforms: ["twitter", "discord", "telegram", "instagram"],
};
