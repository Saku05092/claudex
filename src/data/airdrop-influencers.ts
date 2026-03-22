/**
 * Twitter/X accounts that frequently post about airdrops and DeFi opportunities.
 * Includes both Japanese and international accounts.
 * Data as of March 2026. Update regularly.
 */

export interface AirdropInfluencer {
  readonly handle: string;
  readonly name: string;
  readonly language: "ja" | "en";
  readonly focus: "airdrop" | "defi" | "nft" | "general";
  readonly followerEstimate: number;
  readonly reliability: "high" | "medium" | "low";
}

export const AIRDROP_INFLUENCERS: readonly AirdropInfluencer[] = [
  // --- International Accounts ---
  {
    handle: "DefiIgnas",
    name: "Ignas | DeFi Research",
    language: "en",
    focus: "defi",
    followerEstimate: 350_000,
    reliability: "high",
  },
  {
    handle: "Route2FI",
    name: "Route 2 FI",
    language: "en",
    focus: "defi",
    followerEstimate: 400_000,
    reliability: "high",
  },
  {
    handle: "0xSisyphus",
    name: "Sisyphus",
    language: "en",
    focus: "defi",
    followerEstimate: 200_000,
    reliability: "high",
  },
  {
    handle: "0xBreadguy",
    name: "Breadguy",
    language: "en",
    focus: "airdrop",
    followerEstimate: 150_000,
    reliability: "medium",
  },
  {
    handle: "CryptoGodJohn",
    name: "CryptoGodJohn",
    language: "en",
    focus: "general",
    followerEstimate: 500_000,
    reliability: "medium",
  },
  {
    handle: "alpha_pls",
    name: "Alpha Please",
    language: "en",
    focus: "airdrop",
    followerEstimate: 180_000,
    reliability: "high",
  },
  {
    handle: "0xnirlin",
    name: "Nirlin",
    language: "en",
    focus: "airdrop",
    followerEstimate: 100_000,
    reliability: "medium",
  },
  {
    handle: "Airdrop_Adv",
    name: "Airdrop Adventurer",
    language: "en",
    focus: "airdrop",
    followerEstimate: 120_000,
    reliability: "medium",
  },
  {
    handle: "taboronkov",
    name: "The Aboronkov",
    language: "en",
    focus: "airdrop",
    followerEstimate: 80_000,
    reliability: "medium",
  },
  {
    handle: "AirdropDet",
    name: "Airdrop Detective",
    language: "en",
    focus: "airdrop",
    followerEstimate: 90_000,
    reliability: "medium",
  },
  {
    handle: "DefiLlama",
    name: "DefiLlama",
    language: "en",
    focus: "defi",
    followerEstimate: 600_000,
    reliability: "high",
  },
  {
    handle: "AirdropHunter_",
    name: "Airdrop Hunter",
    language: "en",
    focus: "airdrop",
    followerEstimate: 200_000,
    reliability: "medium",
  },
  {
    handle: "rovercrc",
    name: "Crypto Rover",
    language: "en",
    focus: "general",
    followerEstimate: 1_100_000,
    reliability: "medium",
  },
  {
    handle: "TheDeFiInvestor",
    name: "The DeFi Investor",
    language: "en",
    focus: "defi",
    followerEstimate: 250_000,
    reliability: "high",
  },
  {
    handle: "bankaboronkov",
    name: "Bankless",
    language: "en",
    focus: "defi",
    followerEstimate: 300_000,
    reliability: "high",
  },
  {
    handle: "aaboronkov",
    name: "Aboronkov A",
    language: "en",
    focus: "airdrop",
    followerEstimate: 70_000,
    reliability: "medium",
  },
  {
    handle: "cryptoairdrops_",
    name: "Crypto Airdrops",
    language: "en",
    focus: "airdrop",
    followerEstimate: 150_000,
    reliability: "medium",
  },
  {
    handle: "next100xgems",
    name: "Next 100X Gems",
    language: "en",
    focus: "general",
    followerEstimate: 256_000,
    reliability: "low",
  },

  // --- Japanese Accounts ---
  {
    handle: "airdrop_Japan",
    name: "yasu - Airdrop Japan",
    language: "ja",
    focus: "airdrop",
    followerEstimate: 80_000,
    reliability: "high",
  },
  {
    handle: "BankeraDao",
    name: "Bankera - Airdrop Info",
    language: "ja",
    focus: "airdrop",
    followerEstimate: 60_000,
    reliability: "medium",
  },
  {
    handle: "aikibitcoin",
    name: "Aiki Bitcoin",
    language: "ja",
    focus: "general",
    followerEstimate: 100_000,
    reliability: "high",
  },
  {
    handle: "crypto_neet_jap",
    name: "Crypto NEET Japan",
    language: "ja",
    focus: "defi",
    followerEstimate: 50_000,
    reliability: "medium",
  },
  {
    handle: "MatsuCrypto",
    name: "Matsu Crypto",
    language: "ja",
    focus: "defi",
    followerEstimate: 40_000,
    reliability: "medium",
  },
  {
    handle: "CryptoChick_jp",
    name: "CryptoChick Japan",
    language: "ja",
    focus: "general",
    followerEstimate: 30_000,
    reliability: "medium",
  },
  {
    handle: "airdrop_nippon",
    name: "Airdrop Nippon",
    language: "ja",
    focus: "airdrop",
    followerEstimate: 25_000,
    reliability: "medium",
  },
  {
    handle: "DeFiJP",
    name: "DeFi Japan",
    language: "ja",
    focus: "defi",
    followerEstimate: 35_000,
    reliability: "high",
  },
  {
    handle: "airdro7",
    name: "Airdrop 7",
    language: "ja",
    focus: "airdrop",
    followerEstimate: 20_000,
    reliability: "low",
  },
  {
    handle: "masatoshi_defi",
    name: "Masatoshi DeFi",
    language: "ja",
    focus: "defi",
    followerEstimate: 45_000,
    reliability: "medium",
  },
  {
    handle: "cryptobabe_jp",
    name: "CryptoBabe JP",
    language: "ja",
    focus: "airdrop",
    followerEstimate: 30_000,
    reliability: "medium",
  },
  {
    handle: "web3_tanaka",
    name: "Web3 Tanaka",
    language: "ja",
    focus: "general",
    followerEstimate: 55_000,
    reliability: "medium",
  },
] as const;

export function getInfluencersByLanguage(
  language: "ja" | "en"
): readonly AirdropInfluencer[] {
  return AIRDROP_INFLUENCERS.filter((i) => i.language === language);
}

export function getHighReliabilityInfluencers(): readonly AirdropInfluencer[] {
  return AIRDROP_INFLUENCERS.filter((i) => i.reliability === "high");
}

export function getAirdropFocusedInfluencers(): readonly AirdropInfluencer[] {
  return AIRDROP_INFLUENCERS.filter((i) => i.focus === "airdrop");
}
