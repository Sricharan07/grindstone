import { describe, expect, it } from "vitest";
import { createDefaultLearnerState } from "./default-state";
import { reduceLearnerState } from "./reducer";

describe("learner state reducer", () => {
  it("records attempt evidence, mastery, and anti-gaming XP", () => {
    const initial = createDefaultLearnerState();
    const base = { id: "a-1", itemType: "problem", itemId: "p-1", topic: "Graphs", correct: true, difficulty: 0.7, durationMs: 50_000, targetDurationMs: 60_000, predictedSuccess: 0.65, scaffoldLevel: 0, createdAt: "2026-08-23T00:00:00Z" };
    const timed = reduceLearnerState(initial, { type: "attempt.record", payload: { ...base, timed: true } });
    const untimed = reduceLearnerState(initial, { type: "attempt.record", payload: { ...base, id: "a-2", timed: false } });
    expect(timed.attempts).toHaveLength(1);
    expect(timed.mastery.Graphs.attempts).toBe(1);
    expect(timed.reviews).toHaveLength(1);
    expect(new Date(timed.reviews[0].dueAt).getTime()).toBeGreaterThan(new Date(base.createdAt).getTime());
    expect(timed.xp - initial.xp).toBeGreaterThan(untimed.xp - initial.xp);
  });

  it("updates one FSRS card across repeated attempts instead of duplicating it", () => {
    const initial = createDefaultLearnerState();
    const base = { id: "review-1", itemType: "question", itemId: "question-1", topic: "Percentages", correct: true, difficulty: 0.4, durationMs: 20_000, targetDurationMs: 45_000, predictedSuccess: 0.7, scaffoldLevel: 0, timed: true, createdAt: "2026-08-23T00:00:00Z" };
    const first = reduceLearnerState(initial, { type: "attempt.record", payload: base });
    const second = reduceLearnerState(first, { type: "attempt.record", payload: { ...base, id: "review-2", createdAt: "2026-08-24T00:00:00Z" } });
    expect(second.reviews).toHaveLength(1);
    expect(second.reviews[0].fsrs.reps).toBeGreaterThan(first.reviews[0].fsrs.reps);
    expect(second.xp - first.xp).toBeLessThan(first.xp - initial.xp);
  });

  it("fails a gate and writes a lower-load recalibration", () => {
    const next = reduceLearnerState(createDefaultLearnerState(), { type: "gate.complete", payload: { score: 50, failedTopics: ["SQL", "Graphs"] } });
    expect(next.sprint.gate).toMatchObject({ passed: false, score: 50 });
    expect(next.sprint.gate?.recalibration?.reteachTopics).toEqual(["SQL", "Graphs"]);
    expect(next.sprint.gate?.recalibration?.newMaterialMinutes).toBeLessThan(40);
  });

  it("chains a new four-week sprint without carrying completed-item debt", () => {
    const initial = createDefaultLearnerState();
    initial.sprint.completedItems = ["old-task"];
    const next = reduceLearnerState(initial, { type: "sprint.next", payload: { goal: "Clear the big-tech loop", route: "big-tech", startedAt: "2026-08-23T00:00:00Z" } });
    expect(next.sprint).toMatchObject({ number: 2, week: 1, day: 1, daysRemaining: 28, completedItems: [] });
    expect(next.profile.route).toBe("big-tech");
  });

  it("protects the floor only with enough minutes or an available freeze", () => {
    const initial = createDefaultLearnerState();
    const short = reduceLearnerState(initial, { type: "checkin.evening", payload: { body: "A short recovery session", completedMinutes: 12, completedAt: "2026-08-23T20:00:00Z" } });
    expect(short.streak.floorProtectedToday).toBe(false);
    const frozen = reduceLearnerState(short, { type: "streak.freeze", payload: { protectedAt: "2026-08-23T20:01:00Z" } });
    expect(frozen.streak).toMatchObject({ floorProtectedToday: true, freezes: 1 });
  });

  it("increments the identity streak once per protected calendar day", () => {
    const initial = createDefaultLearnerState();
    const payload = { body: "Completed the planned retrieval and one timed application.", completedMinutes: 30, completedAt: "2026-08-23T20:00:00Z" };
    const first = reduceLearnerState(initial, { type: "checkin.evening", payload });
    const duplicate = reduceLearnerState(first, { type: "checkin.evening", payload: { ...payload, completedAt: "2026-08-23T22:00:00Z" } });
    const nextDay = reduceLearnerState(duplicate, { type: "checkin.evening", payload: { ...payload, completedAt: "2026-08-24T20:00:00Z" } });
    expect(first.streak.days).toBe(1);
    expect(duplicate.streak.days).toBe(1);
    expect(nextDay.streak.days).toBe(2);
  });

  it("dates daily check-ins and scopes retros to the current sprint week", () => {
    const standup = reduceLearnerState(createDefaultLearnerState(), { type: "checkin.standup", payload: { body: "Finish the timed arrays rep.", completedAt: "2026-08-23T08:00:00Z" } });
    const retro = reduceLearnerState(standup, { type: "retro.save", payload: { body: "Keep retrieval. Change the start time. Recommit to six days." } });
    expect(standup.sprint.standupDate).toBe("2026-08-23");
    expect(retro.sprint.retroWeek).toBe(retro.sprint.week);
  });

  it("resets the streak after an unprotected gap and preserves a same-day freeze", () => {
    const initial = createDefaultLearnerState();
    const completed = reduceLearnerState(initial, { type: "checkin.evening", payload: { body: "Completed a real timed practice block.", completedMinutes: 30, completedAt: "2026-08-20T20:00:00Z" } });
    const afterGap = reduceLearnerState(completed, { type: "checkin.evening", payload: { body: "Returned after missing two calendar days.", completedMinutes: 30, completedAt: "2026-08-23T20:00:00Z" } });
    const frozen = reduceLearnerState(afterGap, { type: "streak.freeze", payload: { protectedAt: "2026-08-24T20:00:00Z" } });
    const shortCheckin = reduceLearnerState(frozen, { type: "checkin.evening", payload: { body: "Recovery notes after a short session.", completedMinutes: 5, completedAt: "2026-08-24T21:00:00Z" } });
    expect(afterGap.streak.days).toBe(1);
    expect(shortCheckin.streak.floorProtectedToday).toBe(true);
    expect(shortCheckin.streak.days).toBe(1);
  });

  it("restores the two monthly freezes when the UTC month changes", () => {
    const august = reduceLearnerState(createDefaultLearnerState(), { type: "streak.freeze", payload: { protectedAt: "2026-08-31T23:00:00.000Z" } });
    const augustAgain = reduceLearnerState(august, { type: "streak.freeze", payload: { protectedAt: "2026-08-31T23:30:00.000Z" } });
    const september = reduceLearnerState(augustAgain, { type: "streak.freeze", payload: { protectedAt: "2026-09-01T00:30:00.000Z" } });
    expect(augustAgain.streak.freezes).toBe(0);
    expect(september.streak.freezes).toBe(1);
    expect(september.streak.freezeMonth).toBe("2026-09");
  });

  it("persists onboarding and lesson drafts before either flow completes", () => {
    const onboarding = reduceLearnerState(createDefaultLearnerState(), { type: "onboarding.save", payload: { step: 1, target: "Big tech", language: "cpp" } });
    const lesson = reduceLearnerState(onboarding, { type: "lesson.save", payload: { lessonId: "hashmap-two-sum", progress: { phase: "practice", code: "draft code", prediction: "lookup before insert" } } });
    expect(lesson.onboarding).toMatchObject({ step: 1, target: "Big tech", language: "cpp" });
    expect(lesson.lessons["hashmap-two-sum"]).toMatchObject({ phase: "practice", code: "draft code", prediction: "lookup before insert", transferPassed: false });
  });

  it("caps assisted practice and reserves full mastery evidence for fresh transfer", () => {
    const initial = createDefaultLearnerState();
    initial.mastery.Arrays = { rating: 0.67, confidence: 0.6, attempts: 4, calibrationError: 0.1 };
    const base = { id: "lesson-1", itemType: "lesson-practice", itemId: "array-scan", topic: "Arrays", correct: true, difficulty: 0.8, durationMs: 20_000, targetDurationMs: 60_000, predictedSuccess: 0.6, scaffoldLevel: 4, timed: false, createdAt: "2026-08-23T00:00:00Z" };
    const assisted = reduceLearnerState(initial, { type: "attempt.record", payload: { ...base, assistance: "next-step", transfer: false } });
    const independent = reduceLearnerState(initial, { type: "attempt.record", payload: { ...base, id: "lesson-2", itemType: "lesson-transfer", assistance: "none", scaffoldLevel: 0, transfer: true } });
    expect(assisted.mastery.Arrays.rating).toBeLessThanOrEqual(0.68);
    expect(independent.mastery.Arrays.rating).toBeGreaterThan(assisted.mastery.Arrays.rating);
  });
});
