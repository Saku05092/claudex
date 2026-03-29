/**
 * Claudex API Server
 *
 * Serves airdrop campaign data to AirHunt and other clients.
 *
 * Endpoints:
 *   GET /api/campaigns          - All active campaigns
 *   GET /api/campaigns/:id      - Single campaign by ID
 *   GET /api/campaigns/all      - All campaigns including ended
 *   GET /api/health             - Health check
 */
import { createServer } from "http";
import { CAMPAIGNS, getActiveCampaigns, getCampaignById } from "./data.js";

const PORT = Number(process.env.CLAUDEX_API_PORT ?? 3001);

function jsonResponse(data: unknown, status: number = 200): { body: string; status: number; headers: Record<string, string> } {
  return {
    body: JSON.stringify(data),
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  };
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const path = url.pathname;

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  let response: { body: string; status: number; headers: Record<string, string> };

  if (path === "/api/health") {
    response = jsonResponse({
      status: "ok",
      service: "claudex-api",
      version: "0.1.0",
      campaigns: CAMPAIGNS.length,
      activeCampaigns: getActiveCampaigns().length,
      timestamp: new Date().toISOString(),
    });
  } else if (path === "/api/campaigns") {
    const active = getActiveCampaigns();
    response = jsonResponse({
      count: active.length,
      campaigns: active,
      updatedAt: new Date().toISOString(),
    });
  } else if (path === "/api/campaigns/all") {
    response = jsonResponse({
      count: CAMPAIGNS.length,
      campaigns: CAMPAIGNS,
      updatedAt: new Date().toISOString(),
    });
  } else if (path.startsWith("/api/campaigns/")) {
    const id = path.replace("/api/campaigns/", "");
    const campaign = getCampaignById(id);
    if (campaign) {
      response = jsonResponse(campaign);
    } else {
      response = jsonResponse({ error: "Campaign not found" }, 404);
    }
  } else {
    response = jsonResponse({
      error: "Not found",
      availableEndpoints: [
        "GET /api/health",
        "GET /api/campaigns",
        "GET /api/campaigns/all",
        "GET /api/campaigns/:id",
      ],
    }, 404);
  }

  res.writeHead(response.status, response.headers);
  res.end(response.body);
});

server.listen(PORT, () => {
  console.log(`[Claudex API] Running on http://localhost:${PORT}`);
  console.log(`[Claudex API] Endpoints:`);
  console.log(`  GET /api/health`);
  console.log(`  GET /api/campaigns        (${getActiveCampaigns().length} active)`);
  console.log(`  GET /api/campaigns/all     (${CAMPAIGNS.length} total)`);
  console.log(`  GET /api/campaigns/:id`);
});
