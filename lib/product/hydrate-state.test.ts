import { describe, expect, it } from "vitest";
import { createDefaultLearnerState } from "./default-state";
import { hydrateLearnerState } from "./hydrate-state";

describe("learner state migration", () => {
  it("adds resumable onboarding and lesson progress to legacy snapshots", () => {
    const legacy = createDefaultLearnerState();
    const partial = { ...legacy, onboarding: undefined, lessons: undefined };
    const hydrated = hydrateLearnerState(partial as never);
    expect(hydrated.onboarding).toMatchObject({ step: 0, completed: false, language: "python" });
    expect(hydrated.lessons).toEqual({});
  });

  it("labels legacy scaffolded attempts as assisted", () => {
    const state = createDefaultLearnerState();
    state.attempts = [{ id: "old", itemType: "lesson", itemId: "x", topic: "Arrays", correct: true, difficulty: 0.5, durationMs: 10, targetDurationMs: 20, scaffoldLevel: 2, timed: false, createdAt: "2026-08-23T00:00:00Z" }];
    const hydrated = hydrateLearnerState(state);
    expect(hydrated.attempts[0]).toMatchObject({ assistance: "concept", transfer: false });
  });
});
