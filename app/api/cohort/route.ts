import { desc, eq, gte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { learnerSnapshots, users, xpEvents } from "@/db/schema";
import type { LearnerState } from "@/lib/product/types";
import { getActor } from "@/lib/server/actor";

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "GS";
}

function mondayUtc() {
  const now = new Date();
  const day = now.getUTCDay() || 7;
  now.setUTCDate(now.getUTCDate() - day + 1);
  now.setUTCHours(0, 0, 0, 0);
  return now;
}

export async function GET() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const db = getDb();
    const [rows, weeklyRows, recent] = await Promise.all([
      db.select({ id: users.id, name: users.name, state: learnerSnapshots.state })
        .from(users)
        .leftJoin(learnerSnapshots, eq(learnerSnapshots.userId, users.id)),
      db.select({ userId: xpEvents.userId, xp: sql<number>`coalesce(sum(${xpEvents.amount}), 0)` })
        .from(xpEvents)
        .where(gte(xpEvents.createdAt, mondayUtc()))
        .groupBy(xpEvents.userId),
      db.select({ userId: xpEvents.userId, name: users.name, amount: xpEvents.amount, reason: xpEvents.reason, metadata: xpEvents.metadata, createdAt: xpEvents.createdAt })
        .from(xpEvents)
        .innerJoin(users, eq(users.id, xpEvents.userId))
        .orderBy(desc(xpEvents.createdAt))
        .limit(8),
    ]);
    const weeklyXp = new Map(weeklyRows.map((row) => [row.userId, Number(row.xp)]));
    const members = rows.flatMap((row) => {
      if (!row.state) return [];
      const state = row.state as LearnerState;
      const name = row.name?.trim() || state.profile.name || "Member";
      return [{
        id: row.id,
        name,
        initials: initials(name),
        xp: weeklyXp.get(row.id) ?? 0,
        totalXp: state.xp,
        streak: state.streak.days,
        gate: state.sprint.gate?.score ?? null,
        self: row.id === actor.id,
      }];
    }).sort((left, right) => right.xp - left.xp || right.totalXp - left.totalXp);
    const activity = recent.map((event) => {
      const metadata = event.metadata as { topic?: string; correct?: boolean } | null;
      const name = event.name?.trim() || "Member";
      return {
        id: `${event.userId}:${event.createdAt.toISOString()}`,
        name,
        initials: initials(name),
        action: event.reason === "gate-pass" ? "cleared a Friday gate" : "completed a timed attempt",
        detail: metadata?.topic ?? `${event.amount} XP`,
        createdAt: event.createdAt.toISOString(),
      };
    });
    return NextResponse.json({ members, activity });
  } catch {
    return NextResponse.json({ error: "Cohort data requires Postgres" }, { status: 503 });
  }
}
