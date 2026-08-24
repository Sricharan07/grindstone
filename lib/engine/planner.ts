import { effectiveLoad, isTaper } from "./sprint";
import type { DailyPlan, SprintContext, TrainingItem } from "./types";

function byPriority(a: TrainingItem, b: TrainingItem) {
  return (b.priority ?? 0) - (a.priority ?? 0);
}

function interleave(items: TrainingItem[]) {
  const queues = new Map<string, TrainingItem[]>();
  for (const item of items) {
    const queue = queues.get(item.topic) ?? [];
    queue.push(item);
    queues.set(item.topic, queue);
  }

  const mixed: TrainingItem[] = [];
  while ([...queues.values()].some((queue) => queue.length > 0)) {
    for (const queue of queues.values()) {
      const item = queue.shift();
      if (item) mixed.push(item);
    }
  }
  return mixed;
}

export function buildDailyPlan(
  context: SprintContext,
  candidates: TrainingItem[],
): DailyPlan {
  const taper = isTaper(context);
  const loadFactor = effectiveLoad(context);
  const budgetMinutes = Math.max(
    context.dailyFloorMinutes,
    Math.round(context.dailyMinutes * loadFactor),
  );

  if (taper) {
    const reviewSheet = candidates.find((item) => item.kind === "review-sheet");
    return {
      items: reviewSheet ? [reviewSheet] : [],
      budgetMinutes: Math.min(budgetMinutes, 30),
      scheduledMinutes: reviewSheet?.minutes ?? 0,
      loadFactor,
      taper,
      message: "Training is done. Review lightly, then protect your sleep.",
    };
  }

  const eligible = candidates.filter(
    (item) => item.prerequisiteComplete !== false && item.kind !== "review-sheet",
  );
  const dueReviews = eligible.filter((item) => item.due).sort(byPriority);
  const remaining = eligible
    .filter((item) => !item.due)
    .sort(byPriority);
  const ordered = [
    ...dueReviews,
    ...(context.week >= 3 ? interleave(remaining) : remaining),
  ];

  const reviewCap = Math.round(budgetMinutes * 0.42);
  const newMaterialCap = context.newMaterialMinutes ?? Number.POSITIVE_INFINITY;
  const items: TrainingItem[] = [];
  let scheduledMinutes = 0;
  let reviewMinutes = 0;
  let newMaterialMinutes = 0;

  for (const item of ordered) {
    if (item.due && reviewMinutes + item.minutes > reviewCap && items.length > 0) {
      continue;
    }
    if (item.newMaterial && newMaterialMinutes + item.minutes > newMaterialCap) {
      continue;
    }
    if (scheduledMinutes + item.minutes > budgetMinutes) {
      continue;
    }
    items.push(item);
    scheduledMinutes += item.minutes;
    if (item.due) reviewMinutes += item.minutes;
    if (item.newMaterial) newMaterialMinutes += item.minutes;
  }

  if (scheduledMinutes < context.dailyFloorMinutes) {
    const floorItem = eligible
      .filter((item) => !items.some((selected) => selected.id === item.id))
      .filter((item) => !item.newMaterial || newMaterialMinutes + item.minutes <= newMaterialCap)
      .sort((a, b) => a.minutes - b.minutes)[0];
    if (floorItem && scheduledMinutes + floorItem.minutes <= budgetMinutes) {
      items.push(floorItem);
      scheduledMinutes += floorItem.minutes;
    }
  }

  return {
    items,
    budgetMinutes,
    scheduledMinutes,
    loadFactor,
    taper,
    message:
      context.missedDays >= 2
        ? "The load is lighter today. Rebuild the rhythm; no debt is carried forward."
        : context.gatePassed === false
          ? "Gate gaps return with more scaffolding; new material stays capped."
        : "Due recall first, then one frontier skill and a mixed rep.",
  };
}
