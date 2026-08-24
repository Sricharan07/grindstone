import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { questions } from "@/db/schema";
import { getActor } from "@/lib/server/actor";

const gradeSchema = z.object({ questionId: z.string().uuid(), selectedIndex: z.number().int().min(0).max(20) });

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const parsed = gradeSchema.safeParse(await request.json().catch(() => undefined));
  if (!parsed.success) return NextResponse.json({ error: "Invalid answer" }, { status: 400 });
  try {
    const [row] = await getDb().select({ payload: questions.payload, explanation: questions.explanation })
      .from(questions)
      .where(and(eq(questions.id, parsed.data.questionId), eq(questions.status, "published")))
      .limit(1);
    if (!row) return NextResponse.json({ error: "Question not found" }, { status: 404 });
    const payload = row.payload as { options?: string[]; answerIndex?: number };
    if (!payload.options || payload.answerIndex === undefined) return NextResponse.json({ error: "Question is not gradeable" }, { status: 422 });
    return NextResponse.json({ correct: parsed.data.selectedIndex === payload.answerIndex, answerIndex: payload.answerIndex, explanation: row.explanation });
  } catch {
    return NextResponse.json({ error: "Question bank unavailable" }, { status: 503 });
  }
}
