import { and, eq } from "drizzle-orm";
import { getDb, type Database } from "@/db";
import { attempts, checkins, commitments, diagnosticSessions, driveSessions, learnerSnapshots, mastery, predictions, profiles, reviews, sprints, sprintWeeks, starStories, users, xpEvents } from "@/db/schema";
import { createDefaultLearnerState } from "@/lib/product/default-state";
import { reduceLearnerState } from "@/lib/product/reducer";
import type { LearnerAction, LearnerState } from "@/lib/product/types";
import { synchronizeTemporalState } from "@/lib/product/sprint-clock";

declare global {
  var __grindstoneState: Map<string, LearnerState> | undefined;
  var __grindstoneDbRetryAt: number | undefined;
}

const memory = globalThis.__grindstoneState ??= new Map<string, LearnerState>();

function canTryDatabase() {
  return Boolean(process.env.DATABASE_URL) && Date.now() >= (globalThis.__grindstoneDbRetryAt ?? 0);
}

function markDatabaseUnavailable() {
  globalThis.__grindstoneDbRetryAt = Date.now() + 30_000;
}

async function ensureUser(userId: string, email: string, name: string) {
  const db = getDb();
  await db.insert(users).values({ id: userId, email, name }).onConflictDoNothing();
}

async function ensureSprint(db: Database, actorId: string, state: LearnerState) {
  const [existing] = await db.select({ id: sprints.id }).from(sprints).where(and(eq(sprints.userId, actorId), eq(sprints.number, state.sprint.number))).limit(1);
  if (existing) return existing.id;
  const startAt = state.sprint.startedAt ? new Date(state.sprint.startedAt) : new Date();
  const endAt = new Date(startAt.getTime() + 28 * 24 * 60 * 60 * 1000);
  const [created] = await db.insert(sprints).values({ userId: actorId, number: state.sprint.number, goal: state.sprint.goal, route: state.profile.route, startAt, endAt, status: state.sprint.status }).returning({ id: sprints.id });
  for (const [index, [focus, loadFactor]] of [["Diagnose & Found", 0.6], ["Acquisition", 1.1], ["Application & Speed", 1.2], ["Simulation & Taper", 0.9]].entries()) {
    await db.insert(sprintWeeks).values({ sprintId: created.id, week: index + 1, focus: focus as string, loadFactor: loadFactor as number }).onConflictDoNothing();
  }
  return created.id;
}

async function persistDomainAction(db: Database, actor: { id: string }, before: LearnerState, state: LearnerState, action: LearnerAction) {
  if (action.type === "onboarding.complete") {
    await db.insert(profiles).values({ userId: actor.id, route: state.profile.route, preferredLanguage: state.profile.preferredLanguage, dailyMinutes: state.profile.dailyMinutes, diagnosticComplete: state.profile.diagnosticComplete }).onConflictDoUpdate({
      target: profiles.userId,
      set: { route: state.profile.route, preferredLanguage: state.profile.preferredLanguage, dailyMinutes: state.profile.dailyMinutes, diagnosticComplete: state.profile.diagnosticComplete, updatedAt: new Date() },
    });
    const sprintId = await ensureSprint(db, actor.id, state);
    const [existing] = await db.select({ id: commitments.id }).from(commitments).where(and(eq(commitments.sprintId, sprintId), eq(commitments.userId, actor.id))).limit(1);
    const values = { implementationIntention: state.commitment.implementationIntention, dailyFloorMinutes: state.commitment.dailyFloorMinutes, daysPerWeek: state.profile.daysPerWeek, stakeCents: state.commitment.stakeCents, updatedAt: new Date() };
    if (existing) await db.update(commitments).set(values).where(eq(commitments.id, existing.id));
    else await db.insert(commitments).values({ sprintId, userId: actor.id, ...values });
    return;
  }

  if (state.sprint.status === "draft") return;

  const sprintId = await ensureSprint(db, actor.id, state);
  if (action.type === "checkin.standup" || action.type === "checkin.evening" || action.type === "retro.save") {
    await db.insert(checkins).values({ sprintId, userId: actor.id, kind: action.type, body: action.payload.body, completedMinutes: action.type === "checkin.evening" ? action.payload.completedMinutes : undefined, createdAt: action.type === "retro.save" ? undefined : new Date(action.payload.completedAt) });
  } else if (action.type === "diagnostic.complete") {
    await db.insert(diagnosticSessions).values({ userId: actor.id, route: action.payload.route, answers: state.diagnostic.answers, topicPriors: action.payload.topicPriors, finishedAt: new Date() });
    await db.update(profiles).set({ route: action.payload.route, diagnosticComplete: true, updatedAt: new Date() }).where(eq(profiles.userId, actor.id));
    const startedAt = new Date(action.payload.completedAt); const endAt = new Date(startedAt.getTime() + 28 * 24 * 60 * 60 * 1000);
    await db.update(sprints).set({ goal: action.payload.goal, route: action.payload.route, startAt: startedAt, endAt, status: "active", updatedAt: new Date() }).where(eq(sprints.id, sprintId));
  } else if (action.type === "gate.complete") {
    await db.update(sprintWeeks).set({ gateScore: action.payload.score, gatePassed: state.sprint.gate?.passed, recalibration: state.sprint.gate?.recalibration, updatedAt: new Date() }).where(and(eq(sprintWeeks.sprintId, sprintId), eq(sprintWeeks.week, state.sprint.week)));
    const earnedXp = Math.max(0, state.xp - before.xp);
    if (earnedXp) await db.insert(xpEvents).values({ userId: actor.id, amount: earnedXp, reason: state.sprint.gate?.passed ? "gate-pass" : "gate-attempt", metadata: { week: state.sprint.week, score: action.payload.score } });
  } else if (action.type === "drive.complete") {
    await db.insert(driveSessions).values({ userId: actor.id, packSlug: action.payload.pack, answers: {}, sectionScores: action.payload.sections, finishedAt: new Date(action.payload.completedAt), score: action.payload.score });
  } else if (action.type === "star.save") {
    await db.insert(starStories).values({ id: action.payload.id, userId: actor.id, title: action.payload.title, situation: action.payload.situation, task: action.payload.task, action: action.payload.action, result: action.payload.result, metrics: action.payload.metrics, principles: action.payload.principles }).onConflictDoUpdate({
      target: starStories.id,
      set: { title: action.payload.title, situation: action.payload.situation, task: action.payload.task, action: action.payload.action, result: action.payload.result, metrics: action.payload.metrics, principles: action.payload.principles, updatedAt: new Date() },
    });
  } else if (action.type === "sprint.next") {
    await ensureSprint(db, actor.id, state);
  }
}

