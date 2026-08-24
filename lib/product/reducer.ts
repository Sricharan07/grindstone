import { gateRecalibration, newReviewCard, REVIEW_GRADES, scheduleReview, updateMastery } from "@/lib/engine";
import type { LearnerAction, LearnerState } from "./types";

const xpForAttempt = (correct: boolean, difficulty: number, timed: boolean, priorRepetitions: number) => {
  if (!timed) return 0;
  const base = correct ? Math.round(30 + difficulty * 52) : 4;
  const multiplier = Math.max(0.2, 1 / (priorRepetitions + 1));
  return Math.max(1, Math.round(base * multiplier));
};

function nextStreakDays(days: number, lastDate: string | undefined, protectedDate: string) {
  if (lastDate === protectedDate) return days;
  if (!lastDate) return 1;
  const gap = Math.round((Date.parse(`${protectedDate}T00:00:00Z`) - Date.parse(`${lastDate}T00:00:00Z`)) / 86_400_000);
  return gap === 1 ? days + 1 : 1;
}

export function reduceLearnerState(state: LearnerState, action: LearnerAction): LearnerState {
  const nextRevision = state.revision + 1;

  switch (action.type) {
    case "profile.update": {
      const name = action.payload.name?.trim() || state.profile.name;
      const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "GS";
      return {
        ...state,
        revision: nextRevision,
        profile: {
          ...state.profile,
          name,
          initials,
          target: action.payload.target ?? state.profile.target,
          preferredLanguage: action.payload.language ?? state.profile.preferredLanguage,
          dailyMinutes: action.payload.dailyMinutes ?? state.profile.dailyMinutes,
          daysPerWeek: action.payload.daysPerWeek ?? state.profile.daysPerWeek,
        },
        onboarding: {
          ...state.onboarding,
          target: action.payload.target ?? state.onboarding.target,
          language: action.payload.language ?? state.onboarding.language,
          dailyMinutes: action.payload.dailyMinutes ?? state.onboarding.dailyMinutes,
          daysPerWeek: action.payload.daysPerWeek ?? state.onboarding.daysPerWeek,
        },
      };
    }
    case "onboarding.save":
      return {
        ...state,
        revision: nextRevision,
        onboarding: { ...state.onboarding, ...action.payload },
      };
    case "onboarding.complete":
      return {
        ...state,
        revision: nextRevision,
        profile: {
          ...state.profile,
          route: action.payload.route,
          target: action.payload.target,
          preferredLanguage: action.payload.language,
          dailyMinutes: action.payload.dailyMinutes,
          daysPerWeek: action.payload.daysPerWeek,
        },
        sprint: { ...state.sprint, goal: action.payload.goal, status: "draft" },
        commitment: { ...state.commitment, implementationIntention: action.payload.implementationIntention, stakeCents: action.payload.stakeCents },
        onboarding: {
          ...state.onboarding,
          ...action.payload,
          completed: true,
          step: 3,
        },
      };
    case "lesson.save": {
      const current = state.lessons[action.payload.lessonId];
      const fallback = {
        phase: "concept" as const,
        language: state.profile.preferredLanguage,
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
        revision: nextRevision,
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
    case "plan.toggle": {
      const exists = state.sprint.completedItems.includes(action.payload.itemId);
      const completedItems = exists
        ? state.sprint.completedItems.filter((id) => id !== action.payload.itemId)
        : [...state.sprint.completedItems, action.payload.itemId];
      return { ...state, revision: nextRevision, sprint: { ...state.sprint, completedItems } };
    }
    case "checkin.standup":
      return { ...state, revision: nextRevision, sprint: { ...state.sprint, standup: action.payload.body, standupDate: action.payload.completedAt.slice(0, 10) } };
    case "checkin.evening": {
      const protectedDate = action.payload.completedAt.slice(0, 10);
      const floorMet = action.payload.completedMinutes >= state.commitment.dailyFloorMinutes;
      const alreadyProtected = state.streak.lastProtectedDate === protectedDate;
      return {
        ...state,
        revision: nextRevision,
        sprint: { ...state.sprint, eveningCheckin: action.payload.body, eveningCheckinDate: protectedDate },
        streak: { ...state.streak, days: floorMet ? nextStreakDays(state.streak.days, state.streak.lastProtectedDate, protectedDate) : state.streak.days, floorProtectedToday: floorMet || alreadyProtected, lastProtectedDate: floorMet ? protectedDate : state.streak.lastProtectedDate },
      };
    }
    case "retro.save":
      return { ...state, revision: nextRevision, sprint: { ...state.sprint, retro: action.payload.body, retroWeek: state.sprint.week } };
    case "gate.complete": {
      const passed = action.payload.score >= 75;
      const recalibration = passed ? undefined : gateRecalibration(action.payload.failedTopics, 18);
      return {
        ...state,
        revision: nextRevision,
        sprint: { ...state.sprint, gate: { week: state.sprint.week, score: action.payload.score, passed, failedTopics: action.payload.failedTopics, recalibration } },
        xp: state.xp + (passed ? 180 : 35),
      };
    }
    case "attempt.record": {
      const priorRepetitions = state.attempts.filter((attempt) => attempt.itemType === action.payload.itemType && attempt.itemId === action.payload.itemId).length;
      const previous = state.mastery[action.payload.topic] ?? { rating: 0.35, confidence: 0.2, attempts: 0, calibrationError: 0 };
      const rawUpdated = updateMastery(previous, {
        correct: action.payload.correct,
        difficulty: action.payload.difficulty,
        durationMs: action.payload.durationMs,
        targetDurationMs: action.payload.targetDurationMs,
        scaffoldLevel: action.payload.scaffoldLevel,
        predictedSuccess: action.payload.predictedSuccess,
      });
      const assistance = action.payload.assistance ?? (action.payload.scaffoldLevel > 0 ? "concept" : "none");
      const assisted = assistance !== "none";
      const mayProveMastery = !assisted && Boolean(action.payload.transfer);
      const updated = mayProveMastery
        ? rawUpdated
        : {
            ...rawUpdated,
            rating: Math.min(rawUpdated.rating, Math.max(previous.rating, 0.68)),
            confidence: Math.min(rawUpdated.confidence, 0.72),
          };
      const reviewedAt = new Date(action.payload.createdAt);
      const previousReview = (state.reviews ?? []).find((review) => review.itemType === action.payload.itemType && review.itemId === action.payload.itemId);
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
      return {
        ...state,
        revision: nextRevision,
        attempts: [action.payload, ...state.attempts].slice(0, 500),
        reviews: [nextReview, ...(state.reviews ?? []).filter((review) => review.itemType !== action.payload.itemType || review.itemId !== action.payload.itemId)],
        mastery: { ...state.mastery, [action.payload.topic]: updated },
        xp: state.xp + xpForAttempt(action.payload.correct, action.payload.difficulty, action.payload.timed, priorRepetitions),
      };
    }
    case "diagnostic.answer":
      return { ...state, revision: nextRevision, diagnostic: { ...state.diagnostic, status: "in-progress", answers: { ...state.diagnostic.answers, [action.payload.questionId]: action.payload.answer } } };
    case "diagnostic.complete":
      return {
        ...state,
        revision: nextRevision,
        profile: { ...state.profile, route: action.payload.route, diagnosticComplete: true },
        sprint: { ...state.sprint, goal: action.payload.goal, status: "active", startedAt: action.payload.completedAt },
        diagnostic: { ...state.diagnostic, status: "complete", topicPriors: action.payload.topicPriors },
        mastery: { ...state.mastery, ...Object.fromEntries(Object.entries(action.payload.topicPriors).map(([topic, rating]) => [topic, { rating, confidence: 0.35, attempts: 1, calibrationError: 0 }])) },
      };
    case "drive.complete":
      return { ...state, revision: nextRevision, driveResults: [action.payload, ...state.driveResults], xp: state.xp + Math.round(action.payload.score * 1.8) };
    case "star.save": {
      const stories = state.starStories.filter((story) => story.id !== action.payload.id);
      return { ...state, revision: nextRevision, starStories: [action.payload, ...stories] };
    }
    case "content.report":
      return { ...state, revision: nextRevision, contentReports: [action.payload, ...state.contentReports] };
    case "streak.freeze":
      {
        const month = action.payload.protectedAt.slice(0, 7);
        const available = state.streak.freezeMonth === month ? state.streak.freezes : 2;
        if (available < 1) return state;
        return { ...state, revision: nextRevision, streak: { ...state.streak, freezes: available - 1, freezeMonth: month, floorProtectedToday: true, lastProtectedDate: action.payload.protectedAt.slice(0, 10) } };
      }
    case "sprint.next":
      return {
        ...state,
        revision: nextRevision,
        profile: { ...state.profile, route: action.payload.route },
        sprint: { number: state.sprint.number + 1, week: 1, day: 1, daysRemaining: 28, goal: action.payload.goal, status: "active", startedAt: action.payload.startedAt, completedItems: [] },
      };
  }
}
