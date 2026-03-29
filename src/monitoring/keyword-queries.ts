import type { SearchQuery } from "./types.js";

/**
 * Daily keyword search queries for airdrop/DeFi monitoring.
 * Each query targets a specific content category.
 * All queries must be under 512 characters.
 */
export const KEYWORD_QUERIES: readonly SearchQuery[] = [
  {
    query: "エアドロップ (DeFi OR airdrop OR TGE) -is:retweet lang:ja",
    sourceType: "keyword",
    label: "JP: Airdrop general",
  },
  {
    query: "airdrop (farming OR claim OR eligible OR confirmed) -is:retweet lang:en",
    sourceType: "keyword",
    label: "EN: Airdrop farming",
  },
  {
    query: "(TGE OR token launch) (airdrop OR snapshot) -is:retweet",
    sourceType: "keyword",
    label: "Bilingual: TGE alerts",
  },
  {
    query: "(クリプトカード OR crypto card) (cashback OR rewards) -is:retweet",
    sourceType: "keyword",
    label: "Bilingual: Crypto cards",
  },
  {
    query: "(リファーラル OR referral) (DeFi OR protocol OR airdrop) -is:retweet",
    sourceType: "keyword",
    label: "Bilingual: Referral programs",
  },
];

export function buildKeywordQueries(): readonly SearchQuery[] {
  return KEYWORD_QUERIES;
}
