import { randomUUID } from "crypto";
import { createDatabase } from "./database.js";

interface PostRecord {
  readonly id: string;
  readonly platform: string;
  readonly contentText: string;
  readonly contentCategory: string;
  readonly referralLink: string | null;
  readonly scheduledAt: string;
  readonly postedAt: string | null;
  readonly status: string;
  readonly createdAt: string;
}

interface PostStats {
  readonly totalPosts: number;
  readonly byPlatform: Readonly<Record<string, number>>;
  readonly byCategory: Readonly<Record<string, number>>;
  readonly byDay: Readonly<Record<string, number>>;
}

function getDb() {
  return createDatabase();
}

export function recordPost(
  platform: string,
  text: string,
  category: string,
  referralLink?: string,
  postId?: string,
  url?: string
): string {
  const db = getDb();
  try {
    const id = postId ?? randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO scheduled_posts
        (id, platform, content_text, content_category, referral_link,
         scheduled_at, status, posted_at, image_path)
      VALUES (?, ?, ?, ?, ?, ?, 'posted', ?, ?)`
    ).run(id, platform, text, category, referralLink ?? null, now, now, url ?? null);

    return id;
  } finally {
    db.close();
  }
}

export function getPostHistory(
  limit: number = 50,
  platform?: string
): readonly PostRecord[] {
  const db = getDb();
  try {
    const query = platform
      ? "SELECT * FROM scheduled_posts WHERE platform = ? ORDER BY scheduled_at DESC LIMIT ?"
      : "SELECT * FROM scheduled_posts ORDER BY scheduled_at DESC LIMIT ?";

    const params = platform ? [platform, limit] : [limit];

    const rows = db.prepare(query).all(...params) as readonly Record<
      string,
      unknown
    >[];

    return rows.map(mapRow);
  } finally {
    db.close();
  }
}

export function getPostStats(): PostStats {
  const db = getDb();
  try {
    const totalRow = db
      .prepare("SELECT COUNT(*) as count FROM scheduled_posts")
      .get() as { count: number };

    const platformRows = db
      .prepare(
        "SELECT platform, COUNT(*) as count FROM scheduled_posts GROUP BY platform"
      )
      .all() as readonly { platform: string; count: number }[];

    const categoryRows = db
      .prepare(
        "SELECT content_category, COUNT(*) as count FROM scheduled_posts GROUP BY content_category"
      )
      .all() as readonly { content_category: string; count: number }[];

    const dayRows = db
      .prepare(
        "SELECT DATE(scheduled_at) as day, COUNT(*) as count FROM scheduled_posts GROUP BY DATE(scheduled_at) ORDER BY day DESC LIMIT 30"
      )
      .all() as readonly { day: string; count: number }[];

    const byPlatform: Record<string, number> = {};
    for (const row of platformRows) {
      byPlatform[row.platform] = row.count;
    }

    const byCategory: Record<string, number> = {};
    for (const row of categoryRows) {
      byCategory[row.content_category] = row.count;
    }

    const byDay: Record<string, number> = {};
    for (const row of dayRows) {
      byDay[row.day] = row.count;
    }

    return {
      totalPosts: totalRow.count,
      byPlatform,
      byCategory,
      byDay,
    };
  } finally {
    db.close();
  }
}

export function getPostsByDate(date: string): readonly PostRecord[] {
  const db = getDb();
  try {
    const rows = db
      .prepare(
        "SELECT * FROM scheduled_posts WHERE DATE(scheduled_at) = ? ORDER BY scheduled_at DESC"
      )
      .all(date) as readonly Record<string, unknown>[];

    return rows.map(mapRow);
  } finally {
    db.close();
  }
}

function mapRow(row: Record<string, unknown>): PostRecord {
  return {
    id: row.id as string,
    platform: row.platform as string,
    contentText: row.content_text as string,
    contentCategory: row.content_category as string,
    referralLink: (row.referral_link as string) || null,
    scheduledAt: row.scheduled_at as string,
    postedAt: (row.posted_at as string) || null,
    status: row.status as string,
    createdAt: row.created_at as string,
  };
}
