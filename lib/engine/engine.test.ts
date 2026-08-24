import { describe, expect, it } from "vitest";
import {
  buildDailyPlan,
  effectiveLoad,
  fadeLevelForMastery,
  masteryPercent,
  newReviewCard,
  REVIEW_GRADES,
  scheduleReview,
  sprintScheduler,
  updateMastery,
  type TrainingItem,
} from "@/lib/engine";

const baseItem = (id: string, topic: string, overrides: Partial<TrainingItem> = {}): TrainingItem => ({
  id,
  title: id,
  topic,
  kind: "coding",
  minutes: 10,
  why: "test",
  priority: 1,
  ...overrides,
});

describe("sprint planner", () => {
  it("suppresses the practice queue during the final 48 hours", () => {
    const reviewSheet = baseItem("sheet", "review", { kind: "review-sheet", minutes: 20 });
    const plan = buildDailyPlan(
      { week: 4, dayOfWeek: 6, daysRemaining: 2, dailyMinutes: 90, dailyFloorMinutes: 20, missedDays: 0 },
      [baseItem("problem", "arrays"), reviewSheet],
    );
    expect(plan.taper).toBe(true);
    expect(plan.items).toEqual([reviewSheet]);
    expect(plan.budgetMinutes).toBeLessThanOrEqual(30);
  });

  it("interleaves topics from sprint week 3 onward", () => {
    const plan = buildDailyPlan(
      { week: 3, dayOfWeek: 2, daysRemaining: 12, dailyMinutes: 60, dailyFloorMinutes: 20, missedDays: 0 },
      [baseItem("a1", "arrays"), baseItem("a2", "arrays"), baseItem("b1", "graphs"), baseItem("b2", "graphs")],
    );
    expect(plan.items.map((item) => item.topic)).toEqual(["arrays", "graphs", "arrays", "graphs"]);
  });

  it("never schedules an unmet prerequisite", () => {
    const plan = buildDailyPlan(
      { week: 2, dayOfWeek: 2, daysRemaining: 18, dailyMinutes: 60, dailyFloorMinutes: 20, missedDays: 0 },
      [baseItem("ready", "arrays"), baseItem("locked", "dp", { prerequisiteComplete: false })],
    );
    expect(plan.items.map((item) => item.id)).not.toContain("locked");
  });

  it("ramps down after two missed days instead of accruing debt", () => {
    const normal = effectiveLoad({ week: 3, dayOfWeek: 2, daysRemaining: 12, dailyMinutes: 60, dailyFloorMinutes: 20, missedDays: 0 });
    const recovery = effectiveLoad({ week: 3, dayOfWeek: 2, daysRemaining: 12, dailyMinutes: 60, dailyFloorMinutes: 20, missedDays: 2 });
    expect(recovery).toBeLessThan(normal);
  });

  it("stays inside the minute budget while reaching the daily floor when possible", () => {
    const plan = buildDailyPlan(
      { week: 2, dayOfWeek: 2, daysRemaining: 18, dailyMinutes: 30, dailyFloorMinutes: 20, missedDays: 0 },
      [baseItem("a", "arrays", { minutes: 12 }), baseItem("b", "graphs", { minutes: 10 }), baseItem("too-large", "dp", { minutes: 40 })],
    );
    expect(plan.scheduledMinutes).toBeGreaterThanOrEqual(20);
    expect(plan.scheduledMinutes).toBeLessThanOrEqual(plan.budgetMinutes);
  });

  it("enforces the post-gate new-material cap without suppressing reteaching", () => {
    const plan = buildDailyPlan(
      { week: 2, dayOfWeek: 1, daysRemaining: 18, dailyMinutes: 60, dailyFloorMinutes: 20, missedDays: 0, gatePassed: false, newMaterialMinutes: 10 },
      [baseItem("new", "graphs", { minutes: 18, newMaterial: true }), baseItem("reteach", "percentages", { minutes: 18, kind: "aptitude" }), baseItem("mixed", "recognition", { minutes: 8, kind: "recognition" })],
    );
    expect(plan.items.map((item) => item.id)).not.toContain("new");
    expect(plan.items.map((item) => item.id)).toContain("reteach");
    expect(plan.message).toContain("Gate gaps");
  });
});

describe("mastery and fading", () => {
  it("converges upward with repeated clean evidence", () => {
    let state = { rating: 0.3, confidence: 0.3, attempts: 0, calibrationError: 0 };
    for (let index = 0; index < 30; index += 1) {
      state = updateMastery(state, { correct: true, predictedSuccess: 0.8, durationMs: 40_000, targetDurationMs: 60_000, scaffoldLevel: 0, difficulty: 0.55 });
    }
    expect(state.rating).toBeGreaterThan(0.55);
    expect(masteryPercent(state)).toBeGreaterThan(40);
  });

  it("moves fade levels monotonically with mastery", () => {
    const levels = [0, 0.2, 0.4, 0.6, 0.8, 1].map(fadeLevelForMastery);
    expect(levels).toEqual([...levels].sort((a, b) => a - b));
    expect(levels.at(-1)).toBe(4);
  });
});

describe("sprint FSRS", () => {
  it("matches the ts-fsrs reference result before sprint compression is needed", () => {
    const now = new Date("2026-08-01T00:00:00Z");
    const card = newReviewCard(now);
    expect(scheduleReview(card, REVIEW_GRADES.good, now)).toEqual(sprintScheduler.next(card, now, REVIEW_GRADES.good));
  });

  it("caps intervals at the 28-day sprint horizon", () => {
    let card = newReviewCard(new Date("2026-08-01T00:00:00Z"));
    let now = new Date("2026-08-01T00:00:00Z");
    for (let index = 0; index < 10; index += 1) {
      const result = scheduleReview(card, REVIEW_GRADES.easy, now);
      card = result.card;
      expect(card.scheduled_days).toBeLessThanOrEqual(28);
      now = card.due;
    }
  });
});
