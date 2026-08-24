import type { LearnerState, SprintState } from "./types";

const dayMs = 24 * 60 * 60 * 1000;

export function sprintClock(sprint: SprintState, now = new Date()) {
  if (sprint.status === "draft" || !sprint.startedAt) return { week: sprint.week, day: sprint.day, daysRemaining: sprint.daysRemaining, status: sprint.status };
  const elapsed = Math.floor(Math.max(0, now.getTime() - new Date(sprint.startedAt).getTime()) / dayMs);
  const day = Math.min(28, elapsed + 1);
  return {
    week: Math.min(4, Math.ceil(day / 7)) as 1 | 2 | 3 | 4,
    day,
    daysRemaining: Math.max(0, 28 - elapsed),
    status: elapsed >= 28 ? "complete" as const : "active" as const,
  };
}

export function synchronizeTemporalState(state: LearnerState, now = new Date()): LearnerState {
  const clock = sprintClock(state.sprint, now);
  const today = now.toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  const freezes = state.streak.freezeMonth === month ? state.streak.freezes : 2;
  return {
    ...state,
    reviews: state.reviews ?? [],
    sprint: { ...state.sprint, ...clock },
    streak: { ...state.streak, freezes, freezeMonth: month, floorProtectedToday: state.streak.lastProtectedDate === today },
  };
}
