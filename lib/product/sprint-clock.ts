import type { LearnerState, SprintState } from "./types";

export function sprintClock(sprint: SprintState) {
  const day = Math.min(28, Math.max(1, sprint.day));
  return {
    week: Math.min(4, Math.ceil(day / 7)) as 1 | 2 | 3 | 4,
    day,
    daysRemaining: sprint.status === "complete" ? 0 : 29 - day,
    status: sprint.status,
  };
}

export function synchronizeTemporalState(state: LearnerState, now = new Date()): LearnerState {
  const clock = sprintClock(state.sprint);
  const today = now.toISOString().slice(0, 10);
  return {
    ...state,
    reviews: state.reviews ?? [],
    sprint: { ...state.sprint, ...clock },
    streak: { ...state.streak, protectedToday: state.streak.lastProtectedDate === today },
  };
}
