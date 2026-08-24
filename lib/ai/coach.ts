import { and, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { aiUsage } from "@/db/schema";
import { assertWithinAiBudget, getAiClient } from "./client";
import { estimateAiCost } from "./pricing";

export async function coach({ userId, purpose, prompt, context }: { userId: string; purpose: string; prompt: string; context: string }) {
  let userMonthToDateUsd = 0;
  let globalMonthToDateUsd = 0;
  try {
    const start = new Date(); start.setUTCDate(1); start.setUTCHours(0, 0, 0, 0);
    const [userRow] = await getDb().select({ total: sql<number>`coalesce(sum(${aiUsage.costUsd}), 0)` }).from(aiUsage).where(and(eq(aiUsage.userId, userId), gte(aiUsage.createdAt, start)));
    const [globalRow] = await getDb().select({ total: sql<number>`coalesce(sum(${aiUsage.costUsd}), 0)` }).from(aiUsage).where(gte(aiUsage.createdAt, start));
    userMonthToDateUsd = Number(userRow?.total ?? 0);
    globalMonthToDateUsd = Number(globalRow?.total ?? 0);
  } catch { userMonthToDateUsd = 0; globalMonthToDateUsd = 0; }
  const userCap = Number(process.env.AI_USER_MONTHLY_CAP_USD ?? 5);
  if (userMonthToDateUsd + 0.05 > userCap) throw new Error(`Per-user AI cap of $${userCap.toFixed(2)} would be exceeded`);
  assertWithinAiBudget(globalMonthToDateUsd, 0.05);
  const model = process.env.AI_CRITIC_MODEL ?? "claude-opus-5";
  const response = await getAiClient().messages.create({ model, max_tokens: 700, temperature: 0.2, messages: [{ role: "user", content: `You are Grindstone's terse interview coach. Push back on hand-waving. Never provide a finished solution when a question or counterexample can advance retrieval.\n\nAnchored content:\n${context}\n\nLearner request:\n${prompt}` }] });
  const answer = response.content.filter((block) => block.type === "text").map((block) => block.text).join("\n");
  const costUsd = estimateAiCost("critic", response.usage.input_tokens, response.usage.output_tokens);
  try { await getDb().insert(aiUsage).values({ userId, purpose, model, inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens, costUsd }); } catch { /* Browser-only development may run without Postgres. */ }
  return { answer, costUsd, monthToDateUsd: userMonthToDateUsd + costUsd };
}
