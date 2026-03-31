import Anthropic from "@anthropic-ai/sdk";
import { createDatabase } from "./database.js";
import {
  TWEET_PATTERNS,
  buildTweetPrompt,
  getPatternById,
  type TweetPattern,
  type AirdropProjectData,
} from "./airdrop-tweet-patterns.js";
import {
  postToAll,
  type MultiPostConfig,
  type PostResult,
} from "./multi-poster.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PipelineConfig {
  readonly anthropicApiKey: string;
  readonly twitterConfig?: {
    readonly apiKey: string;
    readonly apiSecret: string;
    readonly accessToken: string;
    readonly accessTokenSecret: string;
  };
}

export interface ContentDraft {
  readonly id: string;
  readonly text: string;
  readonly category: string;
  readonly language: string;
  readonly platforms: readonly string[];
  readonly referralLink?: string;
  readonly imagePath?: string;
  readonly createdAt: string;
  readonly status: "draft" | "approved" | "posted" | "rejected" | "failed";
}

interface ScheduledPostRow {
  readonly id: string;
  readonly platform: string;
  readonly content_text: string;
  readonly content_category: string;
  readonly language: string;
  readonly referral_link: string | null;
  readonly disclaimer: string | null;
  readonly hashtags: string | null;
  readonly image_path: string | null;
  readonly scheduled_at: string;
  readonly status: string;
  readonly posted_at: string | null;
  readonly error: string | null;
  readonly created_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function rowToDraft(row: ScheduledPostRow): ContentDraft {
  return {
    id: row.id,
    text: row.content_text,
    category: row.content_category,
    language: row.language,
    platforms: row.platform.split(","),
    referralLink: row.referral_link ?? undefined,
    imagePath: row.image_path ?? undefined,
    createdAt: row.created_at,
    status: row.status as ContentDraft["status"],
  };
}

function buildMultiPostConfig(config: PipelineConfig): MultiPostConfig {
  return {
    twitter: config.twitterConfig
      ? {
          apiKey: config.twitterConfig.apiKey,
          apiSecret: config.twitterConfig.apiSecret,
          accessToken: config.twitterConfig.accessToken,
          accessTokenSecret: config.twitterConfig.accessTokenSecret,
        }
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

interface PostedDraft {
  readonly draft: ContentDraft;
  readonly results: readonly import("./multi-poster.js").PostResult[];
}

interface ContentPipelineApi {
  generateDraft: (topic: string, pattern: TweetPattern | "news", projectData?: AirdropProjectData) => Promise<ContentDraft>;
  listDrafts: () => readonly ContentDraft[];
  approveDraft: (draftId: string) => ContentDraft;
  rejectDraft: (draftId: string) => ContentDraft;
  postApproved: () => Promise<readonly PostedDraft[]>;
  postDraft: (draftId: string) => Promise<PostedDraft>;
  close: () => void;
}

export function createContentPipeline(config: PipelineConfig): ContentPipelineApi {
  const db = createDatabase();
  const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

  // --- Generate draft ---

  async function generateDraft(
    topic: string,
    pattern: TweetPattern | "news",
    projectData?: AirdropProjectData
  ): Promise<ContentDraft> {
    let systemPrompt: string;
    let userPrompt: string;

    if (pattern === "news") {
      systemPrompt = `You are "mochi" (@mochi_d3fi), a Japanese person who recently started learning about DeFi.
Tone: casual, friendly, honest, curious. Never pushy or salesy.
Write in natural Japanese. No emojis. Under 240 characters.
Sound like a real person sharing genuine thoughts, not a bot.
Always include DYOR.`;
      userPrompt = `以下のトピックについて日本語で短いツイートを書いてください。ニュースを読んだばかりの初心者の感想として自然に書いてください。DYORを含めてください。トピック: ${topic}`;
    } else if (projectData) {
      const patternConfig = getPatternById(pattern);
      const prompts = buildTweetPrompt(patternConfig, projectData);
      systemPrompt = prompts.system;
      userPrompt = prompts.user;
    } else {
      const patternConfig = getPatternById(pattern);
      systemPrompt = patternConfig.systemPrompt;
      userPrompt = patternConfig.userPromptTemplate
        .replace("{projectData}", topic)
        .replace("{referralLink}", "none")
        .replace("{hasPR}", "no")
        .replace("{topic}", topic);
    }

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    const id = generateId();
    const platforms = "twitter";
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO scheduled_posts (id, platform, content_text, content_category, language, referral_link, disclaimer, hashtags, image_path, scheduled_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      platforms,
      text,
      pattern,
      "ja",
      projectData?.referralLink ?? null,
      "DYOR/NFA",
      null,
      null,
      now,
      "draft"
    );

    return {
      id,
      text,
      category: pattern,
      language: "ja",
      platforms: platforms.split(","),
      referralLink: projectData?.referralLink,
      createdAt: now,
      status: "draft",
    };
  }

  // --- List drafts ---

  function listDrafts(): readonly ContentDraft[] {
    const rows = db
      .prepare(
        `SELECT * FROM scheduled_posts WHERE status IN ('draft', 'approved') ORDER BY created_at DESC`
      )
      .all() as ScheduledPostRow[];

    return rows.map(rowToDraft);
  }

  // --- Approve draft ---

  function approveDraft(draftId: string): ContentDraft {
    const row = db
      .prepare(`SELECT * FROM scheduled_posts WHERE id = ?`)
      .get(draftId) as ScheduledPostRow | undefined;

    if (!row) {
      throw new Error(`Draft not found: ${draftId}`);
    }

    if (row.status !== "draft") {
      throw new Error(
        `Cannot approve draft with status '${row.status}'. Only 'draft' status can be approved.`
      );
    }

    db.prepare(`UPDATE scheduled_posts SET status = 'approved' WHERE id = ?`).run(
      draftId
    );

    return {
      ...rowToDraft(row),
      status: "approved",
    };
  }

  // --- Reject draft ---

  function rejectDraft(draftId: string): ContentDraft {
    const row = db
      .prepare(`SELECT * FROM scheduled_posts WHERE id = ?`)
      .get(draftId) as ScheduledPostRow | undefined;

    if (!row) {
      throw new Error(`Draft not found: ${draftId}`);
    }

    if (row.status !== "draft") {
      throw new Error(
        `Cannot reject draft with status '${row.status}'. Only 'draft' status can be rejected.`
      );
    }

    db.prepare(`UPDATE scheduled_posts SET status = 'rejected' WHERE id = ?`).run(
      draftId
    );

    return {
      ...rowToDraft(row),
      status: "rejected",
    };
  }

  // --- Post all approved ---

  async function postApproved(): Promise<
    readonly { readonly draft: ContentDraft; readonly results: readonly PostResult[] }[]
  > {
    const rows = db
      .prepare(
        `SELECT * FROM scheduled_posts WHERE status = 'approved' ORDER BY created_at ASC`
      )
      .all() as ScheduledPostRow[];

    const outcomes: { draft: ContentDraft; results: readonly PostResult[] }[] = [];

    for (const row of rows) {
      const draft = rowToDraft(row);
      const multiConfig = buildMultiPostConfig(config);
      const results = await postToAll(draft.text, draft.platforms, multiConfig);

      const allSucceeded = results.every((r) => r.success);
      const anySucceeded = results.some((r) => r.success);
      const newStatus = allSucceeded
        ? "posted"
        : anySucceeded
          ? "posted"
          : "failed";

      const errorMessages = results
        .filter((r) => !r.success)
        .map((r) => `${r.platform}: ${r.error}`)
        .join("; ");

      db.prepare(
        `UPDATE scheduled_posts SET status = ?, posted_at = datetime('now'), error = ? WHERE id = ?`
      ).run(newStatus, errorMessages || null, row.id);

      outcomes.push({
        draft: { ...draft, status: newStatus as ContentDraft["status"] },
        results,
      });
    }

    return outcomes;
  }

  // --- Post single draft ---

  async function postDraft(
    draftId: string
  ): Promise<{ readonly draft: ContentDraft; readonly results: readonly PostResult[] }> {
    const row = db
      .prepare(`SELECT * FROM scheduled_posts WHERE id = ?`)
      .get(draftId) as ScheduledPostRow | undefined;

    if (!row) {
      throw new Error(`Draft not found: ${draftId}`);
    }

    if (row.status !== "draft" && row.status !== "approved") {
      throw new Error(
        `Cannot post draft with status '${row.status}'. Only 'draft' or 'approved' status can be posted.`
      );
    }

    // Approve first if still draft
    if (row.status === "draft") {
      db.prepare(
        `UPDATE scheduled_posts SET status = 'approved' WHERE id = ?`
      ).run(draftId);
    }

    const draft = rowToDraft(row);
    const multiConfig = buildMultiPostConfig(config);
    const results = await postToAll(draft.text, draft.platforms, multiConfig);

    const allSucceeded = results.every((r) => r.success);
    const anySucceeded = results.some((r) => r.success);
    const newStatus = allSucceeded
      ? "posted"
      : anySucceeded
        ? "posted"
        : "failed";

    const errorMessages = results
      .filter((r) => !r.success)
      .map((r) => `${r.platform}: ${r.error}`)
      .join("; ");

    db.prepare(
      `UPDATE scheduled_posts SET status = ?, posted_at = datetime('now'), error = ? WHERE id = ?`
    ).run(newStatus, errorMessages || null, draftId);

    return {
      draft: { ...draft, status: newStatus as ContentDraft["status"] },
      results,
    };
  }

  return {
    generateDraft,
    listDrafts,
    approveDraft,
    rejectDraft,
    postApproved,
    postDraft,
    close: () => db.close(),
  };
}
