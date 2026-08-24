import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { contentReports, questions, users } from "@/db/schema";
import { getActor } from "@/lib/server/actor";

const reportSchema = z.object({
  itemId: z.string().min(1).max(200),
  reason: z.string().min(2).max(100),
  details: z.string().max(1000).optional(),
});

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const parsed = reportSchema.safeParse(await request.json().catch(() => undefined));
  if (!parsed.success) return NextResponse.json({ error: "Invalid content report" }, { status: 400 });

  try {
    const db = getDb();
    await db.insert(users).values({ id: actor.id, email: actor.email, name: actor.name }).onConflictDoNothing();
    const questionId = uuidPattern.test(parsed.data.itemId) ? parsed.data.itemId : null;
    if (questionId) {
      const [question] = await db.select({ id: questions.id }).from(questions).where(eq(questions.id, questionId)).limit(1);
      if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }
    await db.transaction(async (transaction) => {
      await transaction.insert(contentReports).values({
        questionId,
        userId: actor.id,
        reason: parsed.data.reason,
        details: parsed.data.details ?? (questionId ? undefined : `Local item: ${parsed.data.itemId}`),
      });
      if (questionId) await transaction.update(questions).set({ reportCount: sql`${questions.reportCount} + 1`, updatedAt: new Date() }).where(eq(questions.id, questionId));
    });
    return NextResponse.json({ accepted: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Content reporting requires Postgres" }, { status: 503 });
  }
}
