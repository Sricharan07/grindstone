import { launchQuestionTopics } from "@/lib/content/launch-topics";
import type { LearnerState } from "./types";

export interface PracticeSelection {
  interleaved: boolean;
  targetDifficulty: number;
  topic?: string;
}
export function selectPracticeQueue(state: LearnerState): PracticeSelection {
  const interleaved = state.sprint.week >= 3;
  const offset = Math.max(0, state.sprint.day - 1) % launchQuestionTopics.length;
  const rotatedTopics = [
    ...launchQuestionTopics.slice(offset),
    ...launchQuestionTopics.slice(0, offset),
  ];
  const weakestTopic = rotatedTopics.reduce((weakest, topic) => {
    const rating = state.mastery[topic]?.rating ?? 0.35;
    const weakestRating = state.mastery[weakest]?.rating ?? 0.35;
    return rating < weakestRating ? topic : weakest;
  });
  const weakestRating = state.mastery[weakestTopic]?.rating ?? 0.35;

  return {
    interleaved,
    topic: interleaved ? undefined : weakestTopic,
    targetDifficulty: Math.min(0.9, Math.max(0.2, weakestRating + 0.08)),
  };
}
