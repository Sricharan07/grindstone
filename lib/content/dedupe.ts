import type { GeneratedContentItem } from "./types";

const tokens = (value: string) => new Set(value.toLowerCase().match(/[a-z0-9]+/g) ?? []);
export function contentSimilarity(left: string, right: string) { const a = tokens(left); const b = tokens(right); const intersection = [...a].filter((token) => b.has(token)).length; const union = new Set([...a, ...b]).size; return union ? intersection / union : 0; }
export function findNearDuplicate(item: GeneratedContentItem, corpus: GeneratedContentItem[], threshold = 0.82) { return corpus.find((candidate) => candidate.topic === item.topic && contentSimilarity(candidate.prompt, item.prompt) >= threshold); }
