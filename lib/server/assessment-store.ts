import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { assessmentSessions } from "@/db/schema";
import type { LessonAssessmentResult } from "@/lib/assessment/types";
import type { LearningLanguage, LessonSlug } from "@/lib/learning/catalog";

const SESSION_MINUTES = 45;

export interface AssessmentSessionRecord {
  id: string;
  userId: string;
  lessonId: LessonSlug;
  language: LearningLanguage;
  attemptNumber: number;
  seed: string;
  startedAt: Date;
  expiresAt: Date;
  submittedAt: Date | null;
  code: string | null;
  result: LessonAssessmentResult | null;
}

declare global {
  var __grindstoneAssessments: Map<string, AssessmentSessionRecord> | undefined;
}

const memory = globalThis.__grindstoneAssessments ??= new Map<string, AssessmentSessionRecord>();

function fromRow(row: typeof assessmentSessions.$inferSelect): AssessmentSessionRecord {
  return {
    ...row,
    lessonId: row.lessonId as LessonSlug,
    language: row.language as LearningLanguage,
    result: row.result ?? null,
  };
}

function createRecord(userId: string, lessonId: LessonSlug, language: LearningLanguage, attemptNumber: number) {
  const startedAt = new Date();
  return {
    id: crypto.randomUUID(),
    userId,
    lessonId,
    language,
    attemptNumber,
    seed: crypto.randomUUID(),
    startedAt,
    expiresAt: new Date(startedAt.getTime() + SESSION_MINUTES * 60_000),
    submittedAt: null,
    code: null,
    result: null,
  } satisfies AssessmentSessionRecord;
}

function memoryStart(userId: string, lessonId: LessonSlug, language: LearningLanguage, forceNew: boolean) {
  const records = [...memory.values()]
    .filter((item) => item.userId === userId && item.lessonId === lessonId && item.language === language)
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  const latest = records[0];
  if (!forceNew && latest?.submittedAt && latest.result) return { result: latest.result } as const;
  if (!forceNew && latest && !latest.submittedAt && latest.expiresAt.getTime() > Date.now()) return { session: latest } as const;
  const attemptNumber = records.filter((item) => item.submittedAt).length + 1;
  const session = createRecord(userId, lessonId, language, attemptNumber);
  memory.set(session.id, session);
  return { session } as const;
}

export async function startAssessmentSession(userId: string, lessonId: LessonSlug, language: LearningLanguage, forceNew = false) {
  if (process.env.DATABASE_URL) {
    try {
      const db = getDb();
      const recent = await db.select().from(assessmentSessions)
        .where(and(eq(assessmentSessions.userId, userId), eq(assessmentSessions.lessonId, lessonId), eq(assessmentSessions.language, language)))
        .orderBy(desc(assessmentSessions.startedAt))
        .limit(100);
      const latest = recent[0] ? fromRow(recent[0]) : undefined;
      if (!forceNew && latest?.submittedAt && latest.result) return { result: latest.result } as const;
      if (!forceNew && latest && !latest.submittedAt && latest.expiresAt.getTime() > Date.now()) return { session: latest } as const;
      const session = createRecord(userId, lessonId, language, recent.filter((item) => item.submittedAt).length + 1);
      const [created] = await db.insert(assessmentSessions).values(session).returning();
      return { session: fromRow(created) } as const;
    } catch (error) {
      console.error("Assessment storage fell back to memory", error);
    }
  }
  return memoryStart(userId, lessonId, language, forceNew);
}

export async function loadAssessmentSession(userId: string, id: string) {
  if (process.env.DATABASE_URL) {
    try {
      const db = getDb();
      const [row] = await db.select().from(assessmentSessions)
        .where(and(eq(assessmentSessions.id, id), eq(assessmentSessions.userId, userId)))
        .limit(1);
      return row ? fromRow(row) : undefined;
    } catch (error) {
      console.error("Assessment lookup fell back to memory", error);
    }
  }
  const record = memory.get(id);
  return record?.userId === userId ? record : undefined;
}

export async function completeAssessmentSession(userId: string, id: string, code: string, result: LessonAssessmentResult) {
  const submittedAt = new Date();
  if (process.env.DATABASE_URL) {
    try {
      const db = getDb();
      const [updated] = await db.update(assessmentSessions).set({
        submittedAt,
        code,
        result,
        updatedAt: submittedAt,
      }).where(and(
        eq(assessmentSessions.id, id),
        eq(assessmentSessions.userId, userId),
        isNull(assessmentSessions.submittedAt),
      )).returning();
      if (updated) return { session: fromRow(updated), created: true } as const;
      const existing = await loadAssessmentSession(userId, id);
      return existing ? { session: existing, created: false } as const : undefined;
    } catch (error) {
      console.error("Assessment completion fell back to memory", error);
    }
  }
  const existing = memory.get(id);
  if (!existing || existing.userId !== userId) return undefined;
  if (existing.submittedAt) return { session: existing, created: false } as const;
  const session = { ...existing, submittedAt, code, result };
  memory.set(id, session);
  return { session, created: true } as const;
}
