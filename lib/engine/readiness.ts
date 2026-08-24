export interface ReadinessSignals {
  mastery: number;
  timedAccuracy: number;
  speed: number;
  communication: number;
  calibration: number;
  recentGate: number;
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function calculateReadiness(signals: ReadinessSignals): number {
  const score =
    signals.mastery * 0.3 +
    signals.timedAccuracy * 0.22 +
    signals.speed * 0.14 +
    signals.communication * 0.12 +
    signals.calibration * 0.08 +
    signals.recentGate * 0.14;

  return Math.round(clamp(score) * 100);
}

export function readinessLabel(score: number) {
  if (score >= 82) return "Loop ready";
  if (score >= 68) return "On track";
  if (score >= 50) return "Building evidence";
  return "Foundation phase";
}
