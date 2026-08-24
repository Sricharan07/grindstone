import type { SprintContext } from "./types";

export const WEEK_LOAD = {
  1: 0.6,
  2: 1.1,
  3: 1.2,
  4: 0.9,
} as const;

export function isTaper(context: SprintContext): boolean {
  return context.week === 4 && context.daysRemaining <= 2;
}

export function effectiveLoad(context: SprintContext): number {
  if (isTaper(context)) return 0.3;
  const missedDayAdjustment = context.missedDays >= 2 ? 0.78 : 1;
  return WEEK_LOAD[context.week] * missedDayAdjustment;
}

export function gateRecalibration(
  failedTopics: string[],
  originalNewMaterialMinutes: number,
) {
  return {
    reteachTopics: [...new Set(failedTopics)],
    fadeAdjustment: -1,
    newMaterialMinutes: Math.max(
      0,
      Math.round(originalNewMaterialMinutes * 0.55),
    ),
  };
}
