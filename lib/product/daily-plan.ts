import { activitiesFor, sprintDay } from "@/lib/curriculum/catalog";
import type { LearnerState } from "./types";
import { sprintClock } from "./sprint-clock";

export function dailyPlanFor(state: LearnerState, now = new Date()) {
  const clock = sprintClock(state.sprint, now);
  const day = sprintDay(clock.day);
  const items = activitiesFor(day);
  return {
    day,
    items,
    scheduledMinutes: items.reduce((sum, item) => sum + item.minutes, 0),
    message: day.kind === "gate"
      ? "Today measures independent evidence. Luna and answer-revealing help stay off during the gate."
      : day.kind === "consolidate" || day.kind === "final"
        ? "No new core problem today. Retain, repair, and leave the workspace cleaner than you found it."
        : day.why,
  };
}
