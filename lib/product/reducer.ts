import { newReviewCard, REVIEW_GRADES, scheduleReview, updateMastery } from "@/lib/engine";
import { initialsFor } from "./default-state";
import type { LearnerAction, LearnerState, ReadinessDimension } from "./types";

const finalDayItems = ["d28-recall", "d28-aptitude", "d28-repair", "d28-resolve", "d28-lab", "d28-plan"];

function xpForAttempt(correct: boolean, difficulty: number, timed: boolean, priorRepetitions: number, independent: boolean) {
  if (!timed) return correct ? 5 : 0;
  const base = correct ? Math.round(12 + difficulty * 20) : 2;
  const repeatFactor = Math.max(0.2, 1 / (priorRepetitions + 1));
  return Math.max(1, Math.round(base * repeatFactor * (independent ? 1 : 0.55)));
}

function nextStreak(days: number, lastDate: string | undefined, protectedDate: string) {
  if (lastDate === protectedDate) return days;
  if (!lastDate) return 1;
  const gap = Math.round((Date.parse(`${protectedDate}T00:00:00Z`) - Date.parse(`${lastDate}T00:00:00Z`)) / 86_400_000);
  return gap === 1 ? days + 1 : 1;
}

function readinessDimension(topic: string, itemType: string): ReadinessDimension {
  const value = `${topic} ${itemType}`.toLowerCase();
  if (/aptitude|sql|ratio|percent|reason|data interpretation/.test(value)) return "Aptitude and SQL";
  if (/ai|retrieval|embedding|rag|model|evaluation/.test(value)) return "Applied AI engineering";
  if (/frontend|backend|api|database|full-stack|lab|system/.test(value)) return "Full-stack engineering";
  if (/explain|communication|behavioral|defense/.test(value)) return "Interview communication";
  return "Coding and debugging";
}

