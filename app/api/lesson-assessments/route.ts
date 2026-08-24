import { NextResponse } from "next/server";
import { z } from "zod";
import { getJudge } from "@/lib/judge";
import { buildAssessmentHarness, createAssessmentResult } from "@/lib/judge/assessment-harness";
import { guidedLessonCases, selectIndependentCases } from "@/lib/judge/lesson-cases";
import { isLessonSlug } from "@/lib/learning/catalog";
import { getActor } from "@/lib/server/actor";
import { completeAssessmentSession, loadAssessmentSession, startAssessmentSession } from "@/lib/server/assessment-store";
import { loadLearnerState, recordLessonAssessment } from "@/lib/server/state-store";

export const runtime = "nodejs";

const lessonId = z.string().refine(isLessonSlug, "Unknown lesson");
const language = z.enum(["python", "java"]);
const code = z.string().min(1).max(100_000);
const requestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("guided"), lessonId, language, code }),
  z.object({ action: z.literal("start"), lessonId, language, forceNew: z.boolean().optional() }),
  z.object({ action: z.literal("submit"), attemptId: z.uuid(), code }),
]);

const buckets = new Map<string, { minute: number; count: number }>();

function withinLimit(key: string) {
  const minute = Math.floor(Date.now() / 60_000);
  const bucket = buckets.get(key);
  if (!bucket || bucket.minute !== minute) {
    buckets.set(key, { minute, count: 1 });
    return true;
  }
  const limit = Number(process.env.LESSON_ASSESSMENTS_PER_MINUTE ?? 20);
  if (bucket.count >= limit) return false;
  bucket.count++;
  return true;
}

async function runAssessment(languageValue: "python" | "java", source: string, cases: ReturnType<typeof guidedLessonCases>) {
  const judge = getJudge();
  const health = await judge.health();
  if (!health.ok) throw new Error(health.detail);
  return judge.run({ language: languageValue, code: buildAssessmentHarness(languageValue, source, cases), timeoutMs: 8_000 });
}

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const key = `${actor.id}:${request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local"}`;
  if (!withinLimit(key)) return NextResponse.json({ error: "Too many assessment runs. Try again in a minute." }, { status: 429 });

  const parsed = requestSchema.safeParse(await request.json().catch(() => undefined));
  if (!parsed.success) return NextResponse.json({ error: "Invalid assessment request", issues: parsed.error.issues }, { status: 400 });

  try {
    if (parsed.data.action === "guided") {
      const cases = guidedLessonCases(parsed.data.lessonId);
      const run = await runAssessment(parsed.data.language, parsed.data.code, cases);
      return NextResponse.json({
        result: createAssessmentResult({
          run,
          cases,
          mode: "guided",
          lessonId: parsed.data.lessonId,
          language: parsed.data.language,
        }),
      });
    }

    if (parsed.data.action === "start") {
      await loadLearnerState(actor);
      const started = await startAssessmentSession(actor.id, parsed.data.lessonId, parsed.data.language, parsed.data.forceNew);
      if ("result" in started) return NextResponse.json({ result: started.result });
      return NextResponse.json({
        attempt: {
          id: started.session.id,
          lessonId: started.session.lessonId,
          language: started.session.language,
          attemptNumber: started.session.attemptNumber,
          startedAt: started.session.startedAt.toISOString(),
          expiresAt: started.session.expiresAt.toISOString(),
          testCount: 8,
        },
      });
    }

    const session = await loadAssessmentSession(actor.id, parsed.data.attemptId);
    if (!session) return NextResponse.json({ error: "Assessment attempt not found." }, { status: 404 });
    if (session.result && session.submittedAt) {
      await recordLessonAssessment(actor, session.result, session.code ?? parsed.data.code);
      return NextResponse.json({ result: session.result });
    }
    if (session.expiresAt.getTime() <= Date.now()) {
      return NextResponse.json({ error: "This attempt expired. Start a new test set to try again." }, { status: 410 });
    }
    const cases = selectIndependentCases(session.lessonId, session.seed);
    const run = await runAssessment(session.language, parsed.data.code, cases);
    const result = createAssessmentResult({
      run,
      cases,
      mode: "independent",
      lessonId: session.lessonId,
      language: session.language,
      attemptId: session.id,
      attemptNumber: session.attemptNumber,
      firstSubmission: session.attemptNumber === 1,
      solveDurationMs: Date.now() - session.startedAt.getTime(),
    });
    const completed = await completeAssessmentSession(actor.id, session.id, parsed.data.code, result);
    if (!completed) return NextResponse.json({ error: "Assessment attempt not found." }, { status: 404 });
    if (!completed.created && completed.session.result) {
      await recordLessonAssessment(actor, completed.session.result, completed.session.code ?? parsed.data.code);
      return NextResponse.json({ result: completed.session.result });
    }
    await recordLessonAssessment(actor, result, parsed.data.code);
    return NextResponse.json({ result });
  } catch (error) {
    console.error("Lesson assessment failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Assessment service unavailable" }, { status: 503 });
  }
}
