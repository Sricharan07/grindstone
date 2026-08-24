import { getAiClient } from "@/lib/ai/client";
import { estimateAiCost } from "@/lib/ai/pricing";
import { orderedOptions } from "./options";
import type { GeneratedContentItem } from "./types";

function text(content: Array<{ type: string; text?: string }>) { return content.filter((item) => item.type === "text").map((item) => item.text ?? "").join(" ").trim(); }

export async function independentlySolve(item: GeneratedContentItem) {
  const model = process.env.AI_CRITIC_MODEL ?? "claude-opus-5";
  const response = await getAiClient().messages.create({ model, max_tokens: 120, temperature: 0, messages: [{ role: "user", content: `Solve this cold. Return only the final answer, with no explanation.\n\n${item.prompt}\n\nOptions: ${orderedOptions(item).join(" | ")}` }] });
  return { answer: text(response.content), costUsd: estimateAiCost("critic", response.usage.input_tokens, response.usage.output_tokens), inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens };
}

export async function critiqueAmbiguity(item: GeneratedContentItem) {
  const model = process.env.AI_CRITIC_MODEL ?? "claude-opus-5";
  const response = await getAiClient().messages.create({ model, max_tokens: 300, temperature: 0, messages: [{ role: "user", content: `Audit for multiple defensible answers, missing units, unstated assumptions, duplicate options, or misleading wording. Return OK if none; otherwise one issue per line.\n${JSON.stringify({ prompt: item.prompt, answer: item.answer, distractors: item.distractors })}` }] });
  const value = text(response.content); const issues = /^ok[.!]?$/i.test(value) ? [] : value.split("\n").map((line) => line.replace(/^[-*\d.)\s]+/, "").trim()).filter(Boolean);
  return { issues, costUsd: estimateAiCost("critic", response.usage.input_tokens, response.usage.output_tokens), inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens };
}
