/**
 * Twitter/X accounts that frequently post about airdrops and DeFi opportunities.
 * Includes both Japanese and international accounts.
 * Data as of March 2026. Update regularly.
 *
 * Sources:
 * - coinlaunch.space/influencers/airdrop/
 * - altcoinbuzz.io/top-5-twitter-accounts-to-discover-and-manage-airdrops
 * - jinacoin.ne.jp/airdrop-x/
 * - Manual curation
 */

export interface AirdropInfluencer {
  readonly handle: string;
  readonly name: string;
  readonly language: "ja" | "en";
  readonly focus: "airdrop" | "defi" | "nft" | "general" | "trading" | "research";
  readonly followerEstimate: number;
  readonly reliability: "high" | "medium" | "low";
  readonly notes?: string;
}

export const AIRDROP_INFLUENCERS: readonly AirdropInfluencer[] = [
  // ================================================================
  // INTERNATIONAL - Tier 1: High Reliability, Major Influence
  // ================================================================
  {
    handle: "milesdeutscher",
    name: "Miles Deutscher",
    language: "en",
    focus: "airdrop",
    followerEstimate: 450_000,
    reliability: "high",
    notes: "Crypto Banter analyst. Detailed airdrop farming threads and watchlists.",
  },
  {
    handle: "DefiIgnas",
    name: "Ignas | DeFi Research",
    language: "en",
    focus: "defi",
    followerEstimate: 350_000,
    reliability: "high",
    notes: "Deep DeFi research. One of the most trusted voices in DeFi alpha.",
  },
  {
    handle: "Route2FI",
    name: "Route 2 FI",
    language: "en",
    focus: "defi",
    followerEstimate: 400_000,
    reliability: "high",
    notes: "DeFi strategies and yield farming. Highly actionable content.",
  },
  {
    handle: "OlimpioCrypto",
    name: "Olimpio",
    language: "en",
    focus: "airdrop",
    followerEstimate: 200_000,
    reliability: "high",
    notes: "Alpha-Packed Round-Up tweets. Airdrop strategies + DeFi + yield farming.",
  },
  {
    handle: "TheDeFiInvestor",
    name: "The DeFi Investor",
    language: "en",
    focus: "defi",
    followerEstimate: 250_000,
    reliability: "high",
    notes: "DeFi-focused analysis. Consistently high quality.",
  },
  {
    handle: "0xSisyphus",
    name: "Sisyphus",
    language: "en",
    focus: "defi",
    followerEstimate: 200_000,
    reliability: "high",
    notes: "DeFi alpha and early protocol spotting.",
  },
  {
    handle: "DefiLlama",
    name: "DefiLlama",
    language: "en",
    focus: "research",
    followerEstimate: 600_000,
    reliability: "high",
    notes: "Official DeFiLlama account. TVL data and protocol analysis.",
  },
  {
    handle: "BanklessHQ",
    name: "Bankless",
    language: "en",
    focus: "defi",
    followerEstimate: 800_000,
    reliability: "high",
    notes: "Major DeFi media. Podcasts, newsletters, and education.",
  },
  {
    handle: "MessariCrypto",
    name: "Messari",
    language: "en",
    focus: "research",
    followerEstimate: 500_000,
    reliability: "high",
    notes: "Data-driven research. Protocol analysis and reports.",
  },
  {
    handle: "theaboronkov",
    name: "The Block",
    language: "en",
    focus: "research",
    followerEstimate: 700_000,
    reliability: "high",
    notes: "Major crypto news outlet. Breaking news and analysis.",
  },

  // ================================================================
  // INTERNATIONAL - Tier 2: Airdrop Specialists
  // ================================================================
  {
    handle: "alpha_pls",
    name: "Alpha Please",
    language: "en",
    focus: "airdrop",
    followerEstimate: 180_000,
    reliability: "high",
    notes: "Pure airdrop alpha. Early protocol detection.",
  },
  {
    handle: "Ardizor",
    name: "Ardizor",
    language: "en",
    focus: "airdrop",
    followerEstimate: 118_000,
    reliability: "high",
    notes: "Gem hunting + airdrop alpha. Step-by-step guides.",
  },
  {
    handle: "Leshka_eth",
    name: "Leshka",
    language: "en",
    focus: "airdrop",
    followerEstimate: 100_000,
    reliability: "medium",
    notes: "Airdrops, DeFi, and NFTs. Diverse crypto interests.",
  },
  {
    handle: "AirdropHunter_",
    name: "Airdrop Hunter",
    language: "en",
    focus: "airdrop",
    followerEstimate: 200_000,
    reliability: "medium",
    notes: "Dedicated airdrop tracking. Large following.",
  },
  {
    handle: "0xBreadguy",
    name: "Breadguy",
    language: "en",
    focus: "airdrop",
    followerEstimate: 150_000,
    reliability: "medium",
    notes: "Airdrop farming guides and strategies.",
  },
  {
    handle: "Airdrop_Adv",
    name: "Airdrop Adventurer",
    language: "en",
    focus: "airdrop",
    followerEstimate: 120_000,
    reliability: "medium",
    notes: "Airdrop discovery and step-by-step guides.",
  },
  {
    handle: "AirdropDet",
    name: "Airdrop Detective",
    language: "en",
    focus: "airdrop",
    followerEstimate: 90_000,
    reliability: "medium",
    notes: "Airdrop investigation and early detection.",
  },
  {
    handle: "0xnirlin",
    name: "Nirlin",
    language: "en",
    focus: "airdrop",
    followerEstimate: 100_000,
    reliability: "medium",
    notes: "Airdrop alpha and DeFi opportunities.",
  },
  {
    handle: "cryptoairdrops_",
    name: "Crypto Airdrops",
    language: "en",
    focus: "airdrop",
    followerEstimate: 150_000,
    reliability: "medium",
    notes: "Airdrop listings and announcements.",
  },
  {
    handle: "Airdrops_one",
    name: "Airdrops.io",
    language: "en",
    focus: "airdrop",
    followerEstimate: 250_000,
    reliability: "high",
    notes: "Official airdrops.io account. Curated airdrop listings.",
  },

  // ================================================================
  // INTERNATIONAL - Tier 3: DeFi / Trading / General Crypto
  // ================================================================
  {
    handle: "CryptoGodJohn",
    name: "CryptoGodJohn",
    language: "en",
    focus: "general",
    followerEstimate: 500_000,
    reliability: "medium",
    notes: "General crypto content. Large audience reach.",
  },
  {
    handle: "rovercrc",
    name: "Crypto Rover",
    language: "en",
    focus: "general",
    followerEstimate: 1_100_000,
    reliability: "medium",
    notes: "Mainstream crypto content. Very large following.",
  },
  {
    handle: "CryptoWizardd",
    name: "Crypto Wizard",
    language: "en",
    focus: "airdrop",
    followerEstimate: 180_000,
    reliability: "medium",
    notes: "Airdrop tutorials and guides.",
  },
  {
    handle: "Crypto_Chase",
    name: "Chase",
    language: "en",
    focus: "airdrop",
    followerEstimate: 136_000,
    reliability: "high",
    notes: "In-depth airdrop strategies. Step-by-step dApp guides.",
  },
  {
    handle: "AnthonySassano",
    name: "Anthony Sassano",
    language: "en",
    focus: "defi",
    followerEstimate: 300_000,
    reliability: "high",
    notes: "Ethereum advocate. DeFi and L2 insights.",
  },
  {
    handle: "CryptoRank_io",
    name: "CryptoRank",
    language: "en",
    focus: "research",
    followerEstimate: 200_000,
    reliability: "high",
    notes: "Data platform. Airdrop tracking and analytics.",
  },
  {
    handle: "AirdropAlert_com",
    name: "Airdrop Alert",
    language: "en",
    focus: "airdrop",
    followerEstimate: 170_000,
    reliability: "medium",
    notes: "Airdrop listing service. Legit airdrop curation.",
  },
  {
    handle: "DropsTab",
    name: "DropsTab",
    language: "en",
    focus: "airdrop",
    followerEstimate: 100_000,
    reliability: "high",
    notes: "Airdrop activities tracker. Data-driven approach.",
  },
  {
    handle: "coaboronkov_inlist",
    name: "CoinList",
    language: "en",
    focus: "airdrop",
    followerEstimate: 300_000,
    reliability: "high",
    notes: "Token launch platform. Early access to new projects.",
  },
  {
    handle: "LayerZero_Labs",
    name: "LayerZero",
    language: "en",
    focus: "defi",
    followerEstimate: 500_000,
    reliability: "high",
    notes: "Major protocol. Follow for ecosystem airdrop intel.",
  },
  {
    handle: "HyperliquidX",
    name: "Hyperliquid",
    language: "en",
    focus: "defi",
    followerEstimate: 300_000,
    reliability: "high",
    notes: "Top Perp DEX. Ecosystem airdrops on HyperEVM.",
  },
  {
    handle: "CoinGecko",
    name: "CoinGecko",
    language: "en",
    focus: "research",
    followerEstimate: 2_000_000,
    reliability: "high",
    notes: "Major data aggregator. Airdrop listings and guides.",
  },
  {
    handle: "inversebrah",
    name: "inversebrah",
    language: "en",
    focus: "defi",
    followerEstimate: 250_000,
    reliability: "medium",
    notes: "DeFi degen. Early protocol alpha.",
  },
  {
    handle: "raboronkov_entcrypto",
    name: "Rekt Capital",
    language: "en",
    focus: "trading",
    followerEstimate: 400_000,
    reliability: "medium",
    notes: "Technical analysis. Market timing for airdrop farming.",
  },

  // ================================================================
  // JAPANESE - Tier 1: High Reliability
  // ================================================================
  {
    handle: "airdrop_Japan",
    name: "yasu - Airdrop Japan",
    language: "ja",
    focus: "airdrop",
    followerEstimate: 80_000,
    reliability: "high",
    notes: "日本最大級のエアドロップ情報アカウント。信頼性高。",
  },
  {
    handle: "aikibitcoin",
    name: "Aiki Bitcoin",
    language: "ja",
    focus: "general",
    followerEstimate: 100_000,
    reliability: "high",
    notes: "暗号資産全般。長年の実績あり。",
  },
  {
    handle: "DeFiJP",
    name: "DeFi Japan",
    language: "ja",
    focus: "defi",
    followerEstimate: 35_000,
    reliability: "high",
    notes: "日本語DeFi情報の中心的アカウント。",
  },
  {
    handle: "airdroporu",
    name: "エアドロップマスター",
    language: "ja",
    focus: "airdrop",
    followerEstimate: 40_000,
    reliability: "high",
    notes: "エアドロップ専門。参加方法の解説が丁寧。",
  },

  // ================================================================
  // JAPANESE - Tier 2: Active Contributors
  // ================================================================
  {
    handle: "BankeraDao",
    name: "Bankera - Airdrop Info",
    language: "ja",
    focus: "airdrop",
    followerEstimate: 60_000,
    reliability: "medium",
    notes: "エアドロップ情報を定期配信。",
  },
  {
    handle: "crypto_neet_jap",
    name: "Crypto NEET Japan",
    language: "ja",
    focus: "defi",
    followerEstimate: 50_000,
    reliability: "medium",
    notes: "DeFi情報。初心者向けの解説も。",
  },
  {
    handle: "MatsuCrypto",
    name: "Matsu Crypto",
    language: "ja",
    focus: "defi",
    followerEstimate: 40_000,
    reliability: "medium",
    notes: "DeFi戦略と分析。",
  },
  {
    handle: "CryptoChick_jp",
    name: "CryptoChick Japan",
    language: "ja",
    focus: "general",
    followerEstimate: 30_000,
    reliability: "medium",
    notes: "暗号資産全般。女性視点の発信。",
  },
  {
    handle: "airdrop_nippon",
    name: "Airdrop Nippon",
    language: "ja",
    focus: "airdrop",
    followerEstimate: 25_000,
    reliability: "medium",
    notes: "日本向けエアドロップ情報。",
  },
  {
    handle: "masatoshi_defi",
    name: "Masatoshi DeFi",
    language: "ja",
    focus: "defi",
    followerEstimate: 45_000,
    reliability: "medium",
    notes: "DeFi専門。プロトコル分析。",
  },
  {
    handle: "cryptobabe_jp",
    name: "CryptoBabe JP",
    language: "ja",
    focus: "airdrop",
    followerEstimate: 30_000,
    reliability: "medium",
    notes: "エアドロップ情報とDeFi入門。",
  },
  {
    handle: "web3_tanaka",
    name: "Web3 Tanaka",
    language: "ja",
    focus: "general",
    followerEstimate: 55_000,
    reliability: "medium",
    notes: "Web3全般。NFT/DeFi/L2カバー。",
  },
  {
    handle: "defi_ojisan",
    name: "DeFiおじさん",
    language: "ja",
    focus: "defi",
    followerEstimate: 35_000,
    reliability: "medium",
    notes: "中高年向けDeFi解説。親しみやすさが特徴。",
  },
  {
    handle: "crypto_girl_jp",
    name: "仮想通貨女子",
    language: "ja",
    focus: "airdrop",
    followerEstimate: 20_000,
    reliability: "medium",
    notes: "エアドロップ参加方法をイラスト付きで解説。",
  },
  {
    handle: "nft_airdrop_jp",
    name: "NFT & Airdrop JP",
    language: "ja",
    focus: "airdrop",
    followerEstimate: 18_000,
    reliability: "medium",
    notes: "NFT関連エアドロップに特化。",
  },
  {
    handle: "JinaCoinJP",
    name: "JinaCoin",
    language: "ja",
    focus: "research",
    followerEstimate: 50_000,
    reliability: "high",
    notes: "仮想通貨メディア。エアドロップ情報の信頼性評価記事を提供。",
  },
  {
    handle: "coinpost_inc",
    name: "CoinPost",
    language: "ja",
    focus: "research",
    followerEstimate: 200_000,
    reliability: "high",
    notes: "日本最大級の暗号資産メディア。ニュース速報。",
  },
  {
    handle: "coin_telegraph_j",
    name: "Cointelegraph Japan",
    language: "ja",
    focus: "research",
    followerEstimate: 100_000,
    reliability: "high",
    notes: "Cointelegraph日本版。業界ニュース。",
  },
  {
    handle: "airdro7",
    name: "Airdrop 7",
    language: "ja",
    focus: "airdrop",
    followerEstimate: 20_000,
    reliability: "low",
    notes: "エアドロップ情報。信頼性は自己判断。",
  },
] as const;

