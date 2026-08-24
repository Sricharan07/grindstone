import type { LearnerState } from "./types";

export function initialsFor(name: string) {
  const value = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
  return value || "GS";
}

export function createDefaultLearnerState(name = "Member"): LearnerState {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  return {
    revision: 0,
    profile: {
      name,
      initials: initialsFor(name),
      language: "python",
      timezone,
      sessionTime: "20:00",
      onboardingComplete: false,
    },
    sprint: {
      number: 1,
      week: 1,
      day: 1,
      daysRemaining: 28,
      goal: "Become interview-ready as an AI-enabled full-stack software engineer",
      status: "draft",
      completedItems: [],
      gates: {},
    },
    streak: { days: 0, recoveryTokens: 2, protectedToday: false },
    mastery: {},
    attempts: [],
    reviews: [],
    readiness: {
      "Coding and debugging": 0,
      "Full-stack engineering": 0,
      "Applied AI engineering": 0,
      "Aptitude and SQL": 0,
      "Interview communication": 0,
    },
    xp: 0,
    onboarding: {
      step: 0,
      completed: false,
      name,
      language: "python",
      timezone,
      sessionTime: "20:00",
    },
    lessons: {},
    labs: {},
    aptitude: {},
    contentReports: [],
  };
}
