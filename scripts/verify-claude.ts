import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

async function verify() {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content:
            "Reply with exactly: 'Claudex content generator ready.' Nothing else.",
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    console.log(`[OK] Claude API connected`);
    console.log(`  Model: ${response.model}`);
    console.log(`  Response: ${text}`);
    console.log(
      `  Tokens: ${response.usage.input_tokens} in / ${response.usage.output_tokens} out`
    );
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number };
    console.error("[FAIL] Claude API connection failed");
    console.error(`  Error: ${err.message ?? String(error)}`);
  }
}

verify();
