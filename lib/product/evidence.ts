import type { LearnerState } from "./types";
import { masteryPercent } from "@/lib/engine";

const average = (values: number[]) => values.length
  ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
  : 0;

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function readinessEvidence(state: LearnerState) {
  const attempts = state.attempts.filter((attempt) => attempt.timed);
  const topicMastery = average(Object.values(state.mastery).map(masteryPercent));
  const timedAccuracy = average(attempts.map((attempt) => attempt.correct ? 100 : 0));
  const speed = average(attempts.map((attempt) => Math.min(100, (attempt.targetDurationMs / Math.max(attempt.durationMs, 1)) * 100)));
  const communication = average(attempts.flatMap((attempt) => attempt.communicationScore === undefined ? [] : [attempt.communicationScore]));
  const calibration = average(attempts.flatMap((attempt) => attempt.predictedSuccess === undefined ? [] : [100 - Math.abs(attempt.predictedSuccess * 100 - (attempt.correct ? 100 : 0))]));
  const gate = state.sprint.gate?.score ?? 0;
  const score = attempts.length
    ? clamp(topicMastery * 0.3 + timedAccuracy * 0.22 + speed * 0.14 + communication * 0.12 + calibration * 0.08 + gate * 0.14)
    : 0;
  return { attempts, topicMastery, timedAccuracy, speed, communication, calibration, gate, score };
}

export function routeReadiness(state: LearnerState) {
  const { score, attempts } = readinessEvidence(state);
  const diagnosticFactor = state.profile.diagnosticComplete && attempts.length ? 1 : 0;
  return [
    { company: "Service IT", score: clamp((score + 10) * diagnosticFactor) },
    { company: "Product screening", score: clamp(score * diagnosticFactor) },
    { company: "Big tech loop", score: clamp((score - 15) * diagnosticFactor) },
  ].map((item) => ({
    ...item,
    label: item.score >= 80 ? "Ready" : item.score >= 60 ? "On track" : item.score > 0 ? "Building" : "No evidence",
  }));
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
