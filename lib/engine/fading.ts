export type FadeLevel = 0 | 1 | 2 | 3 | 4;

export function fadeLevelForMastery(mastery: number): FadeLevel {
  if (mastery < 0.25) return 0;
  if (mastery < 0.45) return 1;
  if (mastery < 0.65) return 2;
  if (mastery < 0.82) return 3;
  return 4;
}

export function recalibratedFadeLevel(
  current: FadeLevel,
  gatePassed: boolean,
): FadeLevel {
  if (gatePassed) return current;
  return Math.max(0, current - 1) as FadeLevel;
}