export function reduceLearnerState(state: LearnerState, action: LearnerAction): LearnerState {
  const revision = state.revision + 1;

  switch (action.type) {
    case "onboarding.save":
      return { ...state, revision, onboarding: { ...state.onboarding, ...action.payload } };

    case "onboarding.complete": {
      const name = action.payload.name.trim() || state.profile.name;
      return {
        ...state,
        revision,
        profile: {
          name,
          initials: initialsFor(name),
          language: action.payload.language,
          timezone: action.payload.timezone,
          sessionTime: action.payload.sessionTime,
          onboardingComplete: true,
        },
        onboarding: { ...state.onboarding, ...action.payload, name, completed: true, step: 3 },
        sprint: { ...state.sprint, status: "active", startedAt: action.payload.startedAt },
      };
    }

    case "profile.update": {
      const name = action.payload.name?.trim() || state.profile.name;
      const profile = {
        ...state.profile,
        ...action.payload,
        name,
        initials: initialsFor(name),
      };
      return {
        ...state,
        revision,
        profile,
        onboarding: {
          ...state.onboarding,
          name,
          language: profile.language,
          timezone: profile.timezone,
          sessionTime: profile.sessionTime,
        },
      };
    }

    case "lesson.save": {
      const current = state.lessons[action.payload.lessonId];
      const fallback = {
        stage: "understand" as const,
        language: state.profile.language,
        code: "",
        transferCode: "",
        prediction: "",
        explanation: "",
        hintsUsed: [],
        testsPassed: false,
        transferPassed: false,
        updatedAt: new Date().toISOString(),
      };
      return {
        ...state,
        revision,
        lessons: {
          ...state.lessons,
          [action.payload.lessonId]: {
            ...fallback,
            ...current,
            ...action.payload.progress,
            updatedAt: action.payload.progress.updatedAt ?? new Date().toISOString(),
          },
        },
      };
    }

    case "lab.save": {
      const id = String(action.payload.day);
      const current = state.labs[id];
      const fallback = {
        notes: "",
        evidence: "",
        checks: [],
        completed: false,
        updatedAt: new Date().toISOString(),
      };
      return {
        ...state,
        revision,
        labs: {
          ...state.labs,
          [id]: {
            ...fallback,
            ...current,
            ...action.payload.progress,
            updatedAt: action.payload.progress.updatedAt ?? new Date().toISOString(),
          },
        },
      };
    }

    case "aptitude.save": {
      const id = String(action.payload.day);
      const current = state.aptitude[id];
      const fallback = { currentIndex: 0, answers: {}, completed: false, updatedAt: new Date().toISOString() };
      return {
        ...state,
        revision,
        aptitude: {
          ...state.aptitude,
          [id]: {
            ...fallback,
            ...current,
            ...action.payload.progress,
            updatedAt: action.payload.progress.updatedAt ?? new Date().toISOString(),
          },
        },
      };
    }

    case "plan.toggle": {
      const exists = state.sprint.completedItems.includes(action.payload.itemId);
      const completedItems = exists
        ? state.sprint.completedItems.filter((id) => id !== action.payload.itemId)
        : [...state.sprint.completedItems, action.payload.itemId];
      const finalDayComplete = finalDayItems.every((id) => completedItems.includes(id));
      const finalDayChanged = finalDayItems.includes(action.payload.itemId);
      return {
        ...state,
        revision,
        sprint: {
          ...state.sprint,
          completedItems,
          ...(finalDayComplete ? { status: "complete" as const, day: 28, week: 4 as const, daysRemaining: 0 } : {}),
          ...(finalDayChanged && !finalDayComplete && state.sprint.status === "complete" ? { status: "active" as const, day: 28, week: 4 as const, daysRemaining: 1 } : {}),
        },
      };
    }

    case "gate.complete": {
      const passed = action.payload.score >= 70;
      const gate = { week: action.payload.week, score: action.payload.score, passed, failedTopics: action.payload.failedTopics };
      return {
        ...state,
        revision,
        sprint: {
          ...state.sprint,
          gate,
          gates: { ...state.sprint.gates, [String(action.payload.week)]: { ...gate, completedAt: action.payload.completedAt } },
        },
        xp: state.xp + 20,
      };
    }

    case "attempt.record": {
      const priorRepetitions = state.attempts.filter((attempt) => attempt.itemType === action.payload.itemType && attempt.itemId === action.payload.itemId).length;
      const previous = state.mastery[action.payload.topic] ?? { rating: 0.35, confidence: 0.2, attempts: 0, calibrationError: 0 };
      const measured = updateMastery(previous, {
        correct: action.payload.correct,
        difficulty: action.payload.difficulty,
        durationMs: action.payload.durationMs,
        targetDurationMs: action.payload.targetDurationMs,
        scaffoldLevel: action.payload.scaffoldLevel,
        predictedSuccess: action.payload.predictedSuccess,
      });
      const assistance = action.payload.assistance ?? (action.payload.scaffoldLevel > 0 ? "concept" : "none");
      const serverVerified = action.payload.itemType !== "lesson-transfer" || action.payload.verified === true;
      const independent = assistance === "none" && Boolean(action.payload.transfer) && action.payload.timed && serverVerified;
      const updated = independent ? measured : {
        ...measured,
        rating: Math.min(measured.rating, Math.max(previous.rating, 0.68)),
        confidence: Math.min(measured.confidence, 0.72),
      };
      const reviewedAt = new Date(action.payload.createdAt);
      const previousReview = state.reviews.find((review) => review.itemType === action.payload.itemType && review.itemId === action.payload.itemId);
      const card = previousReview ? {
        ...previousReview.fsrs,
        due: new Date(previousReview.dueAt),
        last_review: previousReview.fsrs.last_review ? new Date(previousReview.fsrs.last_review) : undefined,
      } : newReviewCard(reviewedAt);
      const scheduled = scheduleReview(card, action.payload.correct ? REVIEW_GRADES.good : REVIEW_GRADES.again, reviewedAt).card;
      const nextReview = {
        itemType: action.payload.itemType,
        itemId: action.payload.itemId,
        topic: action.payload.topic,
        dueAt: scheduled.due.toISOString(),
        fsrs: {
          stability: scheduled.stability,
          difficulty: scheduled.difficulty,
          elapsed_days: scheduled.elapsed_days,
          scheduled_days: scheduled.scheduled_days,
          learning_steps: scheduled.learning_steps,
          reps: scheduled.reps,
          lapses: scheduled.lapses,
          state: scheduled.state,
          last_review: scheduled.last_review?.toISOString(),
        },
      };
      const dimension = readinessDimension(action.payload.topic, action.payload.itemType);
      const eligibleScore = independent ? Math.round(updated.rating * 100) : state.readiness[dimension];
      const protectedDate = action.payload.createdAt.slice(0, 10);
      const protectsStreak = action.payload.correct && (action.payload.timed || action.payload.transfer);
      return {
        ...state,
        revision,
        attempts: [{ ...action.payload, assistance }, ...state.attempts].slice(0, 500),
        reviews: [nextReview, ...state.reviews.filter((review) => review.itemType !== action.payload.itemType || review.itemId !== action.payload.itemId)],
        mastery: { ...state.mastery, [action.payload.topic]: updated },
        readiness: { ...state.readiness, [dimension]: eligibleScore },
        streak: protectsStreak ? {
          ...state.streak,
          days: nextStreak(state.streak.days, state.streak.lastProtectedDate, protectedDate),
          protectedToday: true,
          lastProtectedDate: protectedDate,
        } : state.streak,
        xp: state.xp + xpForAttempt(action.payload.correct, action.payload.difficulty, action.payload.timed, priorRepetitions, independent),
      };
    }

    case "content.report":
      return { ...state, revision, contentReports: [action.payload, ...state.contentReports] };

    case "streak.recover": {
      if (state.streak.recoveryTokens < 1) return state;
      return {
        ...state,
        revision,
        streak: {
          ...state.streak,
          recoveryTokens: state.streak.recoveryTokens - 1,
          protectedToday: true,
          lastProtectedDate: action.payload.protectedAt.slice(0, 10),
        },
      };
    }

    case "sprint.day.select": {
      const requestedDay = Number(action.payload.day);
      if (!Number.isInteger(requestedDay)) return state;
      const day = Math.min(28, Math.max(1, requestedDay));
      return {
        ...state,
        revision,
        sprint: {
          ...state.sprint,
          day,
          week: Math.min(4, Math.ceil(day / 7)) as 1 | 2 | 3 | 4,
          daysRemaining: 29 - day,
          status: state.sprint.status === "draft" ? "draft" : "active",
        },
      };
    }

    case "sprint.restart":
      return {
        ...state,
        revision,
        sprint: {
          number: state.sprint.number + 1,
          week: 1,
          day: 1,
          daysRemaining: 28,
          goal: state.sprint.goal,
          status: "active",
          startedAt: action.payload.startedAt,
          completedItems: [],
          gates: {},
        },
      };
  }
}
