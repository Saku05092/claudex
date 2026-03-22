import type { CryptoCard } from "../core/types.js";

/**
 * Crypto cards available or potentially available in Japan.
 * Data as of March 2026. Update regularly.
 */
export const JAPAN_CRYPTO_CARDS: readonly CryptoCard[] = [
  // --- TIER 1: Japan-Native (Fully Compliant) ---
  {
    id: "binance-japan",
    name: "Binance Japan Card",
    issuer: "Binance Japan + Life Card",
    network: "jcb",
    japanAvailability: "japan_native",
    cashbackPercent: "1.6%",
    cashbackToken: "BNB",
    referralReward: "Japan users blocked from standard referral bonuses",
    annualFee: "Free 1st year, then 1,650 JPY (waived if >100K JPY annual spend)",
    features: [
      "JCB network - excellent domestic acceptance",
      "BNB rewards usable in Binance ecosystem",
      "PayPay integration (70M+ users)",
      "Flexible Earn while spending",
      "FSA licensed exchange",
    ],
    website: "https://www.binance.com/en-JP/japan-credit-card-apply",
    japaneseSupport: true,
    notes:
      "Most established option for Japan. JCB limits international use. PayPay partnership adds significant ecosystem value.",
  },
  {
    id: "slash-card",
    name: "Slash Card",
    issuer: "Slash Vision Labs + Orico/LifeCard + SoftBank Payment",
    network: "visa",
    japanAvailability: "japan_native",
    cashbackPercent: "Pay-to-Earn airdrops",
    cashbackToken: "Various (airdrop model)",
    referralReward: "Not yet announced",
    annualFee: "Not yet announced",
    features: [
      "Japan's first compliant crypto credit card",
      "USDC collateral for JPY payments",
      "Supports almost any crypto on 10 blockchains",
      "4,000+ merchants already use Slash Payment",
      "SoftBank Payment partnership",
      "Solana Superteam Japan collaboration",
    ],
    website: "https://slash.fi/",
    japaneseSupport: true,
    notes:
      "Highly anticipated. Agreement signed, exact launch date TBD (originally targeted H1 2025). Watch for updates.",
  },
  {
    id: "nudge-hashport",
    name: "Nudge / HashPort Card",
    issuer: "Nudge Corp + HashPort + JPYC",
    network: "visa",
    japanAvailability: "japan_native",
    cashbackPercent: "0.3%",
    cashbackToken: "JPYC (yen-pegged stablecoin)",
    referralReward: "Not publicly disclosed",
    annualFee: "Not publicly disclosed",
    features: [
      "JPYC stablecoin rewards - simplifies tax reporting",
      "Visa network - 150M+ merchants worldwide",
      "Blockchain transparency",
      "AI fraud monitoring",
      "No FX conversion volatility",
    ],
    website: "https://nudge.works/",
    japaneseSupport: true,
    notes:
      "Best for tax-conscious Japanese users. JPYC being yen-pegged eliminates conversion taxable events on rewards.",
  },
  {
    id: "bitflyer-credit",
    name: "bitFlyer Credit Card",
    issuer: "bitFlyer + Aplus (Shinsei Bank Group)",
    network: "visa",
    japanAvailability: "japan_native",
    cashbackPercent: "Up to 10% (promo)",
    cashbackToken: "BTC",
    referralReward: "Standard bitFlyer referral program",
    annualFee: "Not publicly confirmed",
    features: [
      "Bitcoin cashback",
      "Long-standing Japanese exchange",
      "FSA licensed",
      "Visa/Mastercard dual option",
    ],
    website: "https://bitflyer.com/en-jp/",
    japaneseSupport: true,
    notes:
      "Established since Dec 2021. Reliable choice for Japanese BTC enthusiasts.",
  },

  // --- TIER 2: International Cards (Japan Available/Potential) ---
  {
    id: "tria",
    name: "Tria Card",
    issuer: "Tria (self-custodial neobank)",
    network: "visa",
    japanAvailability: "japan_available",
    cashbackPercent: "1.5-6%",
    cashbackToken: "TRIA tokens (post-TGE)",
    referralReward: "Ambassador program (invite-only); TRIA token rewards on referral activity",
    annualFee: "Virtual: $20, Signature: $109, Premium: $250",
    features: [
      "Self-custodial (you keep your keys)",
      "1,000+ supported cryptocurrencies",
      "100% crypto collateral required",
      "AI routing engine for optimal conversions",
      "Zero conversion fees (Tria markup)",
      "150+ countries supported",
    ],
    website: "https://www.tria.so/en",
    japaneseSupport: false,
    notes:
      "Caution: payment required before KYC completion. TRIA token not yet launched - reward value uncertain. Strong self-custody angle for content.",
  },
  {
    id: "kast",
    name: "KAST Card",
    issuer: "KAST (Singapore)",
    network: "visa",
    japanAvailability: "japan_unconfirmed",
    cashbackPercent: "Up to 12% (Premium X tier)",
    cashbackToken: "KAST points (token planned Q2 2026)",
    referralReward: "$25 per referral (no cap) + leaderboard prizes up to $1,000/day USDC",
    annualFee: "Basic: $20 (waived with $1K spend in 3 months), Premium X: $1,000",
    features: [
      "Industry-leading cashback rates",
      "Uncapped referral rewards",
      "Daily leaderboard with USDC prizes",
      "Referee gets $100 after $1K spend",
      "KAST token airdrop planned Q2 2026",
    ],
    website: "https://www.kast.xyz/",
    japaneseSupport: false,
    notes:
      "MOST LUCRATIVE referral program if Japan is supported. Verify Japan availability before promoting. Conflicting sources on Japan support.",
  },
  {
    id: "tangem-pay",
    name: "Tangem Pay",
    issuer: "Tangem",
    network: "visa",
    japanAvailability: "japan_available",
    cashbackPercent: "None",
    cashbackToken: "N/A",
    referralReward: "Not detailed",
    annualFee: "Free (no annual, monthly, or transaction fees)",
    features: [
      "True self-custody via hardware wallet card",
      "Zero fees (no annual, monthly, FX, or transaction fees)",
      "USDC on Polygon only",
      "Apple Pay / Google Pay support",
      "Virtual card only",
      "42 countries including Japan",
    ],
    website: "https://tangem.com/en/cardwaitlist/",
    japaneseSupport: false,
    notes:
      "Best for privacy/fee-conscious users. No rewards but zero-fee model is compelling. Virtual only (no physical card).",
  },
] as const;

export function getJapanAvailableCards(): readonly CryptoCard[] {
  return JAPAN_CRYPTO_CARDS.filter(
    (card) =>
      card.japanAvailability === "japan_native" ||
      card.japanAvailability === "japan_available"
  );
}

export function getCardsByReferralValue(): readonly CryptoCard[] {
  return [...JAPAN_CRYPTO_CARDS]
    .filter((card) => card.referralReward !== "Not yet announced" && card.referralReward !== "Not publicly disclosed")
    .sort((a, b) => {
      // Simple heuristic: cards with $ amounts in referral are ranked higher
      const aHasDollar = a.referralReward.includes("$");
      const bHasDollar = b.referralReward.includes("$");
      if (aHasDollar && !bHasDollar) return -1;
      if (!aHasDollar && bHasDollar) return 1;
      return 0;
    });
}
