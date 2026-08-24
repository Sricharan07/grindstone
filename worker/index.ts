import "dotenv/config";
import { Queue, Worker } from "bullmq";
import { summarizeAudit, type AuditableQuestion } from "@/lib/content/audit";
import { generateContentItem } from "@/lib/content/generator";
import { independentlySolve, critiqueAmbiguity } from "@/lib/content/critic";
import { runContentBatch } from "@/lib/content/pipeline";
import { questionPayload } from "@/lib/content/options";
import { optionDistribution, shouldRetireContent, storedVerificationPasses } from "@/lib/content/retire";
import type { GeneratedContentItem, GenerationRequest } from "@/lib/content/types";
import { getJudge } from "@/lib/judge";
import { estimateBatchCost } from "@/lib/ai/pricing";
import { assertWithinAiBudget } from "@/lib/ai/client";
import { eq, gte, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { aiUsage, attempts, contentBatches, learnerSnapshots, questions } from "@/db/schema";

async function main() {
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) throw new Error("REDIS_URL is required for the Grindstone worker");
const connection = { url: redisUrl };

const maintenanceQueue = new Queue("grindstone", { connection });
await maintenanceQueue.upsertJobScheduler(
  "nightly-rollup",
  { pattern: process.env.NIGHTLY_ROLLUP_CRON ?? "0 2 * * *" },
  { name: "nightly-rollup", data: {}, opts: { removeOnComplete: 14, removeOnFail: 30 } },
);

function fromStoredQuestion(row: typeof questions.$inferSelect): GeneratedContentItem | null {
  const payload = row.payload as { options?: string[]; answerIndex?: number; subgoalLabels?: string[]; bodyL1?: string; bodyL2?: string; bodyL3?: string };
  const answer = payload.options?.[payload.answerIndex ?? -1];
  if (!answer || !payload.options) return null;
  const verification = (row.verification ?? {}) as GeneratedContentItem["verification"] & { verificationProgram?: string; expectedOutput?: string };
  return {
    id: row.id,
    kind: row.kind as GeneratedContentItem["kind"],
    topic: row.topic,
    difficulty: row.difficulty,
    prompt: row.prompt,
    answer,
    distractors: payload.options.filter((_, index) => index !== payload.answerIndex),
    explanation: row.explanation,
    subgoalLabels: payload.subgoalLabels ?? [],
    bodyL1: payload.bodyL1 ?? row.prompt,
    bodyL2: payload.bodyL2 ?? row.explanation,
    bodyL3: payload.bodyL3 ?? `Verification evidence: ${JSON.stringify(row.verification ?? {})}`,
    verificationProgram: verification.verificationProgram,
    expectedOutput: verification.expectedOutput,
    status: row.status,
    verification,
  };
}

const worker = new Worker(
  "grindstone",
  async (job) => {
    switch (job.name) {
      case "audit-content":
        return summarizeAudit(job.data.questions as AuditableQuestion[]);
      case "nightly-rollup": {
        const db = getDb();
        const [published, liveAttempts, snapshots] = await Promise.all([
          db.select().from(questions).where(eq(questions.status, "published")),
          db.select({ itemId: attempts.itemId, outcome: attempts.outcome, answer: attempts.answer }).from(attempts).where(eq(attempts.itemType, "question")),
          db.select({ userId: learnerSnapshots.userId }).from(learnerSnapshots),
        ]);
        const attemptsByQuestion = new Map<string, typeof liveAttempts>();
        for (const attempt of liveAttempts) attemptsByQuestion.set(attempt.itemId, [...(attemptsByQuestion.get(attempt.itemId) ?? []), attempt]);
        let retired = 0;
        let signaled = 0;
        const replacements = new Map<string, { topic: string; kind: GenerationRequest["kind"]; difficulties: number[] }>();
        for (const question of published) {
          const records = attemptsByQuestion.get(question.id) ?? [];
          const optionCounts = optionDistribution(records.map((record) => record.answer));
          const hasSignal = question.reportCount >= 2
            || (records.length >= 20 && records.filter((record) => record.outcome !== "correct").length / records.length > 0.6)
            || optionCounts.reduce((sum, count) => sum + count, 0) >= 24;
          if (!hasSignal) continue;
          signaled += 1;
          const decision = shouldRetireContent({
            attempts: records.length,
            wrong: records.filter((record) => record.outcome !== "correct").length,
            reports: question.reportCount,
            optionCounts,
            reauditPassed: storedVerificationPasses(question.payload, question.verification),
          });
          if (decision.retire) {
            await db.update(questions).set({ status: "retired", updatedAt: new Date() }).where(eq(questions.id, question.id));
            retired += 1;
            const key = `${question.kind}:${question.topic}`;
            const replacement = replacements.get(key) ?? { topic: question.topic, kind: question.kind as GenerationRequest["kind"], difficulties: [] };
            replacement.difficulties.push(question.difficulty);
            replacements.set(key, replacement);
          }
        }
        let regenerationQueued = 0;
        if (replacements.size && process.env.ANTHROPIC_API_KEY) {
          const monthStart = new Date(); monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
          const [usage] = await db.select({ total: sql<number>`coalesce(sum(${aiUsage.costUsd}), 0)` }).from(aiUsage).where(gte(aiUsage.createdAt, monthStart));
          const monthToDateUsd = Number(usage?.total ?? 0);
          let reservedUsd = 0;
          for (const replacement of replacements.values()) {
            const count = replacement.difficulties.length;
            const estimatedCostUsd = estimateBatchCost(count);
            try { assertWithinAiBudget(monthToDateUsd + reservedUsd, estimatedCostUsd); }
            catch { break; }
            const request: GenerationRequest = {
              topic: replacement.topic,
              kind: replacement.kind,
              difficulty: replacement.difficulties.reduce((sum, value) => sum + value, 0) / count,
              count,
            };
            const [batch] = await db.insert(contentBatches).values({ purpose: `regenerate:${replacement.kind}:${replacement.topic}`, requested: count, estimatedCostUsd }).returning({ id: contentBatches.id });
            await maintenanceQueue.add("generate-content", { request, monthToDateUsd: monthToDateUsd + reservedUsd, batchId: batch.id }, { attempts: 2, backoff: { type: "exponential", delay: 5000 }, removeOnComplete: 50, removeOnFail: 100 });
            reservedUsd += estimatedCostUsd;
            regenerationQueued += count;
          }
        }
        return { completedAt: new Date().toISOString(), usersProcessed: snapshots.length, questionsScanned: published.length, signaled, retired, regenerationQueued };
      }
      case "generate-content": {
        const db = getDb();
        const batchId = job.data.batchId as string;
        await db.update(contentBatches).set({ status: "running", updatedAt: new Date() }).where(eq(contentBatches.id, batchId));
        try {
          const monthStart = new Date(); monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
          const [usage] = await db.select({ total: sql<number>`coalesce(sum(${aiUsage.costUsd}), 0)` }).from(aiUsage).where(gte(aiUsage.createdAt, monthStart));
          const monthToDateUsd = Number(usage?.total ?? 0);
          const storedCorpus = await db.select().from(questions).where(inArray(questions.status, ["published", "retired"]));
          const corpus = storedCorpus.map(fromStoredQuestion).filter((item): item is GeneratedContentItem => item !== null);
          const result = await runContentBatch(job.data.request as GenerationRequest, {
          generate: generateContentItem,
          execute: async (code) => {
            const result = await getJudge().run({ language: "python", code, timeoutMs: 5000, memoryMb: 128 });
            return { outcome: result.outcome, stdout: result.stdout, stderr: result.stderr };
          },
          independentSolve: independentlySolve,
          ambiguityCritic: critiqueAmbiguity,
          }, {
            monthToDateUsd,
            estimatedCostUsd: estimateBatchCost((job.data.request as GenerationRequest).count),
            corpus,
          });
          if (result.items.length) await db.insert(questions).values(result.items.map((item) => ({
            id: item.id,
            sourceKey: `ai:${item.id}`,
            kind: item.kind,
            topic: item.topic,
            difficulty: item.difficulty,
            prompt: item.prompt,
            payload: questionPayload(item),
            explanation: item.explanation,
            status: item.status,
            verification: { ...item.verification, verificationProgram: item.verificationProgram, expectedOutput: item.expectedOutput },
          }))).onConflictDoNothing();
          await db.insert(aiUsage).values({ purpose: `content-batch:${batchId}`, model: "generation+critic", inputTokens: result.inputTokens, outputTokens: result.outputTokens, costUsd: result.costUsd });
          await db.update(contentBatches).set({ generated: result.items.length, published: result.published, quarantined: result.quarantined, actualCostUsd: result.costUsd, status: "completed", updatedAt: new Date() }).where(eq(contentBatches.id, batchId));
          return result;
        } catch (error) {
          await db.update(contentBatches).set({ status: "failed", error: error instanceof Error ? error.message : "Unknown generation error", updatedAt: new Date() }).where(eq(contentBatches.id, batchId));
          throw error;
        }
      }
      default:
        throw new Error(`Unknown worker job: ${job.name}`);
    }
  },
  { connection, concurrency: 1 },
);

worker.on("completed", (job) => console.info(`[worker] completed ${job.name} (${job.id})`));
worker.on("failed", (job, error) => console.error(`[worker] failed ${job?.name}: ${error.message}`));

async function shutdown() {
  await Promise.all([worker.close(), maintenanceQueue.close()]);
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
