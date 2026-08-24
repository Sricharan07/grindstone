import { buildDailyPlan, masteryPercent, type TrainingItem } from "@/lib/engine";
import type { LearnerState } from "./types";
import { sprintClock } from "./sprint-clock";
import { lessonById, nextLessonId } from "@/lib/content/lessons";

const routeFrontier: Record<LearnerState["profile"]["route"], string[]> = {
  foundations: ["Values and types", "Mutability and references", "Conditionals", "Loops", "Functions and scope"],
  "service-it": ["Percentages", "Time and work", "Pseudocode", "DBMS", "Coding foundations"],
  product: ["Arrays & hashing", "Sliding window", "Binary search", "Stacks and queues", "Communication"],
  "big-tech": ["Dynamic programming", "Graphs", "System design", "Codebase debugging", "Communication"],
  "non-tech": ["Quantitative aptitude", "Logical reasoning", "Verbal", "STAR communication", "Group discussion"],
};

function weakestTopic(state: LearnerState) {
  return Object.entries(state.mastery).sort((left, right) => masteryPercent(left[1]) - masteryPercent(right[1]))[0]?.[0]
    ?? routeFrontier[state.profile.route][0];
}

export function dailyPlanFor(state: LearnerState, now = new Date()) {
  const clock = sprintClock(state.sprint, now);
  const dayKey = now.toISOString().slice(0, 10);
  const recalibration = state.sprint.gate?.passed === false ? state.sprint.gate.recalibration : undefined;
  const weak = recalibration?.reteachTopics[0] ?? weakestTopic(state);
  const codingRoute = ["foundations", "product", "big-tech"].includes(state.profile.route);
  const curriculumRoute = state.profile.route !== "non-tech";
  const completedLessons = new Set(Object.entries(state.lessons).filter(([, progress]) => progress.transferPassed).map(([id]) => id));
  const nextLesson = lessonById(nextLessonId(completedLessons));
  const dueReviews: TrainingItem[] = (state.reviews ?? [])
    .filter((review) => new Date(review.dueAt).getTime() <= now.getTime())
    .sort((left, right) => left.dueAt.localeCompare(right.dueAt))
    .map((review, index) => ({
      id: `${dayKey}:review:${review.itemType}:${review.itemId}`,
      title: ["coding", "problem", "follow-up"].includes(review.itemType) ? `Re-solve: ${review.topic}` : `Free recall: ${review.topic}`,
      topic: review.topic,
      kind: "review" as const,
      minutes: ["coding", "problem", "follow-up"].includes(review.itemType) ? 20 : 10,
      why: `Your memory schedule brought this back for ${new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(review.dueAt))}.`,
      due: true,
      priority: 20 - Math.min(index, 10),
    }));
  const candidates: TrainingItem[] = [
    ...dueReviews,
    {
      id: `${dayKey}:concept:${recalibration || !curriculumRoute ? weak : nextLesson.id}`,
      title: recalibration ? `Rebuild checkpoint evidence: ${weak}` : curriculumRoute ? nextLesson.title : `Build working knowledge: ${weak}`,
      topic: recalibration || !curriculumRoute ? weak : nextLesson.topic,
      kind: recalibration ? "aptitude" : "concept",
      minutes: curriculumRoute && !recalibration ? nextLesson.minutes : 18,
      why: recalibration ? "The weekly checkpoint brings this topic back with more guidance." : curriculumRoute ? nextLesson.purpose : `This is the lowest measured frontier for your ${state.profile.route.replace("-", " ")} route.`,
      newMaterial: !recalibration,
      priority: 9,
    },
    {
      id: `${dayKey}:recognition`,
      title: "Mixed recognition sprint",
      topic: "Mixed recognition",
      kind: "recognition",
      minutes: 8,
      why: state.sprint.week >= 3 ? "Week 3 forces tool selection across mixed topics." : "Short retrieval distinguishes similar tools before a full solve.",
      priority: 8,
    },
    {
      id: `${dayKey}:application`,
      title: codingRoute ? "Timed coding application" : "Timed aptitude section",
      topic: routeFrontier[state.profile.route][1],
      kind: codingRoute ? "coding" : "aptitude",
      minutes: codingRoute ? 28 : 22,
      why: "One timed application rep supplies correctness, speed, and calibration evidence.",
      prerequisiteComplete: state.profile.diagnosticComplete,
      priority: 7,
    },
    {
      id: `${dayKey}:debugging`,
      title: "Hypothesis-driven debugging",
      topic: "Debugging",
      kind: "debugging",
      minutes: 12,
      why: "Reproduce, localize, predict, change one thing, then verify.",
      prerequisiteComplete: state.profile.route !== "non-tech",
      priority: 6,
    },
    {
      id: `${dayKey}:review-sheet`,
      title: "One-page interview review",
      topic: "Review",
      kind: "review-sheet",
      minutes: 20,
      why: "The final 48 hours suppress new work and protect sleep.",
    },
  ];

  return buildDailyPlan({
    week: clock.week,
    dayOfWeek: now.getDay(),
    daysRemaining: clock.daysRemaining,
    dailyMinutes: state.profile.dailyMinutes,
    dailyFloorMinutes: state.commitment.dailyFloorMinutes,
    missedDays: Math.min(2, Math.max(0, clock.day - 1 - state.streak.days)),
    gatePassed: state.sprint.gate?.passed,
    newMaterialMinutes: recalibration?.newMaterialMinutes,
  }, candidates);
}
