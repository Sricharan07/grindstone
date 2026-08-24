import { assertWithinAiBudget } from "@/lib/ai/client";
import { findNearDuplicate } from "./dedupe";
import type { GeneratedContentItem, GenerationRequest, PipelineDependencies } from "./types";

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");
const executionRequired = (kind: GeneratedContentItem["kind"]) => !["reasoning", "verbal"].includes(kind);

export async function verifyGeneratedItem(item: GeneratedContentItem, deps: PipelineDependencies, corpus: GeneratedContentItem[] = []) {
  let costUsd = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  item.verification.executionRequired = executionRequired(item.kind);
  if (item.verification.executionRequired) {
    if (!item.verificationProgram || !item.expectedOutput) return { item: { ...item, status: "quarantined" as const, verification: { ...item.verification, execution: { passed: false, output: "", detail: "missing verification program" } } }, costUsd, inputTokens, outputTokens };
    const execution = await deps.execute(item.verificationProgram);
    const executionPassed = execution.outcome === "ok" && normalize(execution.stdout) === normalize(item.expectedOutput) && normalize(item.expectedOutput) === normalize(item.answer);
    item.verification.execution = { passed: executionPassed, output: execution.stdout, detail: executionPassed ? "answer reproduced" : execution.stderr || "output disagreed" };
    if (!executionPassed) return { item: { ...item, status: "quarantined" as const }, costUsd, inputTokens, outputTokens };
  }

  const independent = await deps.independentSolve(item); costUsd += independent.costUsd; inputTokens += independent.inputTokens ?? 0; outputTokens += independent.outputTokens ?? 0;
  const independentPassed = normalize(independent.answer) === normalize(item.answer);
  item.verification.independent = { passed: independentPassed, answer: independent.answer };
  if (!independentPassed) return { item: { ...item, status: "quarantined" as const }, costUsd, inputTokens, outputTokens };

  const ambiguity = await deps.ambiguityCritic(item); costUsd += ambiguity.costUsd; inputTokens += ambiguity.inputTokens ?? 0; outputTokens += ambiguity.outputTokens ?? 0;
  item.verification.ambiguity = { passed: ambiguity.issues.length === 0, issues: ambiguity.issues };
  if (ambiguity.issues.length) return { item: { ...item, status: "quarantined" as const }, costUsd, inputTokens, outputTokens };

  const duplicate = findNearDuplicate(item, corpus);
  if (duplicate) return { item: { ...item, status: "quarantined" as const, verification: { ...item.verification, duplicateOf: duplicate.id } }, costUsd, inputTokens, outputTokens };
  return { item: { ...item, status: "published" as const }, costUsd, inputTokens, outputTokens };
}

export async function runContentBatch(request: GenerationRequest, deps: PipelineDependencies, options: { monthToDateUsd: number; estimatedCostUsd: number; corpus?: GeneratedContentItem[] }) {
  assertWithinAiBudget(options.monthToDateUsd, options.estimatedCostUsd);
  const output: GeneratedContentItem[] = []; let costUsd = 0; let inputTokens = 0; let outputTokens = 0;
  for (let index = 0; index < request.count; index += 1) {
    const generated = await deps.generate(request, index); costUsd += generated.costUsd; inputTokens += generated.inputTokens ?? 0; outputTokens += generated.outputTokens ?? 0;
    assertWithinAiBudget(options.monthToDateUsd, costUsd);
    const verified = await verifyGeneratedItem(generated.item, deps, [...(options.corpus ?? []), ...output]);
    costUsd += verified.costUsd; inputTokens += verified.inputTokens; outputTokens += verified.outputTokens;
    assertWithinAiBudget(options.monthToDateUsd, costUsd);
    output.push(verified.item);
  }
  return { items: output, costUsd, inputTokens, outputTokens, published: output.filter((item) => item.status === "published").length, quarantined: output.filter((item) => item.status === "quarantined").length };
}
