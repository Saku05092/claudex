import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import type { SearchQuery } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, "../../data/airdrop-influencers.json");

const SUFFIX = " -is:retweet";
const DEFAULT_MAX_QUERY_LENGTH = 512;

interface InfluencerEntry {
  readonly username: string;
}

interface InfluencerData {
  readonly japanese: readonly InfluencerEntry[];
  readonly international: readonly InfluencerEntry[];
}

export async function loadInfluencerUsernames(): Promise<readonly string[]> {
  const raw = await fs.readFile(DATA_PATH, "utf-8");
  const data: InfluencerData = JSON.parse(raw);
  return [
    ...data.japanese.map((c) => c.username),
    ...data.international.map((c) => c.username),
  ];
}

export async function batchInfluencerQueries(
  maxQueryLength: number = DEFAULT_MAX_QUERY_LENGTH
): Promise<readonly SearchQuery[]> {
  const usernames = await loadInfluencerUsernames();
  const batches: SearchQuery[] = [];
  let currentHandles: string[] = [];
  let currentLength = 0;

  const availableLength = maxQueryLength - SUFFIX.length;

  for (const username of usernames) {
    // "from:username" = 5 + username.length
    // " OR " separator = 4
    const entryLength = `from:${username}`.length;
    const separatorLength = currentHandles.length > 0 ? 4 : 0;
    const newLength = currentLength + separatorLength + entryLength;

    if (newLength > availableLength && currentHandles.length > 0) {
      batches.push(buildBatchQuery(currentHandles, batches.length + 1));
      currentHandles = [];
      currentLength = 0;
    }

    currentHandles = [...currentHandles, username];
    currentLength =
      currentHandles.length === 1
        ? entryLength
        : currentLength + 4 + entryLength;
  }

  if (currentHandles.length > 0) {
    batches.push(buildBatchQuery(currentHandles, batches.length + 1));
  }

  return batches;
}

function buildBatchQuery(handles: readonly string[], batchNum: number): SearchQuery {
  const fromParts = handles.map((h) => `from:${h}`);
  const query = fromParts.join(" OR ") + SUFFIX;

  return {
    query,
    sourceType: "influencer",
    label: `Influencer batch ${batchNum} (${handles.length} accounts)`,
  };
}
