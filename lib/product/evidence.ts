import type { LearnerState, ReadinessDimension } from "./types";

export const READINESS_WEIGHTS: Record<ReadinessDimension, number> = {
  "Coding and debugging": 0.3,
  "Full-stack engineering": 0.25,
  "Applied AI engineering": 0.2,
  "Aptitude and SQL": 0.15,
  "Interview communication": 0.1,
};

function evidenceDimension(topic: string, itemType: string): ReadinessDimension {
  const value = `${topic} ${itemType}`.toLowerCase();
  if (/aptitude|sql|ratio|percent|reason|data interpretation/.test(value)) return "Aptitude and SQL";
  if (/ai|retrieval|embedding|rag|model|evaluation/.test(value)) return "Applied AI engineering";
  if (/frontend|backend|api|database|full-stack|lab|system/.test(value)) return "Full-stack engineering";
  if (/explain|communication|behavioral|defense/.test(value)) return "Interview communication";
  return "Coding and debugging";
}
export function readinessSummary(state: LearnerState) {
  const eligible = state.attempts.filter((attempt) => attempt.timed && attempt.transfer && (attempt.assistance ?? "none") === "none");
  const counts = Object.fromEntries(Object.keys(READINESS_WEIGHTS).map((dimension) => [dimension, 0])) as Record<ReadinessDimension, number>;
  for (const attempt of eligible) counts[evidenceDimension(attempt.topic, attempt.itemType)] += 1;

  const dimensions = (Object.keys(READINESS_WEIGHTS) as ReadinessDimension[]).map((name) => ({
    name,
    value: Math.max(0, Math.min(100, Math.round(state.readiness[name]))),
    weight: READINESS_WEIGHTS[name],
    observations: counts[name],
  }));
  const score = Math.round(dimensions.reduce((sum, dimension) => sum + dimension.value * dimension.weight, 0));
  const enoughEvidence = dimensions.every((dimension) => dimension.observations >= 2) && Boolean(state.sprint.gate);
  const confidence = !enoughEvidence ? "Not enough evidence" : eligible.length >= 15 && state.sprint.gate?.passed ? "High" : "Medium";
  const band = !enoughEvidence
    ? "Building evidence"
    : score >= 80 && dimensions.every((dimension) => dimension.value >= 65) && state.sprint.gate?.passed
      ? "Ready to schedule"
      : score >= 65
        ? "Interviewing with gaps"
        : score >= 50
          ? "Screening practice"
          : "Building foundations";
  return { eligible, dimensions, score, confidence, band, enoughEvidence };
}

export function calibrationPoints(state: LearnerState) {
  return state.attempts
    .filter((attempt) => attempt.timed && attempt.predictedSuccess !== undefined)
    .slice(0, 12)
    .map((attempt) => ({
      topic: attempt.topic,
      predicted: Math.round((attempt.predictedSuccess ?? 0) * 100),
      actual: attempt.correct ? 100 : 0,
    }));
}