// --- Helper Functions ---

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

export function getInfluencersByFocus(
  focus: AirdropInfluencer["focus"]
): readonly AirdropInfluencer[] {
  return AIRDROP_INFLUENCERS.filter((i) => i.focus === focus);
}

export function getTopInfluencers(
  limit: number = 20
): readonly AirdropInfluencer[] {
  return [...AIRDROP_INFLUENCERS]
    .sort((a, b) => {
      // Sort by reliability (high first), then by followers
      const reliabilityOrder = { high: 0, medium: 1, low: 2 };
      const reliabilityDiff =
        reliabilityOrder[a.reliability] - reliabilityOrder[b.reliability];
      if (reliabilityDiff !== 0) return reliabilityDiff;
      return b.followerEstimate - a.followerEstimate;
    })
    .slice(0, limit);
}

// --- Stats ---

export function getInfluencerStats(): {
  readonly total: number;
  readonly international: number;
  readonly japanese: number;
  readonly highReliability: number;
  readonly airdropFocused: number;
} {
  return {
    total: AIRDROP_INFLUENCERS.length,
    international: getInfluencersByLanguage("en").length,
    japanese: getInfluencersByLanguage("ja").length,
    highReliability: getHighReliabilityInfluencers().length,
    airdropFocused: getAirdropFocusedInfluencers().length,
  };
}
