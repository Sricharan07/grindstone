import { z } from "zod";
import { getAiClient } from "@/lib/ai/client";
import { estimateAiCost } from "@/lib/ai/pricing";
import type { GeneratedContentItem, GenerationRequest } from "./types";

const generatedSchema = z.object({
  prompt: z.string().min(12), answer: z.string().min(1), distractors: z.array(z.string().min(1)).length(3), explanation: z.string().min(20),
  subgoalLabels: z.array(z.string()).min(1), bodyL1: z.string().min(20), bodyL2: z.string().min(20), bodyL3: z.string().min(20),
  verificationProgram: z.string().optional(), expectedOutput: z.string().optional(),
});

function textFromMessage(content: Array<{ type: string; text?: string }>) { return content.filter((block) => block.type === "text").map((block) => block.text ?? "").join("\n"); }
function jsonPayload(text: string) { const start = text.indexOf("{"); const end = text.lastIndexOf("}"); if (start < 0 || end <= start) throw new Error("Generator did not return JSON"); return JSON.parse(text.slice(start, end + 1)); }

export async function generateContentItem(request: GenerationRequest, index: number) {
  const model = process.env.AI_GENERATION_MODEL ?? "claude-sonnet-5";
  const verificationInstruction = ["reasoning", "verbal"].includes(request.kind)
    ? "This item is not execution-verifiable, so verificationProgram and expectedOutput may be omitted."
    : "The Python verificationProgram must print only the claimed answer and derive it rather than echo a literal.";
  const message = await getAiClient().messages.create({ model, max_tokens: 2600, temperature: 0.3, messages: [{ role: "user", content: `Create one ${request.kind} interview-prep item for topic ${request.topic} at difficulty ${request.difficulty}. Return strict JSON with prompt, answer, exactly three distractors, explanation, subgoalLabels, bodyL1, bodyL2, bodyL3, verificationProgram, expectedOutput. ${verificationInstruction} Avoid ambiguity and copyrighted wording. Item sequence ${index}.` }] });
  const parsed = generatedSchema.parse(jsonPayload(textFromMessage(message.content)));
  const item: GeneratedContentItem = { id: crypto.randomUUID(), kind: request.kind, topic: request.topic, difficulty: request.difficulty, ...parsed, status: "generated", verification: {} };
  return { item, costUsd: estimateAiCost("generation", message.usage.input_tokens, message.usage.output_tokens), inputTokens: message.usage.input_tokens, outputTokens: message.usage.output_tokens };
}
