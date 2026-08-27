import { describe, expect, it } from "vitest";
import { activitiesFor, SPRINT_DAYS } from "@/lib/curriculum/catalog";
import { LEARNING_LESSONS } from "@/lib/learning/catalog";
import { dailyPlanFor } from "./daily-plan";
import { createDefaultLearnerState } from "./default-state";
import { readinessSummary } from "./evidence";
import { sprintClock, synchronizeTemporalState } from "./sprint-clock";

describe("28-day product state", () => {
  it("starts with no fabricated progress and no readiness score", () => {
    const state = createDefaultLearnerState("Ada Lovelace");
    expect(state.profile).toMatchObject({ name: "Ada Lovelace", initials: "AL", onboardingComplete: false, language: "python" });
    expect(state.sprint).toMatchObject({ status: "draft", day: 1, daysRemaining: 28 });
    expect(state.attempts).toEqual([]);
    expect(readinessSummary(state)).toMatchObject({ enoughEvidence: false, score: 0, confidence: "Not enough evidence" });
  });

  it("contains 28 sequential days, four weekly gates, and four consolidation days", () => {
    expect(SPRINT_DAYS.map((day) => day.day)).toEqual(Array.from({ length: 28 }, (_, index) => index + 1));
    expect(SPRINT_DAYS.filter((day) => day.kind === "gate").map((day) => day.day)).toEqual([6, 13, 20, 27]);
    expect(SPRINT_DAYS.filter((day) => day.kind === "consolidate" || day.kind === "final").map((day) => day.day)).toEqual([7, 14, 21, 28]);
    expect(LEARNING_LESSONS).toHaveLength(20);
  });

  it("schedules exactly 150 minutes on every day", () => {
    expect(SPRINT_DAYS.every((day) => activitiesFor(day).reduce((sum, activity) => sum + activity.minutes, 0) === 150)).toBe(true);
    expect(dailyPlanFor(createDefaultLearnerState()).scheduledMinutes).toBe(150);
  });

  it("keeps the learner-selected day even when calendar time passes", () => {
    const state = createDefaultLearnerState();
    state.sprint.status = "active";
    state.sprint.day = 2;
    state.sprint.startedAt = "2026-08-01T12:00:00Z";
    expect(sprintClock(state.sprint)).toMatchObject({ day: 2, week: 1, daysRemaining: 27, status: "active" });
    expect(synchronizeTemporalState(state, new Date("2026-09-29T12:00:00Z")).sprint).toMatchObject({ day: 2, week: 1, daysRemaining: 27, status: "active" });
  });
});
