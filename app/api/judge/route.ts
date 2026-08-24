import { z } from "zod";
import { getJudge } from "@/lib/judge";
import { buildProblemHarness, buildScalingHarness, parseScalingOutput } from "@/lib/judge/harness";
import { inferComplexity } from "@/lib/judge/complexity";
import { publicJudgeError } from "@/lib/judge/errors";

export const runtime = "nodejs";

const requestSchema = z.object({
  language: z.enum(["python", "java", "cpp"]),
  code: z.string().min(1).max(100_000),
  stdin: z.string().max(64_000).optional(),
  timeoutMs: z.number().int().min(250).max(15_000).optional(),
  problem: z.enum(["two-sum", "two-sum-stream", "longest-consecutive", "first-unique", "balanced-brackets", "eligible-orders", "pagination-cursor", "retry-budget", "daily-report", "membership-cache", "min-window"]).optional(),
  measureComplexity: z.boolean().optional(),
});

const buckets = new Map<string, { minute: number; count: number }>();

function withinLimit(key: string) {
  const minute = Math.floor(Date.now() / 60_000);
  const existing = buckets.get(key);
  if (!existing || existing.minute !== minute) {
    buckets.set(key, { minute, count: 1 });
    return true;
  }
  const limit = Number(process.env.JUDGE_RUNS_PER_MINUTE ?? 30);
  if (existing.count >= limit) return false;
  existing.count += 1;
  return true;
}

export async function GET() {
  return Response.json(await getJudge().health());
}

export async function POST(request: Request) {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  if (!withinLimit(key)) {
    return Response.json({ error: "Judge rate limit reached. Try again in a minute." }, { status: 429 });
  }

  const body = await request.json().catch(() => undefined);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid run request", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const health = await getJudge().health();
    if (!health.ok) throw new Error(health.detail);
    const { problem, measureComplexity, ...runRequest } = parsed.data;
    const result = await getJudge().run({ ...runRequest, code: problem ? buildProblemHarness(runRequest.language, runRequest.code, problem) : runRequest.code });
    let complexity;
    if (result.outcome === "ok" && problem && measureComplexity) {
      const scaling = await getJudge().run({ ...runRequest, timeoutMs: 12_000, code: buildScalingHarness(runRequest.language, runRequest.code, problem) });
      if (scaling.outcome === "ok") complexity = { ...inferComplexity(parseScalingOutput(scaling.stdout)), samples: parseScalingOutput(scaling.stdout) };
    }
    return Response.json({ result, complexity });
  } catch (error) {
    console.error("Judge execution failed", error);
    return Response.json(
      { error: publicJudgeError(error, "Judge execution failed") },
      { status: 503 },
    );
  }
}
