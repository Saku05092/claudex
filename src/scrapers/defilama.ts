import type { DeFiProtocol } from "../core/types.js";

const BASE_URL = "https://api.llama.fi";

interface DefiLlamaProtocol {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly chain: string;
  readonly chains: readonly string[];
  readonly tvl: number;
  readonly change_1d: number | null;
  readonly url: string;
  readonly twitter: string | null;
  readonly listedAt: number;
}

export async function fetchAllProtocols(): Promise<readonly DeFiProtocol[]> {
  const response = await fetch(`${BASE_URL}/protocols`);
  if (!response.ok) {
    throw new Error(`DeFiLlama API error: ${response.status}`);
  }

  const data: readonly DefiLlamaProtocol[] = await response.json();
  return data.map(mapToProtocol);
}

export async function fetchNewProtocols(
  sinceDaysAgo: number = 7
): Promise<readonly DeFiProtocol[]> {
  const allProtocols = await fetchAllProtocols();
  const cutoff = Date.now() - sinceDaysAgo * 24 * 60 * 60 * 1000;

  return allProtocols.filter((p) => {
    const firstSeen = p.firstSeen.getTime();
    return firstSeen > cutoff && p.tvl > 100_000; // Min $100k TVL
  });
}

export async function fetchProtocolTvl(
  protocolSlug: string
): Promise<{
  readonly tvl: number;
  readonly tvlHistory: readonly { date: number; tvl: number }[];
}> {
  const response = await fetch(`${BASE_URL}/protocol/${protocolSlug}`);
  if (!response.ok) {
    throw new Error(
      `DeFiLlama protocol API error: ${response.status}`
    );
  }

  const data = await response.json();
  return {
    tvl: data.currentChainTvls
      ? Object.values(data.currentChainTvls as Record<string, number>).reduce(
          (sum: number, v: number) => sum + v,
          0
        )
      : 0,
    tvlHistory: (data.tvl ?? []).map(
      (entry: { date: number; totalLiquidityUSD: number }) => ({
        date: entry.date,
        tvl: entry.totalLiquidityUSD,
      })
    ),
  };
}

export async function checkForReferralProgram(
  websiteUrl: string
): Promise<{
  readonly hasReferral: boolean;
  readonly referralUrl?: string;
}> {
  try {
    const response = await fetch(websiteUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return { hasReferral: false };
    }

    const html = await response.text();
    const referralKeywords = [
      "referral",
      "refer a friend",
      "invite",
      "affiliate",
      "earn rewards",
      "share and earn",
      "referral program",
    ];

    const hasReferral = referralKeywords.some((keyword) =>
      html.toLowerCase().includes(keyword)
    );

    // Try to find referral page URL
    const referralLinkMatch = html.match(
      /href=["']([^"']*(?:referral|invite|affiliate)[^"']*)["']/i
    );

    return {
      hasReferral,
      referralUrl: referralLinkMatch
        ? new URL(referralLinkMatch[1], websiteUrl).toString()
        : undefined,
    };
  } catch {
    return { hasReferral: false };
  }
}

function mapToProtocol(raw: DefiLlamaProtocol): DeFiProtocol {
  return {
    id: raw.id,
    name: raw.name,
    category: raw.category,
    chain: raw.chain,
    tvl: raw.tvl ?? 0,
    tvlChange24h: raw.change_1d ?? 0,
    firstSeen: new Date(raw.listedAt * 1000),
    hasReferral: false,
    website: raw.url,
    twitter: raw.twitter ?? undefined,
  };
}
