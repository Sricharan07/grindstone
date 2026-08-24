import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { questions } from "@/db/schema";
import { getActor } from "@/lib/server/actor";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(12),
  topic: z.string().trim().min(1).max(100).optional(),
  targetDifficulty: z.coerce.number().min(0).max(1).optional(),
});

export async function GET(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid question request" }, { status: 400 });
  try {
    const conditions = [eq(questions.status, "published")];
    if (parsed.data.topic) conditions.push(eq(questions.topic, parsed.data.topic));
    const order = parsed.data.targetDifficulty === undefined
      ? [sql`random()`]
      : [sql`abs(${questions.difficulty} - ${parsed.data.targetDifficulty})`, sql`random()`];
    const rows = await getDb().select({ id: questions.id, topic: questions.topic, prompt: questions.prompt, difficulty: questions.difficulty, payload: questions.payload })
      .from(questions)
      .where(and(...conditions))
      .orderBy(...order)
      .limit(parsed.data.limit);
    return NextResponse.json({ questions: rows.flatMap((row) => {
      const payload = row.payload as { options?: string[] };
      if (!payload.options?.length) return [];
      return [{ id: row.id, topic: row.topic, prompt: row.prompt, difficulty: row.difficulty, options: payload.options, targetSeconds: Math.round(35 + row.difficulty * 70) }];
    }) });
  } catch {
    return NextResponse.json({ error: "Question bank unavailable. Run database migrations and seed content." }, { status: 503 });
  }
}
