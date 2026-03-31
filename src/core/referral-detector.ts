import { createDatabase } from "./database.js";
import { fetchNewProtocols, checkForReferralProgram } from "../scrapers/defilama.js";
import { createTweetAnalyzer } from "../monitoring/tweet-analyzer.js";
import { randomUUID } from "crypto";
import type Database from "better-sqlite3";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DetectedReferral {
  readonly campaignId: string;
  readonly campaignName: string;
  readonly referralUrl: string;
  readonly detectedAt: string;
  readonly source: "defilama" | "twitter" | "manual";
  readonly confidence: "high" | "medium" | "low";
}

interface ScanResult {
  readonly scannedProtocols: number;
  readonly scannedTrending: number;
  readonly detected: readonly DetectedReferral[];
}

interface RegisterResult {
  readonly registered: number;
  readonly skipped: number;
  readonly details: readonly { campaignId: string; campaignName: string; status: "registered" | "skipped" }[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateCampaignId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isAlreadyRegistered(db: Database.Database, name: string): boolean {
  const row = db
    .prepare(
      "SELECT COUNT(*) as count FROM campaigns WHERE LOWER(name) = LOWER(?)"
    )
    .get(name) as { count: number };
  return row.count > 0;
}

// ---------------------------------------------------------------------------
// Referral Detector
// ---------------------------------------------------------------------------

interface ReferralDetectorApi {
  readonly scanForNewReferrals: () => Promise<ScanResult>;
  readonly autoRegisterReferrals: (detected: readonly DetectedReferral[]) => RegisterResult;
}

export function createReferralDetector(): ReferralDetectorApi {
  const db = createDatabase();
  const analyzer = createTweetAnalyzer(db);

  // --- Scan DeFiLlama for new protocols with referrals ---

  async function scanDeFiLlama(): Promise<readonly DetectedReferral[]> {
    const detected: DetectedReferral[] = [];

    try {
      const newProtocols = await fetchNewProtocols(7);

      for (const protocol of newProtocols) {
        if (isAlreadyRegistered(db, protocol.name)) continue;
        if (!protocol.website) continue;

        try {
          const referralCheck = await checkForReferralProgram(protocol.website);

          if (referralCheck.hasReferral) {
            const confidence = referralCheck.referralUrl ? "high" : "medium";
            detected.push({
              campaignId: generateCampaignId(protocol.name),
              campaignName: protocol.name,
              referralUrl: referralCheck.referralUrl ?? protocol.website,
              detectedAt: new Date().toISOString(),
              source: "defilama",
              confidence,
            });
          }
        } catch {
          // Skip protocols we cannot check
        }
      }
    } catch (error) {
      console.error("[ReferralDetector] DeFiLlama scan failed:", error);
    }

    return detected;
  }

  // --- Scan trending tweets for referral mentions ---

  async function scanTrending(): Promise<readonly DetectedReferral[]> {
    const detected: DetectedReferral[] = [];

    try {
      const trending = analyzer.getTrendingProjects(30);
      const knownNames = trending.map((t) => t.name);
      const unknownProjects = analyzer.extractUnknownProjects(knownNames);

      for (const project of unknownProjects) {
        if (isAlreadyRegistered(db, project.name)) continue;
        if (project.mentions < 3) continue;

        // Check sample tweets for referral keywords
        const referralKeywords = [
          "referral",
          "invite",
          "affiliate",
          "earn rewards",
          "紹介",
          "招待",
          "リファラル",
        ];
        const hasReferralMention = project.sampleTweets.some((tweet) =>
          referralKeywords.some((kw) => tweet.toLowerCase().includes(kw.toLowerCase()))
        );

        if (hasReferralMention) {
          detected.push({
            campaignId: generateCampaignId(project.name),
            campaignName: project.name,
            referralUrl: "",
            detectedAt: new Date().toISOString(),
            source: "twitter",
            confidence: project.mentions >= 5 ? "medium" : "low",
          });
        }
      }
    } catch (error) {
      console.error("[ReferralDetector] Trending scan failed:", error);
    }

    return detected;
  }

  // --- Combined scan ---

  async function scanForNewReferrals(): Promise<ScanResult> {
    const [defilamaResults, trendingResults] = await Promise.all([
      scanDeFiLlama(),
      scanTrending(),
    ]);

    // Deduplicate by campaign name (case-insensitive)
    const seen = new Set<string>();
    const allDetected: DetectedReferral[] = [];

    for (const item of [...defilamaResults, ...trendingResults]) {
      const key = item.campaignName.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      allDetected.push(item);
    }

    return {
      scannedProtocols: defilamaResults.length,
      scannedTrending: trendingResults.length,
      detected: allDetected,
    };
  }

  // --- Auto-register high-confidence referrals ---

  function autoRegisterReferrals(
    detected: readonly DetectedReferral[]
  ): RegisterResult {
    const details: { campaignId: string; campaignName: string; status: "registered" | "skipped" }[] = [];
    let registered = 0;
    let skipped = 0;

    for (const referral of detected) {
      if (referral.confidence !== "high") {
        skipped += 1;
        details.push({
          campaignId: referral.campaignId,
          campaignName: referral.campaignName,
          status: "skipped",
        });
        continue;
      }

      if (isAlreadyRegistered(db, referral.campaignName)) {
        skipped += 1;
        details.push({
          campaignId: referral.campaignId,
          campaignName: referral.campaignName,
          status: "skipped",
        });
        continue;
      }

      try {
        db.prepare(
          `INSERT INTO campaigns
            (id, name, referral_link, source, status, added_at, created_at)
          VALUES (?, ?, ?, ?, 'active', datetime('now'), datetime('now'))`
        ).run(
          referral.campaignId,
          referral.campaignName,
          referral.referralUrl,
          referral.source
        );

        registered += 1;
        details.push({
          campaignId: referral.campaignId,
          campaignName: referral.campaignName,
          status: "registered",
        });
      } catch (error) {
        console.error(
          `[ReferralDetector] Failed to register ${referral.campaignName}:`,
          error
        );
        skipped += 1;
        details.push({
          campaignId: referral.campaignId,
          campaignName: referral.campaignName,
          status: "skipped",
        });
      }
    }

    return { registered, skipped, details };
  }

  return { scanForNewReferrals, autoRegisterReferrals };
}
