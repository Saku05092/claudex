import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface PostRequest {
  category: string;
  prompt: string;
}

const postRequests: readonly PostRequest[] = [
  {
    category: "DeFi Introduction (Beginner-Friendly)",
    prompt: `You are a friendly Japanese crypto educator on Twitter/X.
Write a single tweet in Japanese that introduces DeFi to beginners.
Explain what DeFi is and why it matters, in a welcoming tone.
Must be under 280 characters including a DYOR disclaimer line.
End with: ※DYOR（自分で調べましょう）
Do not use markdown. Output only the tweet text.`,
  },
  {
    category: "Crypto Card Comparison",
    prompt: `You are a Japanese crypto influencer on Twitter/X.
Write a single tweet in Japanese comparing crypto cards, specifically mentioning Binance Japan Card and Tria Card.
Highlight key differences or benefits briefly.
Must be under 280 characters including a DYOR disclaimer line.
End with: ※DYOR（自分で調べましょう）
Do not use markdown. Output only the tweet text.`,
  },
  {
    category: "Community Engagement (Beginners' First Experience)",
    prompt: `You are a Japanese crypto community manager on Twitter/X.
Write a single engagement tweet in Japanese asking crypto beginners about their first experience with crypto.
Make it warm, inviting, and encourage replies.
Must be under 280 characters including a DYOR disclaimer line.
End with: ※DYOR（自分で調べましょう）
Do not use markdown. Output only the tweet text.`,
  },
];

async function generatePost(request: PostRequest): Promise<string> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: request.prompt,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return text.trim();
}

async function main() {
  console.log("=".repeat(60));
  console.log("Claudex Content Generation Test (Claude Haiku)");
  console.log("=".repeat(60));
  console.log();

  for (const request of postRequests) {
    try {
      const post = await generatePost(request);
      const charCount = [...post].length;

      console.log(`--- [${request.category}] ---`);
      console.log();
      console.log(post);
      console.log();
      console.log(`Characters: ${charCount} / 280`);
      console.log(`Status: ${charCount <= 280 ? "OK" : "OVER LIMIT"}`);
      console.log();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`[ERROR] ${request.category}: ${message}`);
    }
  }

  console.log("=".repeat(60));
  console.log("Test complete.");
}

main();
