import { describe, expect, it } from "vitest";
import { buildBootstrapBank } from "./bootstrap-bank";
import { diagnosticQuestions, scoreDiagnostic } from "./diagnostic";
import { contentSimilarity, findNearDuplicate } from "./dedupe";
import { questionPayload } from "./options";
import { runContentBatch, verifyGeneratedItem } from "./pipeline";
import { optionDistribution, shouldRetireContent, storedVerificationPasses } from "./retire";
import type { GeneratedContentItem, PipelineDependencies } from "./types";

function item(overrides: Partial<GeneratedContentItem> = {}): GeneratedContentItem {
  return { id: "item-1", kind: "quantitative", topic: "Percentages", difficulty: 0.5, prompt: "A price increases by ten percent. Find the result.", answer: "110", distractors: ["100", "111", "120"], explanation: "Multiply the original amount by one point one.", subgoalLabels: ["Translate rate", "Apply multiplier"], bodyL1: "A percentage is a fraction of one hundred.", bodyL2: "Translate the rate into a multiplier and apply it.", bodyL3: "The multiplier follows from distributing the original value.", verificationProgram: "print(100 * 1.1)", expectedOutput: "110", status: "generated", verification: {}, ...overrides };
}

const passingDeps: PipelineDependencies = {
  generate: async (_request, index) => ({ item: item({ id: `item-${index}`, prompt: `A price ${index} increases by ten percent. Find the result.` }), costUsd: 0.01 }),
  execute: async () => ({ outcome: "ok", stdout: "110\n", stderr: "" }),
  independentSolve: async () => ({ answer: "110", costUsd: 0.01 }),
  ambiguityCritic: async () => ({ issues: [], costUsd: 0.01 }),
};

describe("launch content bank", () => {
  it("contains 1,200 deterministic, independently matching questions", () => {
    const bank = buildBootstrapBank();
    expect(bank).toHaveLength(1200);
    expect(new Set(bank.map((question) => question.prompt)).size).toBe(1200);
    expect(bank.every((question) => question.verification.reproducedAnswer === question.payload.options[question.payload.answerIndex])).toBe(true);
    expect(bank.every((question) => question.verification.independentAnswer === question.payload.options[question.payload.answerIndex])).toBe(true);
  });
});

describe("diagnostic routing", () => {
  it("separates a beginner from a senior using the same questions", () => {
    const wrong = Object.fromEntries(diagnosticQuestions.map((question) => [question.id, String((question.answer + 1) % question.options.length)]));
    const right = Object.fromEntries(diagnosticQuestions.map((question) => [question.id, String(question.answer)]));
    expect(scoreDiagnostic(wrong).route).toBe("foundations");
    expect(scoreDiagnostic(right).route).toBe("big-tech");
    expect(scoreDiagnostic(wrong).goal).not.toBe(scoreDiagnostic(right).goal);
  });
});

describe("AI content pipeline", () => {
  it("publishes only after execution, blind solve, and ambiguity checks", async () => {
    const result = await verifyGeneratedItem(item(), passingDeps);
    expect(result.item.status).toBe("published");
    expect(result.item.verification.execution?.passed).toBe(true);
    expect(result.item.verification.independent?.passed).toBe(true);
    expect(result.item.verification.ambiguity?.passed).toBe(true);
  });

  it("quarantines disagreement and near duplicates", async () => {
    const disagreement = await verifyGeneratedItem(item(), { ...passingDeps, independentSolve: async () => ({ answer: "120", costUsd: 0 }) });
    expect(disagreement.item.status).toBe("quarantined");
    expect(findNearDuplicate(item({ id: "copy" }), [item()])?.id).toBe("item-1");
    expect(contentSimilarity("sliding window expands right", "sliding window expands the right pointer")).toBeGreaterThan(0.6);
  });

  it("uses independent solve and ambiguity checks for non-executable items", async () => {
    const result = await verifyGeneratedItem(item({ kind: "verbal", verificationProgram: undefined, expectedOutput: undefined }), {
      ...passingDeps,
      execute: async () => { throw new Error("verbal content must not enter the judge"); },
    });
    expect(result.item.status).toBe("published");
    expect(result.item.verification.executionRequired).toBe(false);
    expect(result.item.verification.independent?.passed).toBe(true);
    expect(result.item.verification.ambiguity?.passed).toBe(true);
  });

  it("does not leak a fixed correct-option position", () => {
    const payloads = Array.from({ length: 16 }, (_, index) => questionPayload(item({ id: `generated-${index}` })));
    expect(new Set(payloads.map((payload) => payload.answerIndex)).size).toBeGreaterThan(1);
    expect(payloads.every((payload) => payload.options[payload.answerIndex] === "110")).toBe(true);
  });

  it("returns an auditable batch summary", async () => {
    const result = await runContentBatch({ topic: "Percentages", kind: "quantitative", difficulty: 0.5, count: 2 }, passingDeps, { monthToDateUsd: 0, estimatedCostUsd: 0.1 });
    expect(result).toMatchObject({ published: 2, quarantined: 0 });
    expect(result.costUsd).toBeCloseTo(0.06);
  });
});

describe("self-cleaning content", () => {
  it("retires strong bad-content signals only after failed re-audit", () => {
    expect(shouldRetireContent({ attempts: 20, wrong: 15, reports: 0, optionCounts: [2, 4, 5, 9], reauditPassed: false }).retire).toBe(true);
    expect(shouldRetireContent({ attempts: 20, wrong: 15, reports: 0, optionCounts: [2, 4, 5, 9], reauditPassed: true }).retire).toBe(false);
  });

  it("rebuilds answer distributions and rechecks stored verification", () => {
    expect(optionDistribution([{ selectedIndex: 1 }, { selectedIndex: 0 }, { selectedIndex: 1 }, null])).toEqual([1, 2]);
    expect(storedVerificationPasses(
      { options: ["12", "14"], answerIndex: 1 },
      { reproducedAnswer: "14", independentAnswer: "14" },
    )).toBe(true);
    expect(storedVerificationPasses(
      { options: ["12", "14"], answerIndex: 1 },
      { executionRequired: true, execution: { passed: false }, independent: { passed: true, answer: "14" }, ambiguity: { passed: true, issues: [] } },
    )).toBe(false);
  });
});
