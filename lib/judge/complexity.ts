export interface TimingSample {
  n: number;
  durationMs: number;
}

export type ComplexityClass =
  | "O(1)"
  | "O(log n)"
  | "O(n)"
  | "O(n log n)"
  | "O(n²)";

const MODELS: Record<ComplexityClass, (n: number) => number> = {
  "O(1)": () => 1,
  "O(log n)": (n) => Math.log2(Math.max(2, n)),
  "O(n)": (n) => n,
  "O(n log n)": (n) => n * Math.log2(Math.max(2, n)),
  "O(n²)": (n) => n * n,
};

const COMPLEXITY_RANK: Record<ComplexityClass, number> = {
  "O(1)": 0,
  "O(log n)": 1,
  "O(n)": 2,
  "O(n log n)": 3,
  "O(n²)": 4,
};

export function meetsComplexityBar(
  measured: { complexity: string; confidence: number } | undefined,
  target: ComplexityClass,
) {
  if (!measured || measured.confidence < 0.65) return true;
  const rank = COMPLEXITY_RANK[measured.complexity as ComplexityClass];
  return rank !== undefined && rank <= COMPLEXITY_RANK[target];
}

export function inferComplexity(samples: TimingSample[]) {
  if (samples.length < 4) {
    return { complexity: "O(1)" as ComplexityClass, confidence: 0 };
  }
  const valid = samples.filter((sample) => sample.n > 0 && sample.durationMs > 0);
  const measured = valid.map((sample) => sample.durationMs);
  const meanMeasured = measured.reduce((sum, value) => sum + value, 0) / measured.length;
  const variance = measured.reduce((sum, value) => sum + (value - meanMeasured) ** 2, 0);

  const scores = (Object.entries(MODELS) as Array<[ComplexityClass, (n: number) => number]>)
    .map(([complexity, model]) => {
      const expected = valid.map((sample) => model(sample.n));
      const meanExpected = expected.reduce((sum, value) => sum + value, 0) / expected.length;
      const expectedVariance = expected.reduce((sum, value) => sum + (value - meanExpected) ** 2, 0);
      const slope = expectedVariance === 0
        ? 0
        : expected.reduce(
            (sum, value, index) => sum + (value - meanExpected) * (measured[index] - meanMeasured),
            0,
          ) / expectedVariance;
      const intercept = meanMeasured - slope * meanExpected;
      const error = expected.reduce(
        (sum, value, index) => sum + (measured[index] - (slope * value + intercept)) ** 2,
        0,
      );
      return { complexity, error };
    })
    .sort((a, b) => a.error - b.error);

  const best = scores[0];
  const separation = scores[1] ? 1 - best.error / Math.max(scores[1].error, 0.0001) : 0;
  const fit = variance === 0 ? (best.complexity === "O(1)" ? 1 : 0) : 1 - best.error / variance;
  return {
    complexity: best.complexity,
    confidence: Number(Math.max(0, Math.min(1, fit * 0.7 + separation * 0.3)).toFixed(2)),
  };
}
