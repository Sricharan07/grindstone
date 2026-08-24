import { NextResponse } from "next/server";
import { Queue } from "bullmq";
import { gte, sql } from "drizzle-orm";
import { z } from "zod";
import { estimateBatchCost } from "@/lib/ai/pricing";
import { assertWithinAiBudget } from "@/lib/ai/client";
import { getDb } from "@/db";
import { aiUsage, contentBatches } from "@/db/schema";
import { getActor } from "@/lib/server/actor";

const schema = z.object({ topic: z.string().min(2), kind: z.enum(["mcq", "pseudocode", "quantitative", "reasoning", "verbal", "fundamentals", "lesson", "sql"]), difficulty: z.number().min(0).max(1), count: z.number().int().min(1).max(500) });

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const administrators = new Set((process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean));
  if (!administrators.has(actor.email.toLowerCase())) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => undefined));
  if (!parsed.success) return NextResponse.json({ error: "Invalid content batch" }, { status: 400 });
  const estimatedCostUsd = estimateBatchCost(parsed.data.count);
  let monthToDateUsd = 0;
  try {
    const start = new Date(); start.setUTCDate(1); start.setUTCHours(0, 0, 0, 0);
    const [usage] = await getDb().select({ total: sql<number>`coalesce(sum(${aiUsage.costUsd}), 0)` }).from(aiUsage).where(gte(aiUsage.createdAt, start));
    monthToDateUsd = Number(usage?.total ?? 0);
  } catch { return NextResponse.json({ error: "Content generation requires Postgres" }, { status: 503 }); }
  try { assertWithinAiBudget(monthToDateUsd, estimatedCostUsd); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Budget exceeded", estimatedCostUsd }, { status: 409 }); }
  if (!process.env.REDIS_URL) return NextResponse.json({ error: "REDIS_URL is not configured", estimatedCostUsd }, { status: 503 });
  const queue = new Queue("grindstone", { connection: { url: process.env.REDIS_URL } });
  try {
    const [batch] = await getDb().insert(contentBatches).values({ purpose: `${parsed.data.kind}:${parsed.data.topic}`, requested: parsed.data.count, estimatedCostUsd }).returning({ id: contentBatches.id });
    const job = await queue.add("generate-content", { request: parsed.data, monthToDateUsd, batchId: batch.id }, { attempts: 2, backoff: { type: "exponential", delay: 5000 }, removeOnComplete: 50, removeOnFail: 100 });
    return NextResponse.json({ batchId: batch.id, jobId: job.id, estimatedCostUsd }, { status: 202 });
  } finally { await queue.close(); }
}
