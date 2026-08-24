import { describe, expect, it } from "vitest";
import { createDefaultLearnerState } from "./default-state";
import { selectPracticeQueue } from "./practice-selection";

describe("practice queue selection", () => {
  it("holds the weakest topic in acquisition weeks and targets its progressive edge", () => {
    const state = createDefaultLearnerState();
    state.sprint.week = 2;
    state.mastery.Percentages = { rating: 0.62, confidence: 0.6, attempts: 4, calibrationError: 0.08 };
    state.mastery.Ratios = { rating: 0.21, confidence: 0.5, attempts: 3, calibrationError: 0.1 };
    const selection = selectPracticeQueue(state);
    expect(selection).toMatchObject({ interleaved: false, topic: "Ratios", targetDifficulty: 0.29 });
  });

  it("interleaves topics after week two while retaining adaptive difficulty", () => {
    const state = createDefaultLearnerState();
    state.sprint.week = 3;
    state.mastery.Percentages = { rating: 0.4, confidence: 0.6, attempts: 4, calibrationError: 0.08 };
    const selection = selectPracticeQueue(state);
    expect(selection.interleaved).toBe(true);
    expect(selection.topic).toBeUndefined();
    expect(selection.targetDifficulty).toBeCloseTo(0.43);
  });
});
