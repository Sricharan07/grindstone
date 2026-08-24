import { describe, expect, it } from "vitest";
import type { RunResult } from "./types";
import type { LessonTestCase } from "./lesson-cases";
import { buildAssessmentHarness, createAssessmentResult, parseAssessmentMarkers } from "./assessment-harness";

function encode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function run(overrides: Partial<RunResult> = {}): RunResult {
  return { outcome: "ok", stdout: "", stderr: "", exitCode: 0, signal: null, durationMs: 34, ...overrides };
}

const cases: LessonTestCase[] = [
  ...Array.from({ length: 4 }, (_, index) => ({ id: `c${index}`, name: `Core ${index}`, category: "Core", group: "correctness" as const, input: String(index), expected: String(index), correction: "Fix the core loop." })),
  ...Array.from({ length: 3 }, (_, index) => ({ id: `e${index}`, name: `Edge ${index}`, category: "Edge", group: "edgeCases" as const, input: String(index), expected: String(index), correction: "Handle the boundary." })),
  { id: "f0", name: "Scale", category: "Larger input", group: "efficiency" as const, input: "large", expected: "ok", correction: "Keep one pass." },
];

describe("assessment harness", () => {
  it("wraps both supported languages with per-case result markers", () => {
    const python = buildAssessmentHarness("python", "def solve(raw):\n    return raw", cases);
    const java = buildAssessmentHarness("java", "import java.util.*; public class Main { static String solve(String raw) { return raw; } }", cases);
    expect(python).toContain("__GRINDSTONE_CASE__");
    expect(python).toContain("except BaseException");
    expect(java).toContain("catch (Throwable error)");
    expect(java).toContain("public static void main");
    const secretExpected = buildAssessmentHarness("python", "def solve(raw):\n    return raw", [{ ...cases[0], expected: "server-only-answer" }]);
    expect(secretExpected).not.toContain("server-only-answer");
  });

  it("decodes passed, wrong-answer, and runtime markers", () => {
    const stdout = [
      `__GRINDSTONE_CASE__c0\t1\t${encode("0")}\t\t`,
      `__GRINDSTONE_CASE__c1\t0\t${encode("9")}\t\t`,
      `__GRINDSTONE_CASE__c2\t0\t\t${encode("ValueError: bad value")}\t7`,
    ].join("\n");
    const parsed = parseAssessmentMarkers(stdout);
    expect(parsed.get("c0")).toMatchObject({ passed: true, actual: "0" });
    expect(parsed.get("c1")).toMatchObject({ passed: false, actual: "9", error: "" });
    expect(parsed.get("c2")).toMatchObject({ passed: false, error: "ValueError: bad value", line: 7 });
  });

  it("scores all sections deterministically and requires every case to pass", () => {
    const stdout = cases.map((test, index) => `__GRINDSTONE_CASE__${test.id}\t${index < 3 ? "1" : "0"}\t${encode(index < 3 ? test.expected : "wrong")}\t\t`).join("\n");
    const result = createAssessmentResult({ run: run({ stdout }), cases, mode: "independent", lessonId: "array-scan", language: "python", attemptNumber: 1, firstSubmission: true });
    expect(result.passed).toBe(false);
    expect(result.passedCount).toBe(3);
    expect(result.score).toBe(53);
    expect(result.sections.correctness).toEqual({ earned: 53, possible: 70, passed: 3, total: 4 });
    expect(result.cases[3]).toMatchObject({ status: "failed", errorType: "wrong_answer", actual: "wrong" });
  });

  it("compares actual output with the trusted answer on the server", () => {
    const stdout = cases.map((test) => `__GRINDSTONE_CASE__${test.id}\t1\t${encode("forged")}\t\t`).join("\n");
    const result = createAssessmentResult({ run: run({ stdout }), cases, mode: "independent", lessonId: "array-scan", language: "python" });
    expect(result.passed).toBe(false);
    expect(result.cases.every((item) => item.errorType === "wrong_answer")).toBe(true);
  });

  it("turns compile errors and timeouts into useful per-check feedback", () => {
    const compile = createAssessmentResult({
      run: run({ outcome: "compile_error", compileOutput: "Main.java:7: error: ';' expected", exitCode: 1 }),
      cases,
      mode: "guided",
      lessonId: "array-scan",
      language: "java",
    });
    expect(compile.outcome).toBe("compile_error");
    expect(compile.cases[0]).toMatchObject({ status: "not_run", errorType: "compile_error", line: 7 });

    const timeout = createAssessmentResult({ run: run({ outcome: "timeout", stderr: "", exitCode: null }), cases, mode: "guided", lessonId: "array-scan", language: "python" });
    expect(timeout.outcome).toBe("timeout");
    expect(timeout.cases.every((item) => item.errorType === "timeout")).toBe(true);
  });
});
