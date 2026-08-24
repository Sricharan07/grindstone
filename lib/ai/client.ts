import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | undefined;

export function getAiClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is required for AI coaching and content jobs");
  }
  client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export function assertWithinAiBudget(monthToDateUsd: number, requestedUsd: number) {
  const cap = Number(process.env.AI_MONTHLY_CAP_USD ?? 40);
  if (monthToDateUsd + requestedUsd > cap) {
    throw new Error(`AI monthly cap of $${cap.toFixed(2)} would be exceeded`);
  }
}
