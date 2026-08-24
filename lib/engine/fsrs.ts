import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  type RecordLogItem,
  type Card,
  type Grade,
} from "ts-fsrs";

export const sprintScheduler = fsrs(
  generatorParameters({
    maximum_interval: 28,
    request_retention: 0.92,
    enable_fuzz: false,
  }),
);

export function newReviewCard(now = new Date()): Card {
  return createEmptyCard(now);
}

export function scheduleReview(card: Card, grade: Grade, now = new Date()) {
  const result = sprintScheduler.next(card, now, grade);
  if (result.card.scheduled_days <= 28) return result;

  const due = new Date(now);
  due.setUTCDate(due.getUTCDate() + 28);
  return {
    card: { ...result.card, scheduled_days: 28, due },
    log: { ...result.log, scheduled_days: 28, due },
  } satisfies RecordLogItem;
}

export const REVIEW_GRADES = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
} as const;
