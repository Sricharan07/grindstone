import { describe, expect, it } from "vitest";
import { dailyPlanFor } from "./daily-plan";
import { createDefaultLearnerState } from "./default-state";
import { readinessEvidence, routeReadiness } from "./evidence";
import { sprintClock, synchronizeTemporalState } from "./sprint-clock";

describe("real learner evidence", () => {
  it("starts a new member with no fabricated progress", () => {
    const state = createDefaultLearnerState("Ada Lovelace");
    expect(state.profile).toMatchObject({ name: "Ada Lovelace", initials: "AL", diagnosticComplete: false });
    expect(state.sprint.status).toBe("draft");
    expect(state.attempts).toEqual([]);
    expect(state.mastery).toEqual({});
    expect(state.xp).toBe(0);
    expect(routeReadiness(state).every((route) => route.score === 0 && route.label === "No evidence")).toBe(true);
  });

  it("computes communication as a 0-100 score rather than multiplying it again", () => {
    const state = createDefaultLearnerState();
    state.profile.diagnosticComplete = true;
    state.attempts = [{ id: "a", itemType: "mock", itemId: "m", topic: "Communication", correct: true, difficulty: 0.5, durationMs: 30_000, targetDurationMs: 60_000, predictedSuccess: 0.8, scaffoldLevel: 0, timed: true, communicationScore: 82, createdAt: "2026-08-23T00:00:00Z" }];
    state.mastery.Communication = { rating: 0.7, confidence: 0.6, attempts: 1, calibrationError: 0.2 };
    expect(readinessEvidence(state).communication).toBe(82);
    expect(readinessEvidence(state).score).toBeLessThanOrEqual(100);
  });

  it("suppresses new work during the final 48-hour taper", () => {
    const state = createDefaultLearnerState();
    state.profile.diagnosticComplete = true;
    state.sprint.status = "active";
    state.sprint.week = 4;
    state.sprint.daysRemaining = 2;
    const plan = dailyPlanFor(state, new Date("2026-08-29T12:00:00Z"));
    expect(plan.taper).toBe(true);
    expect(plan.items).toHaveLength(1);
    expect(plan.items[0].kind).toBe("review-sheet");
  });

  it("advances sprint day, week, remaining time, and completion from its start timestamp", () => {
    const state = createDefaultLearnerState();
    state.sprint.status = "active";
    state.sprint.startedAt = "2026-08-01T12:00:00Z";
    expect(sprintClock(state.sprint, new Date("2026-08-09T12:00:00Z"))).toMatchObject({ day: 9, week: 2, daysRemaining: 20, status: "active" });
    expect(synchronizeTemporalState(state, new Date("2026-08-29T12:00:00Z")).sprint.status).toBe("complete");
  });
});
