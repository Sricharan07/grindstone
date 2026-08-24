import { createDefaultLearnerState } from "./default-state";
import type { LearnerState } from "./types";

export function hydrateLearnerState(value: Partial<LearnerState> | null | undefined): LearnerState {
  const defaults = createDefaultLearnerState(value?.profile?.name);
  if (!value) return defaults;
  return {
    ...defaults,
    ...value,
    profile: { ...defaults.profile, ...value.profile },
    sprint: { ...defaults.sprint, ...value.sprint },
    commitment: { ...defaults.commitment, ...value.commitment },
    streak: { ...defaults.streak, ...value.streak },
    diagnostic: { ...defaults.diagnostic, ...value.diagnostic },
    onboarding: { ...defaults.onboarding, ...value.onboarding },
    lessons: Object.fromEntries(Object.entries(value.lessons ?? {}).map(([id, progress]) => [id, { ...progress, transferCode: progress.transferCode ?? "" }])),
    mastery: value.mastery ?? {},
    attempts: (value.attempts ?? []).map((attempt) => ({
      ...attempt,
      assistance: attempt.assistance ?? (attempt.scaffoldLevel > 0 ? "concept" : "none"),
      transfer: attempt.transfer ?? false,
    })),
    reviews: value.reviews ?? [],
    readiness: value.readiness ?? defaults.readiness,
    driveResults: value.driveResults ?? [],
    starStories: value.starStories ?? [],
    contentReports: value.contentReports ?? [],
  };
}
