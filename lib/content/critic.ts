import { getCodexAppServer } from "@/lib/ai/codex-app-server";
import { orderedOptions } from "./options";
import type { GeneratedContentItem } from "./types";

export async function independentlySolve(item: GeneratedContentItem) {
  const answer = await getCodexAppServer().runContentTurn({ threadKey: `solve:${item.id}`, prompt: `Solve this cold. Return only the final answer, with no explanation.\n\n${item.prompt}\n\nOptions: ${orderedOptions(item).join(" | ")}` });
  return { answer: answer.trim(), costUsd: 0, inputTokens: 0, outputTokens: 0 };
}

export async function critiqueAmbiguity(item: GeneratedContentItem) {
  const value = await getCodexAppServer().runContentTurn({ threadKey: `critique:${item.id}`, prompt: `Audit for multiple defensible answers, missing units, unstated assumptions, duplicate options, or misleading wording. Return OK if none; otherwise one issue per line.\n${JSON.stringify({ prompt: item.prompt, answer: item.answer, distractors: item.distractors })}` });
  const issues = /^ok[.!]?$/i.test(value.trim()) ? [] : value.split("\n").map((line) => line.replace(/^[-*\d.)\s]+/, "").trim()).filter(Boolean);
  return { issues, costUsd: 0, inputTokens: 0, outputTokens: 0 };
}
