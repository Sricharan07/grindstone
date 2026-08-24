import type { AttemptSignal, MasteryState } from "./types";

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

export function updateMastery(
  previous: MasteryState,
  attempt: AttemptSignal,
): MasteryState {
  const expected = 1 / (1 + 10 ** ((attempt.difficulty - previous.rating) / 0.28));
  const result = attempt.correct ? 1 : 0;
  const speedRatio = attempt.targetDurationMs / Math.max(attempt.durationMs, 1);
  const speedSignal = clamp((speedRatio - 0.55) / 0.9);
  const scaffoldPenalty = clamp(attempt.scaffoldLevel / 4) * 0.35;
  const performance = clamp(result * (0.72 + speedSignal * 0.28) - scaffoldPenalty);
  const learningRate = Math.max(0.055, 0.18 / Math.sqrt(previous.attempts + 1));
  const rating = clamp(previous.rating + learningRate * (performance - expected));
  const calibrationError = attempt.predictedSuccess === undefined
    ? previous.calibrationError
    : Math.abs(attempt.predictedSuccess - result);
  const confidence = clamp(
    attempt.predictedSuccess === undefined
      ? previous.confidence * 0.9 + 0.1
      : previous.confidence * 0.82 + (1 - calibrationError) * 0.18,
  );

  return {
    rating: Number(rating.toFixed(4)),
    confidence: Number(confidence.toFixed(4)),
    attempts: previous.attempts + 1,
    calibrationError: Number(
      (
        attempt.predictedSuccess === undefined
          ? previous.calibrationError
          : (previous.calibrationError * previous.attempts + calibrationError) / (previous.attempts + 1)
      ).toFixed(4),
    ),
  };
}

export function masteryPercent(state: MasteryState): number {
  const evidence = 1 - Math.exp(-state.attempts / 5);
  return Math.round(clamp(state.rating * state.confidence * evidence) * 100);
}
