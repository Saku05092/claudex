/**
 * Airdrop opportunity tracking data.
 * Data as of March 2026. Update regularly with scanner findings.
 */

export interface AirdropOpportunity {
  readonly id: string;
  readonly name: string;
  readonly ticker?: string;
  readonly category:
    | "defi"
    | "dex"
    | "bridge"
    | "lending"
    | "nft"
    | "gaming"
    | "infra"
    | "social"
    | "other";
  readonly chain: string;
  readonly tier: "S" | "A" | "B" | "C";
  readonly status: "active" | "upcoming" | "ended" | "claimed";
  readonly description: string;
  readonly descriptionEn: string;
  readonly tasks: readonly string[];
  readonly estimatedValue?: string;
  readonly deadline?: string;
  readonly website: string;
  readonly twitter?: string;
  readonly referralLink?: string;
  readonly referralReward?: string;
  readonly fundingRaised?: string;
  readonly backers?: readonly string[];
  readonly mentionCount: number;
  readonly mentionedBy: readonly string[];
  readonly riskLevel: "low" | "medium" | "high";
  readonly addedAt: string;
  readonly updatedAt: string;
}

const NOW = "2026-03-22T00:00:00Z";

export const AIRDROP_OPPORTUNITIES: readonly AirdropOpportunity[] = [
  // --- Tier S: Confirmed or near-confirmed major airdrops ---
  {
    id: "polymarket",
    name: "Polymarket",
    ticker: "POLY",
    category: "other",
    chain: "Polygon",
    tier: "S",
    status: "active",
    description:
      "予測市場プラットフォーム。CMOがPOLYトークンとエアドロップを確認済み。TVL $350M。",
    descriptionEn:
      "Prediction market platform. CMO confirmed POLY token and airdrop. TVL $350M.",
    tasks: [
      "Create Polymarket account",
      "Trade on prediction markets regularly",
      "Provide liquidity to markets",
      "Use the platform across multiple event categories",
    ],
    estimatedValue: "$500-5000",
    website: "https://polymarket.com",
    twitter: "Polymarket",
    referralLink: "",
    fundingRaised: "$74M Series B",
    backers: [
      "Founders Fund",
      "Dragonfly Capital",
      "General Catalyst",
      "Polychain Capital",
    ],
    mentionCount: 12,
    mentionedBy: [
      "DefiIgnas",
      "Route2FI",
      "TheDeFiInvestor",
      "alpha_pls",
      "airdrop_Japan",
    ],
    riskLevel: "low",
    addedAt: "2025-11-01T00:00:00Z",
    updatedAt: NOW,
  },
  {
    id: "megaeth",
    name: "MegaETH",
    ticker: "MEGA",
    category: "infra",
    chain: "Ethereum L2",
    tier: "S",
    status: "active",
    description:
      "超高速L2。100K TPS、10msブロックタイム。Vitalik支援。メインネット稼働中、TGE待ち。",
    descriptionEn:
      "Ultra-fast L2. 100K TPS, 10ms block times. Backed by Vitalik. Mainnet live, TGE pending.",
    tasks: [
      "Bridge ETH to MegaETH mainnet",
      "Interact with dApps on MegaETH",
      "Deploy smart contracts (for developers)",
      "Maintain consistent activity over weeks",
    ],
    estimatedValue: "$1000-10000",
    deadline: "TGE expected before June 2026",
    website: "https://megaeth.systems",
    twitter: "megaboronkov_eth",
    referralLink: "",
    fundingRaised: "$450M public sale + seed",
    backers: [
      "Vitalik Buterin",
      "Joseph Lubin",
      "Dragonfly Capital",
    ],
    mentionCount: 15,
    mentionedBy: [
      "DefiIgnas",
      "Route2FI",
      "0xSisyphus",
      "alpha_pls",
      "TheDeFiInvestor",
      "airdrop_Japan",
    ],
    riskLevel: "low",
    addedAt: "2025-10-01T00:00:00Z",
    updatedAt: NOW,
  },
  {
    id: "opensea-sea",
    name: "OpenSea",
    ticker: "SEA",
    category: "nft",
    chain: "Ethereum",
    tier: "S",
    status: "active",
    description:
      "NFTマーケットプレイス最大手。50%コミュニティ配分を確認済み。TGE延期中。",
    descriptionEn:
      "Largest NFT marketplace. Confirmed 50% community allocation. TGE delayed indefinitely.",
    tasks: [
      "Trade NFTs on OpenSea regularly",
      "List NFTs for sale",
      "Use OpenSea Pro features",
      "Maintain active trading history",
    ],
    estimatedValue: "$500-5000",
    website: "https://opensea.io",
    twitter: "opensea",
    referralLink: "",
    fundingRaised: "$423M Series C",
    backers: [
      "a16z",
      "Paradigm",
      "Coatue",
    ],
    mentionCount: 10,
    mentionedBy: [
      "DefiIgnas",
      "CryptoGodJohn",
      "0xBreadguy",
      "airdrop_Japan",
    ],
    riskLevel: "medium",
    addedAt: "2025-12-01T00:00:00Z",
    updatedAt: NOW,
  },

  // --- Tier A: Very likely airdrops ---
  {
    id: "berachain",
    name: "Berachain",
    ticker: "BERA",
    category: "infra",
    chain: "Berachain",
    tier: "A",
    status: "active",
    description:
      "Proof-of-Liquidity L1。テストネットV2(bArtio)稼働中。2026年にフルローンチ予定。",
    descriptionEn:
      "Proof-of-Liquidity L1. Testnet V2 (bArtio) live. Full rollout targeted for 2026.",
    tasks: [
      "Get testnet tokens from faucet",
      "Interact with Berachain DEXes",
      "Provide liquidity on testnet",
      "Participate in governance proposals",
      "Bridge assets to testnet",
    ],
    estimatedValue: "$500-3000",
    website: "https://berachain.com",
    twitter: "beaboronkovrachain",
    referralLink: "",
    fundingRaised: "$142M Series B",
    backers: [
      "Framework Ventures",
      "Brevan Howard Digital",
      "Polychain Capital",
      "Samsung Next",
    ],
    mentionCount: 14,
    mentionedBy: [
      "DefiIgnas",
      "Route2FI",
      "0xSisyphus",
      "alpha_pls",
      "airdrop_Japan",
      "BankeraDao",
    ],
    riskLevel: "low",
    addedAt: "2025-06-01T00:00:00Z",
    updatedAt: NOW,
  },
  {
    id: "linea",
    name: "Linea",
    ticker: "LINEA",
    category: "infra",
    chain: "Ethereum L2",
    tier: "A",
    status: "active",
    description:
      "Consensys開発のzkEVM L2。MetaMask統合。MASKトークンとの関連も期待。",
    descriptionEn:
      "zkEVM L2 by Consensys. MetaMask integration. MASK token connection expected.",
    tasks: [
      "Bridge ETH to Linea via official bridge",
      "Swap tokens on Linea DEXes",
      "Provide liquidity on Linea protocols",
      "Use MetaMask Swaps on Linea",
      "Complete Linea Surge campaigns",
    ],
    estimatedValue: "$300-2000",
    website: "https://linea.build",
    twitter: "LineaBuild",
    referralLink: "",
    fundingRaised: "Consensys raised $725M",
    backers: [
      "Consensys (MetaMask parent)",
      "Microsoft",
      "SoftBank",
    ],
    mentionCount: 11,
    mentionedBy: [
      "DefiIgnas",
      "Route2FI",
      "TheDeFiInvestor",
      "0xBreadguy",
      "airdrop_Japan",
    ],
    riskLevel: "low",
    addedAt: "2025-05-01T00:00:00Z",
    updatedAt: NOW,
  },
  {
    id: "grass-s2",
    name: "Grass (Season 2)",
    ticker: "GRASS",
    category: "infra",
    chain: "Solana",
    tier: "A",
    status: "active",
    description:
      "帯域幅共有でAIトレーニングデータを収集。Season 2で170Mトークン配布予定。",
    descriptionEn:
      "Bandwidth sharing for AI training data. 170M token distribution planned for Season 2.",
    tasks: [
      "Install Grass browser extension",
      "Maintain consistent uptime",
      "Refer friends for bonus points",
      "Keep extension running 24/7",
    ],
    estimatedValue: "$200-1500",
    website: "https://getgrass.io",
    twitter: "getgrass_io",
    referralLink: "",
    referralReward: "Referral bonus points multiplier",
    fundingRaised: "$4.5M Seed",
    backers: [
      "Polychain Capital",
      "Tribe Capital",
    ],
    mentionCount: 8,
    mentionedBy: [
      "DefiIgnas",
      "alpha_pls",
      "0xnirlin",
      "airdrop_Japan",
    ],
    riskLevel: "low",
    addedAt: "2025-08-01T00:00:00Z",
    updatedAt: NOW,
  },
  {
    id: "aster-dex",
    name: "Aster DEX",
    ticker: "ASTER",
    category: "dex",
    chain: "Multi-chain",
    tier: "A",
    status: "active",
    description:
      "2026年最大級のエアドロップの一つ。ピーク時FDV $15B達成。コミュニティ主導。",
    descriptionEn:
      "One of the biggest airdrops of 2026. Hit $15B FDV at peak. Community-driven.",
    tasks: [
      "Trade on Aster DEX",
      "Provide liquidity",
      "Participate in governance",
      "Refer new users",
    ],
    estimatedValue: "$500-5000",
    website: "https://aster.exchange",
    twitter: "AsterDEX",
    referralLink: "",
    referralReward: "Points multiplier for referrals",
    mentionCount: 9,
    mentionedBy: [
      "DefiIgnas",
      "Route2FI",
      "TheDeFiInvestor",
      "airdrop_Japan",
    ],
    riskLevel: "medium",
    addedAt: "2025-12-01T00:00:00Z",
    updatedAt: NOW,
  },

  // --- Tier B: Possible airdrops ---
  {
    id: "scroll",
    name: "Scroll",
    ticker: "SCR",
    category: "infra",
    chain: "Ethereum L2",
    tier: "B",
    status: "active",
    description:
      "zkRollup L2。エアドロップ意思を表明済み。Marksプログラムでポイント蓄積中。",
    descriptionEn:
      "zkRollup L2. Affirmed airdrop intention. Marks program for point accumulation.",
    tasks: [
      "Bridge to Scroll via official bridge",
      "Complete Scroll quests (Sessions)",
      "Earn Marks by bridging and using protocols",
      "Provide liquidity on Scroll DEXes",
    ],
    estimatedValue: "$200-1000",
    website: "https://scroll.io",
    twitter: "Scroll_ZKP",
    referralLink: "",
    fundingRaised: "$80M Series B",
    backers: [
      "Polychain Capital",
      "Sequoia China",
      "Bain Capital Crypto",
    ],
    mentionCount: 7,
    mentionedBy: [
      "DefiIgnas",
      "0xBreadguy",
      "alpha_pls",
    ],
    riskLevel: "low",
    addedAt: "2025-04-01T00:00:00Z",
    updatedAt: NOW,
  },
  {
    id: "metamask",
    name: "MetaMask",
    ticker: "MASK",
    category: "infra",
    chain: "Ethereum",
    tier: "B",
    status: "active",
    description:
      "最大手ウォレット。Consensys CEOがトークンを確認。リワードプログラム開始済み。",
    descriptionEn:
      "Largest wallet. Consensys CEO confirmed token. Rewards program launched.",
    tasks: [
      "Use MetaMask Swaps regularly",
      "Earn MetaMask Rewards points",
      "Bridge via MetaMask Bridge aggregator",
      "Stake ETH through MetaMask Staking",
    ],
    estimatedValue: "$100-1000",
    website: "https://metamask.io",
    twitter: "MetaMask",
    referralLink: "",
    fundingRaised: "Part of Consensys ($725M)",
    backers: [
      "Consensys",
      "Microsoft",
      "SoftBank",
    ],
    mentionCount: 6,
    mentionedBy: [
      "DefiIgnas",
      "Route2FI",
      "CryptoGodJohn",
    ],
    riskLevel: "low",
    addedAt: "2025-10-01T00:00:00Z",
    updatedAt: NOW,
  },
  {
    id: "debridge",
    name: "deBridge",
    category: "bridge",
    chain: "Multi-chain",
    tier: "B",
    status: "active",
    description:
      "クロスチェーンブリッジプロトコル。複数回のトークン配布実績あり。追加配布の可能性。",
    descriptionEn:
      "Cross-chain bridge protocol. Multiple token distributions completed. More distributions possible.",
    tasks: [
      "Bridge assets using deBridge",
      "Use deSwap for cross-chain swaps",
      "Maintain consistent bridging volume",
      "Try bridging across multiple chains",
    ],
    estimatedValue: "$100-500",
    website: "https://debridge.finance",
    twitter: "daboronkoveBridgeFinance",
    referralLink: "",
    fundingRaised: "$15M",
    backers: [
      "ParaFi Capital",
      "Animoca Brands",
    ],
    mentionCount: 5,
    mentionedBy: [
      "DefiIgnas",
      "0xnirlin",
      "Airdrop_Adv",
    ],
    riskLevel: "low",
    addedAt: "2025-09-01T00:00:00Z",
    updatedAt: NOW,
  },

  // --- Tier C: Speculative ---
  {
    id: "phantom-wallet",
    name: "Phantom Wallet",
    category: "infra",
    chain: "Multi-chain",
    tier: "C",
    status: "upcoming",
    description:
      "Solana最大手ウォレット。マルチチェーン展開中。トークン未確認だが期待大。",
    descriptionEn:
      "Largest Solana wallet. Expanding multi-chain. Token unconfirmed but highly anticipated.",
    tasks: [
      "Use Phantom for daily transactions",
      "Swap tokens through Phantom",
      "Use Phantom on multiple chains (Solana, Ethereum, Polygon)",
      "Try Phantom mobile app",
    ],
    estimatedValue: "$50-500",
    website: "https://phantom.app",
    twitter: "phantom",
    referralLink: "",
    fundingRaised: "$118M Series C",
    backers: [
      "Paradigm",
      "a16z",
      "Variant Fund",
    ],
    mentionCount: 4,
    mentionedBy: [
      "Route2FI",
      "0xSisyphus",
    ],
    riskLevel: "medium",
    addedAt: "2025-07-01T00:00:00Z",
    updatedAt: NOW,
  },
  {
    id: "zora",
    name: "Zora",
    category: "nft",
    chain: "Ethereum L2",
    tier: "C",
    status: "active",
    description:
      "NFTミンティングプラットフォーム。独自L2稼働中。トークン未確認。",
    descriptionEn:
      "NFT minting platform. Own L2 live. Token unconfirmed.",
    tasks: [
      "Mint NFTs on Zora Network",
      "Create collections on Zora",
      "Bridge to Zora Network",
      "Engage with popular mints",
    ],
    estimatedValue: "$50-300",
    website: "https://zora.co",
    twitter: "ourzora",
    referralLink: "",
    fundingRaised: "$60M Series B",
    backers: [
      "Haun Ventures",
      "Coinbase Ventures",
    ],
    mentionCount: 3,
    mentionedBy: [
      "0xBreadguy",
      "CryptoGodJohn",
    ],
    riskLevel: "medium",
    addedAt: "2025-11-01T00:00:00Z",
    updatedAt: NOW,
  },
  {
    id: "eigenlayer-s2",
    name: "EigenLayer (Season 2+)",
    ticker: "EIGEN",
    category: "defi",
    chain: "Ethereum",
    tier: "C",
    status: "active",
    description:
      "リステーキングプロトコル。追加トークン配布の可能性。ポイント蓄積継続中。",
    descriptionEn:
      "Restaking protocol. Additional token distributions possible. Points accumulation ongoing.",
    tasks: [
      "Restake ETH via EigenLayer",
      "Use liquid restaking protocols (EtherFi, Renzo, Kelp)",
      "Delegate to operators",
      "Maintain restaked position over time",
    ],
    estimatedValue: "$100-1000",
    website: "https://eigenlayer.xyz",
    twitter: "eigenlayer",
    referralLink: "",
    fundingRaised: "$164M Series B",
    backers: [
      "a16z",
      "Blockchain Capital",
      "Polychain Capital",
    ],
    mentionCount: 5,
    mentionedBy: [
      "DefiIgnas",
      "TheDeFiInvestor",
      "airdrop_Japan",
    ],
    riskLevel: "low",
    addedAt: "2025-06-01T00:00:00Z",
    updatedAt: NOW,
  },
] as const;

export function getOpportunitiesByTier(
  tier: AirdropOpportunity["tier"]
): readonly AirdropOpportunity[] {
  return AIRDROP_OPPORTUNITIES.filter((o) => o.tier === tier);
}

export function getActiveOpportunities(): readonly AirdropOpportunity[] {
  return AIRDROP_OPPORTUNITIES.filter((o) => o.status === "active");
}

export function getOpportunitiesByCategory(
  category: AirdropOpportunity["category"]
): readonly AirdropOpportunity[] {
  return AIRDROP_OPPORTUNITIES.filter((o) => o.category === category);
}

export function getOpportunitiesSortedByMentions(): readonly AirdropOpportunity[] {
  return [...AIRDROP_OPPORTUNITIES].sort(
    (a, b) => b.mentionCount - a.mentionCount
  );
}
