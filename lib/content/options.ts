import type { GeneratedContentItem } from "./types";

function stableOffset(id: string, length: number) {
  let hash = 0;
  for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return length ? hash % length : 0;
}

export function orderedOptions(item: Pick<GeneratedContentItem, "id" | "answer" | "distractors">) {
  const options = [item.answer, ...item.distractors];
  const offset = stableOffset(item.id, options.length);
  return [...options.slice(offset), ...options.slice(0, offset)];
}

export function questionPayload(item: GeneratedContentItem) {
  const options = orderedOptions(item);
  return {
    options,
    answerIndex: options.indexOf(item.answer),
    subgoalLabels: item.subgoalLabels,
    bodyL1: item.bodyL1,
    bodyL2: item.bodyL2,
    bodyL3: item.bodyL3,
  };
}
