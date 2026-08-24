import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { problems } from "@/db/schema";
import { getActor } from "@/lib/server/actor";

export async function GET() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const rows = await getDb().select({ id: problems.id, number: problems.leetcodeId, slug: problems.slug, title: problems.title, difficulty: problems.difficulty, tags: problems.tags, optimalTime: problems.optimalTime, optimalSpace: problems.optimalSpace, statement: problems.statement, followups: problems.followups })
      .from(problems)
      .where(eq(problems.status, "published"))
      .orderBy(asc(problems.leetcodeId));
    return NextResponse.json({ problems: rows });
  } catch {
    return NextResponse.json({ error: "Coding corpus unavailable. Import the problem bank after migrating Postgres." }, { status: 503 });
  }
}
