import fs from "fs/promises";
import path from "path";
import type { ProjectResearch } from "./project-researcher.js";

const DASHBOARD_PATH = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  "../dashboard/index.html"
);

/**
 * Add a new airdrop entry to the dashboard HTML
 */
export async function publishToDashboard(
  project: ProjectResearch
): Promise<{ success: boolean; message: string }> {
  if (!project.suitable) {
    return {
      success: false,
      message: `[Publisher] Skipped: ${project.name} - ${project.reason}`,
    };
  }

  const html = await fs.readFile(DASHBOARD_PATH, "utf-8");

  // Check if already exists
  const idSlug = slugify(project.name);
  if (html.includes(`id: "${idSlug}"`)) {
    return {
      success: false,
      message: `[Publisher] Already exists: ${project.name} (id: ${idSlug})`,
    };
  }

  // Generate the new entry
  const entry = generateAirdropEntry(project, idSlug);

  // Insert before the TGE completed section or at end of active entries
  const insertMarker = "// === TGE/AIRDROP";
  const insertIndex = html.indexOf(insertMarker);

  if (insertIndex === -1) {
    // Fallback: insert before closing bracket of AIRDROPS array
    const arrayEnd = html.indexOf("];\n\nconst CARDS");
    if (arrayEnd === -1) {
      return {
        success: false,
        message: "[Publisher] Could not find insertion point in dashboard HTML.",
      };
    }
    const updated = html.slice(0, arrayEnd) + entry + html.slice(arrayEnd);
    await fs.writeFile(DASHBOARD_PATH, updated, "utf-8");
  } else {
    const updated =
      html.slice(0, insertIndex) + entry + "  " + html.slice(insertIndex);
    await fs.writeFile(DASHBOARD_PATH, updated, "utf-8");
  }

  return {
    success: true,
    message: `[Publisher] Added: ${project.name} (Tier ${project.tier}) to dashboard`,
  };
}

/**
 * Remove an airdrop entry from the dashboard by id
 */
export async function removeFromDashboard(
  projectId: string
): Promise<{ success: boolean; message: string }> {
  const html = await fs.readFile(DASHBOARD_PATH, "utf-8");

  const entryStart = html.indexOf(`id: "${projectId}"`);
  if (entryStart === -1) {
    return {
      success: false,
      message: `[Publisher] Not found: ${projectId}`,
    };
  }

  // Find the start of this entry's object (search backwards for '{')
  let braceCount = 0;
  let objStart = entryStart;
  while (objStart > 0) {
    if (html[objStart] === "{") {
      braceCount++;
      if (braceCount === 1) break;
    }
    if (html[objStart] === "}") braceCount--;
    objStart--;
  }

  // Find the end of this entry's object
  braceCount = 0;
  let objEnd = objStart;
  while (objEnd < html.length) {
    if (html[objEnd] === "{") braceCount++;
    if (html[objEnd] === "}") {
      braceCount--;
      if (braceCount === 0) {
        objEnd++;
        break;
      }
    }
    objEnd++;
  }

  // Include trailing comma and whitespace
  while (objEnd < html.length && (html[objEnd] === "," || html[objEnd] === "\n" || html[objEnd] === " ")) {
    objEnd++;
  }

  const updated = html.slice(0, objStart) + html.slice(objEnd);
  await fs.writeFile(DASHBOARD_PATH, updated, "utf-8");

  return {
    success: true,
    message: `[Publisher] Removed: ${projectId}`,
  };
}

function generateAirdropEntry(
  project: ProjectResearch,
  id: string
): string {
  const tasks = project.tasks.map((t) => `"${escapeStr(t)}"`).join(", ");
  const backers = project.backers.map((b) => `"${escapeStr(b)}"`).join(", ");
  const today = new Date().toISOString().split("T")[0];

  return `  {
    id: "${id}",
    name: "${escapeStr(project.name)}",
    ticker: "${escapeStr(project.ticker)}",
    category: "${project.category}",
    chain: "${escapeStr(project.chain)}",
    tier: "${project.tier}",
    status: "${project.status}",
    tgeCompleted: ${project.tgeCompleted},
    description: "${escapeStr(project.description)}",
    tasks: [${tasks}],
    estimatedValue: "${escapeStr(project.estimatedValue)}",
    fundingRaised: "${escapeStr(project.fundingRaised)}",
    backers: [${backers}],
    website: "${escapeStr(project.website)}",
    twitter: "${escapeStr(project.twitter)}",
    referralLink: "${escapeStr(project.referralLink)}",
    mentionCount: ${project.mentionCount},
    mentionedBy: [],
    riskLevel: "${project.riskLevel}",
    addedAt: "${today}",
    deadline: ""
  },
`;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function escapeStr(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, " ");
}
