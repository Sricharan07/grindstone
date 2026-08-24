import { createDefaultLearnerState, initialsFor } from "./default-state";
import type { AptitudeProgress, AssistanceLevel, LearnerState, LessonProgress, LessonStage } from "./types";
import type { LearningLanguage } from "@/lib/learning/catalog";

type LegacyState = Record<string, unknown> & {
  revision?: number;
  profile?: Record<string, unknown>;
  sprint?: Record<string, unknown>;
  onboarding?: Record<string, unknown>;
  streak?: Record<string, unknown>;
  lessons?: Record<string, Record<string, unknown>>;
  labs?: Record<string, Record<string, unknown>>;
  aptitude?: Record<string, Record<string, unknown>>;
  mastery?: LearnerState["mastery"];
  attempts?: LearnerState["attempts"];
  reviews?: LearnerState["reviews"];
  readiness?: Partial<LearnerState["readiness"]>;
  xp?: number;
  contentReports?: LearnerState["contentReports"];
};

const validStages = new Set<LessonStage>(["understand", "predict", "code", "explain", "transfer", "complete"]);

function migratedStage(value: unknown): LessonStage {
  if (typeof value === "string" && validStages.has(value as LessonStage)) return value as LessonStage;
  if (value === "concept" || value === "example") return "understand";
  if (value === "practice") return "code";
  return value === "complete" ? "complete" : "understand";
}

export function hydrateLearnerState(input: Partial<LearnerState> | LegacyState | null | undefined): LearnerState {
  const value = (input ?? {}) as LegacyState;
  const profile = value.profile ?? {};
  const onboarding = value.onboarding ?? {};
  const name = typeof profile.name === "string" ? profile.name : "Member";
  const defaults = createDefaultLearnerState(name);
  const oldLanguage = profile.language ?? profile.preferredLanguage ?? onboarding.language;
  const language = oldLanguage === "java" ? "java" : "python";
  const requiresLanguageChoice = oldLanguage === "cpp";
  const oldOnboardingComplete = Boolean(profile.onboardingComplete ?? onboarding.completed ?? profile.diagnosticComplete);
  const onboardingComplete = oldOnboardingComplete && !requiresLanguageChoice;
  const sprint = value.sprint ?? {};
  const startedAt = typeof sprint.startedAt === "string" ? sprint.startedAt : onboardingComplete ? new Date().toISOString() : undefined;
  const oldStatus = sprint.status;
  const status = onboardingComplete ? (oldStatus === "complete" ? "complete" : "active") : "draft";
  const oldStreak = value.streak ?? {};

  const lessons: Record<string, LessonProgress> = Object.fromEntries(Object.entries(value.lessons ?? {}).map(([id, progress]) => [id, {
    stage: migratedStage(progress.stage ?? progress.phase),
    language: (progress.language === "java" ? "java" : language) as LearningLanguage,
    code: typeof progress.code === "string" ? progress.code : "",
    transferCode: typeof progress.transferCode === "string" ? progress.transferCode : "",
    prediction: typeof progress.prediction === "string" ? progress.prediction : "",
    explanation: typeof progress.explanation === "string" ? progress.explanation : "",
    hintsUsed: Array.isArray(progress.hintsUsed) ? progress.hintsUsed as AssistanceLevel[] : [],
    testsPassed: Boolean(progress.testsPassed),
    transferPassed: Boolean(progress.transferPassed),
    updatedAt: typeof progress.updatedAt === "string" ? progress.updatedAt : new Date().toISOString(),
  }]));
  const labs = Object.fromEntries(Object.entries(value.labs ?? {}).map(([id, progress]) => [id, {
    notes: typeof progress.notes === "string" ? progress.notes : "",
    evidence: typeof progress.evidence === "string" ? progress.evidence : "",
    checks: Array.isArray(progress.checks) ? progress.checks.map(Boolean) : [],
    completed: Boolean(progress.completed),
    updatedAt: typeof progress.updatedAt === "string" ? progress.updatedAt : new Date().toISOString(),
  }]));
  const aptitude = Object.fromEntries(Object.entries(value.aptitude ?? {}).map(([id, progress]) => [id, {
    currentIndex: typeof progress.currentIndex === "number" ? Math.max(0, progress.currentIndex) : 0,
    answers: progress.answers && typeof progress.answers === "object" ? progress.answers as AptitudeProgress["answers"] : {},
    completed: Boolean(progress.completed),
    updatedAt: typeof progress.updatedAt === "string" ? progress.updatedAt : new Date().toISOString(),
  }]));

  return {
    ...defaults,
    revision: typeof value.revision === "number" ? value.revision : defaults.revision,
    profile: {
      name,
      initials: initialsFor(name),
      language,
      timezone: typeof profile.timezone === "string" ? profile.timezone : defaults.profile.timezone,
      sessionTime: typeof profile.sessionTime === "string" ? profile.sessionTime : defaults.profile.sessionTime,
      onboardingComplete,
    },
    sprint: {
      ...defaults.sprint,
      number: typeof sprint.number === "number" ? sprint.number : 1,
      week: typeof sprint.week === "number" && sprint.week >= 1 && sprint.week <= 4 ? sprint.week as 1 | 2 | 3 | 4 : 1,
      day: typeof sprint.day === "number" ? Math.min(28, Math.max(1, sprint.day)) : 1,
      daysRemaining: typeof sprint.daysRemaining === "number" ? Math.min(28, Math.max(0, sprint.daysRemaining)) : 28,
      goal: defaults.sprint.goal,
      status,
      startedAt,
      completedItems: Array.isArray(sprint.completedItems) ? sprint.completedItems.filter((item): item is string => typeof item === "string") : [],
      gate: sprint.gate as LearnerState["sprint"]["gate"],
      gates: sprint.gates && typeof sprint.gates === "object" ? sprint.gates as LearnerState["sprint"]["gates"] : {},
    },
    streak: {
      days: typeof oldStreak.days === "number" ? oldStreak.days : 0,
      recoveryTokens: typeof oldStreak.recoveryTokens === "number" ? oldStreak.recoveryTokens : typeof oldStreak.freezes === "number" ? oldStreak.freezes : 2,
      protectedToday: Boolean(oldStreak.protectedToday ?? oldStreak.floorProtectedToday),
      lastProtectedDate: typeof oldStreak.lastProtectedDate === "string" ? oldStreak.lastProtectedDate : undefined,
    },
    onboarding: {
      step: onboardingComplete ? 3 : typeof onboarding.step === "number" ? Math.min(2, Math.max(0, onboarding.step)) : 0,
      completed: onboardingComplete,
      name,
      language,
      timezone: typeof onboarding.timezone === "string" ? onboarding.timezone : defaults.onboarding.timezone,
      sessionTime: typeof onboarding.sessionTime === "string" ? onboarding.sessionTime : defaults.onboarding.sessionTime,
    },
    lessons,
    labs,
    aptitude,
    mastery: value.mastery ?? {},
    attempts: (value.attempts ?? []).map((attempt) => ({
      ...attempt,
      assistance: attempt.assistance ?? (attempt.scaffoldLevel > 0 ? "concept" : "none"),
      transfer: attempt.transfer ?? false,
    })),
    reviews: value.reviews ?? [],
    readiness: {
      ...defaults.readiness,
      ...(value.readiness ?? {}),
    },
    xp: typeof value.xp === "number" ? value.xp : 0,
    contentReports: value.contentReports ?? [],
  };
}
