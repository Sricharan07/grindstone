import "dotenv/config";
import { Queue } from "bullmq";
import { gte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { aiUsage, contentBatches } from "@/db/schema";
import { assertWithinAiBudget } from "@/lib/ai/client";
import { estimateBatchCost } from "@/lib/ai/pricing";
import type { GenerationRequest } from "@/lib/content/types";

async function main() {
const topic = process.argv[2] ?? "Percentages";
const kind = (process.argv[3] ?? "quantitative") as GenerationRequest["kind"];
const count = Number(process.argv[4] ?? 20);
if (!Number.isInteger(count) || count < 1 || count > 500) throw new Error("Count must be an integer from 1 to 500");
if (!(["mcq", "pseudocode", "quantitative", "reasoning", "verbal", "fundamentals", "lesson", "sql"] as string[]).includes(kind)) throw new Error(`Unsupported kind: ${kind}`);
if (!process.env.REDIS_URL) throw new Error("REDIS_URL is required");

const request: GenerationRequest = { topic, kind, difficulty: 0.5, count };
const db = getDb();
const start = new Date(); start.setUTCDate(1); start.setUTCHours(0, 0, 0, 0);
const [usage] = await db.select({ total: sql<number>`coalesce(sum(${aiUsage.costUsd}), 0)` }).from(aiUsage).where(gte(aiUsage.createdAt, start));
const monthToDateUsd = Number(usage?.total ?? 0);
const estimatedCostUsd = estimateBatchCost(count);
assertWithinAiBudget(monthToDateUsd, estimatedCostUsd);
const [batch] = await db.insert(contentBatches).values({ purpose: `${kind}:${topic}`, requested: count, estimatedCostUsd }).returning({ id: contentBatches.id });
const queue = new Queue("grindstone", { connection: { url: process.env.REDIS_URL } });
try {
  const job = await queue.add("generate-content", { request, monthToDateUsd, batchId: batch.id }, { attempts: 2, backoff: { type: "exponential", delay: 5000 } });
  console.info(JSON.stringify({ batchId: batch.id, jobId: job.id, estimatedCostUsd }, null, 2));
} finally {
  await queue.close();
}
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
