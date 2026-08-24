import type { LearnerState } from "./types";

function initials(name: string) {
  const value = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
  return value || "GS";
}

export function createDefaultLearnerState(name = "Member"): LearnerState {
  return {
    revision: 0,
    profile: {
      name,
      initials: initials(name),
      route: "foundations",
      preferredLanguage: "python",
      target: "Choose your interview target",
      dailyMinutes: 60,
      daysPerWeek: 6,
      diagnosticComplete: false,
    },
    sprint: {
      number: 1,
      week: 1,
      day: 1,
      daysRemaining: 28,
      goal: "Complete onboarding and establish a measured baseline",
      status: "draft",
      completedItems: [],
    },
    commitment: {
      implementationIntention: "Set your implementation intention during onboarding.",
      dailyFloorMinutes: 20,
      stakeCents: null,
    },
    streak: { days: 0, freezes: 2, floorProtectedToday: false },
    mastery: {},
    attempts: [],
    reviews: [],
    readiness: { "Service IT": 0, "Product screening": 0, "Big tech loop": 0 },
    xp: 0,
    diagnostic: { status: "not-started", answers: {}, topicPriors: {} },
    driveResults: [],
    starStories: [],
    contentReports: [],
  };
}