export async function loadLearnerState(actor: { id: string; email: string; name: string }): Promise<{ state: LearnerState; persistence: "postgres" | "memory" }> {
  if (canTryDatabase()) {
    try {
      await ensureUser(actor.id, actor.email, actor.name);
      const db = getDb();
      const [row] = await db.select().from(learnerSnapshots).where(eq(learnerSnapshots.userId, actor.id)).limit(1);
      if (row) {
        const stored = row.state as LearnerState;
        const state = synchronizeTemporalState(stored);
        memory.set(actor.id, state);
        return { state, persistence: "postgres" };
      }
      const state = createDefaultLearnerState(actor.name);
      await db.insert(learnerSnapshots).values({ userId: actor.id, revision: state.revision, state });
      memory.set(actor.id, state);
      return { state, persistence: "postgres" };
    } catch {
      markDatabaseUnavailable();
    }
  }
  const state = synchronizeTemporalState(memory.get(actor.id) ?? createDefaultLearnerState(actor.name));
  memory.set(actor.id, state);
  return { state, persistence: "memory" };
}

export async function applyLearnerAction(actor: { id: string; email: string; name: string }, action: LearnerAction) {
  const loaded = await loadLearnerState(actor);
  const state = reduceLearnerState(loaded.state, action);
  memory.set(actor.id, state);

  if (loaded.persistence === "postgres" && canTryDatabase()) {
    try {
      const db = getDb();
      await db.insert(learnerSnapshots).values({ userId: actor.id, revision: state.revision, state }).onConflictDoUpdate({
        target: learnerSnapshots.userId,
        set: { revision: state.revision, state, updatedAt: new Date() },
      });
      await persistDomainAction(db, actor, loaded.state, state, action);
      if (action.type === "attempt.record") {
        const evidence = action.payload;
        const [inserted] = await db.insert(attempts).values({
          id: evidence.id,
          userId: actor.id,
          itemType: evidence.itemType,
          itemId: evidence.itemId,
          outcome: evidence.correct ? "correct" : "incorrect",
          answer: evidence.answer,
          durationMs: evidence.durationMs,
          timed: evidence.timed,
          scaffoldLevel: evidence.scaffoldLevel,
          measuredComplexity: evidence.measuredComplexity,
          communicationScore: evidence.communicationScore,
        }).onConflictDoNothing().returning({ id: attempts.id });
        if (inserted) {
          if (evidence.predictedSuccess !== undefined) await db.insert(predictions).values({ attemptId: inserted.id, userId: actor.id, predictedSuccess: evidence.predictedSuccess });
          const topicMastery = state.mastery[evidence.topic];
          if (topicMastery) await db.insert(mastery).values({ userId: actor.id, topic: evidence.topic, ...topicMastery }).onConflictDoUpdate({
            target: [mastery.userId, mastery.topic],
            set: { ...topicMastery, updatedAt: new Date() },
          });
          const scheduledReview = state.reviews.find((review) => review.itemType === evidence.itemType && review.itemId === evidence.itemId);
          if (scheduledReview) await db.insert(reviews).values({
            userId: actor.id,
            itemType: scheduledReview.itemType,
            itemId: scheduledReview.itemId,
            dueAt: new Date(scheduledReview.dueAt),
            stability: scheduledReview.fsrs.stability,
            difficulty: scheduledReview.fsrs.difficulty,
            fsrsState: scheduledReview.fsrs,
          }).onConflictDoUpdate({
            target: [reviews.userId, reviews.itemType, reviews.itemId],
            set: { dueAt: new Date(scheduledReview.dueAt), stability: scheduledReview.fsrs.stability, difficulty: scheduledReview.fsrs.difficulty, fsrsState: scheduledReview.fsrs, updatedAt: new Date() },
          });
          const earnedXp = Math.max(0, state.xp - loaded.state.xp);
          if (earnedXp) await db.insert(xpEvents).values({ userId: actor.id, attemptId: inserted.id, amount: earnedXp, reason: evidence.timed ? "timed-attempt" : "practice-attempt", metadata: { topic: evidence.topic, correct: evidence.correct } });
        }
      }
    } catch {
      markDatabaseUnavailable();
      return { state, persistence: "memory" as const };
    }
  }
  return { state, persistence: loaded.persistence };
}
