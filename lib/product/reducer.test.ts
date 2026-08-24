import { describe, expect, it } from "vitest";
import { createDefaultLearnerState } from "./default-state";
import { reduceLearnerState } from "./reducer";

const independentAttempt = {
  id: "a-1", itemType: "problem", itemId: "p-1", topic: "Graphs", correct: true, difficulty: 0.7,
  durationMs: 50_000, targetDurationMs: 60_000, predictedSuccess: 0.65, scaffoldLevel: 0,
  assistance: "none" as const, transfer: true, timed: true, createdAt: "2026-08-23T00:00:00Z",
};

describe("learner state reducer", () => {
  it("saves resumable onboarding and activates one fixed sprint", () => {
    const draft = reduceLearnerState(createDefaultLearnerState(), { type: "onboarding.save", payload: { step: 2, name: "Ada", language: "java" } });
    const active = reduceLearnerState(draft, { type: "onboarding.complete", payload: { name: "Ada", language: "java", timezone: "UTC", sessionTime: "19:30", startedAt: "2026-08-23T00:00:00Z" } });
    expect(draft.onboarding).toMatchObject({ step: 2, name: "Ada", language: "java", completed: false });
    expect(active.profile).toMatchObject({ name: "Ada", initials: "A", language: "java", onboardingComplete: true });
    expect(active.sprint).toMatchObject({ status: "active", day: 1, daysRemaining: 28 });
  });

  it("persists lesson drafts with the new five-stage learning loop", () => {
    const next = reduceLearnerState(createDefaultLearnerState(), { type: "lesson.save", payload: { lessonId: "hashmap-two-sum", progress: { stage: "code", code: "draft", prediction: "lookup before insert" } } });
    expect(next.lessons["hashmap-two-sum"]).toMatchObject({ stage: "code", language: "python", code: "draft", prediction: "lookup before insert", transferPassed: false });
  });

  it("updates one FSRS review and discounts repeated XP", () => {
    const first = reduceLearnerState(createDefaultLearnerState(), { type: "attempt.record", payload: independentAttempt });
    const second = reduceLearnerState(first, { type: "attempt.record", payload: { ...independentAttempt, id: "a-2", createdAt: "2026-08-24T00:00:00Z" } });
    expect(second.reviews).toHaveLength(1);
    expect(second.reviews[0].fsrs.reps).toBeGreaterThan(first.reviews[0].fsrs.reps);
    expect(second.xp - first.xp).toBeLessThan(first.xp);
  });

  it("caps assisted mastery and reserves readiness for timed no-help transfer", () => {
    const initial = createDefaultLearnerState();
    initial.mastery.Graphs = { rating: 0.67, confidence: 0.6, attempts: 4, calibrationError: 0.1 };
    const assisted = reduceLearnerState(initial, { type: "attempt.record", payload: { ...independentAttempt, id: "guided", timed: false, transfer: false, assistance: "next-step", scaffoldLevel: 3 } });
    const independent = reduceLearnerState(initial, { type: "attempt.record", payload: independentAttempt });
    expect(assisted.mastery.Graphs.rating).toBeLessThanOrEqual(0.68);
    expect(assisted.readiness["Coding and debugging"]).toBe(0);
    expect(independent.readiness["Coding and debugging"]).toBeGreaterThan(0);
  });

  it("requires server verification before lesson transfer can change readiness", () => {
    const initial = createDefaultLearnerState();
    const lessonAttempt = { ...independentAttempt, itemType: "lesson-transfer", itemId: "array-scan" };
    const unverified = reduceLearnerState(initial, { type: "attempt.record", payload: lessonAttempt });
    const verified = reduceLearnerState(initial, { type: "attempt.record", payload: { ...lessonAttempt, verified: true } });
    expect(unverified.readiness["Coding and debugging"]).toBe(0);
    expect(verified.readiness["Coding and debugging"]).toBeGreaterThan(0);
  });

  it("records gate repair topics, protects a streak once per date, and restarts cleanly", () => {
    const gated = reduceLearnerState(createDefaultLearnerState(), { type: "gate.complete", payload: { week: 1, score: 50, failedTopics: ["SQL", "Graphs"], completedAt: "2026-08-30T00:00:00Z" } });
    const first = reduceLearnerState(gated, { type: "attempt.record", payload: independentAttempt });
    const duplicate = reduceLearnerState(first, { type: "attempt.record", payload: { ...independentAttempt, id: "same-date" } });
    const restarted = reduceLearnerState(duplicate, { type: "sprint.restart", payload: { startedAt: "2026-09-01T00:00:00Z" } });
    expect(gated.sprint.gate).toMatchObject({ passed: false, score: 50, failedTopics: ["SQL", "Graphs"] });
    expect(duplicate.streak.days).toBe(1);
    expect(restarted.sprint).toMatchObject({ number: 2, week: 1, day: 1, daysRemaining: 28, completedItems: [] });
  });

  it("persists interrupted aptitude and capstone work", () => {
    const initial = createDefaultLearnerState();
    const withAptitude = reduceLearnerState(initial, {
      type: "aptitude.save",
      payload: { day: 3, progress: { currentIndex: 2, answers: { "aptitude-10": { selectedIndex: 1, answerIndex: 1, correct: true, explanation: "Eight ratio units." } } } },
    });
    const withLab = reduceLearnerState(withAptitude, {
      type: "lab.save",
      payload: { day: 3, progress: { notes: "The join query now uses the ownership key and the focused test passes.", evidence: "commit abc123", checks: [true, true, false, false] } },
    });
    expect(withLab.aptitude["3"]).toMatchObject({ currentIndex: 2, completed: false });
    expect(withLab.aptitude["3"].answers["aptitude-10"].correct).toBe(true);
    expect(withLab.labs["3"]).toMatchObject({ evidence: "commit abc123", checks: [true, true, false, false], completed: false });
  });
});
