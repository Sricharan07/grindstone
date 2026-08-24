import "server-only";

import type {
  AssessmentCaseResult,
  AssessmentErrorType,
  AssessmentGroup,
  LessonAssessmentResult,
} from "@/lib/assessment/types";
import type { LearningLanguage, LessonSlug } from "@/lib/learning/catalog";
import type { RunResult } from "@/lib/judge/types";
import type { LessonTestCase } from "./lesson-cases";

const CASE_MARKER = "__GRINDSTONE_CASE__";
const SECTION_POINTS: Record<AssessmentGroup, number> = {
  correctness: 70,
  edgeCases: 20,
  efficiency: 10,
};

function javaMain(code: string, body: string) {
  const close = code.lastIndexOf("}");
  if (close < 0) throw new Error("Java lesson code must contain a Main class.");
  return `${code.slice(0, close)}${body}\n}`;
}

export function buildAssessmentHarness(language: LearningLanguage, code: string, cases: LessonTestCase[]) {
  if (language === "python") {
    const rows = cases.map(({ id, input }) => [id, input]);
    return `${code}\n\n# Grindstone assessment harness\nimport base64 as __gs_b64\n\ndef __gs_encode(value):\n    return __gs_b64.urlsafe_b64encode(str(value).encode("utf-8")).decode("ascii").rstrip("=")\n\ndef __gs_run():\n    cases = ${JSON.stringify(rows)}\n    for case_id, raw in cases:\n        try:\n            actual = str(solve(raw)).strip()\n            print("${CASE_MARKER}" + case_id + "\\t1\\t" + __gs_encode(actual) + "\\t\\t")\n        except BaseException as error:\n            line = ""\n            trace = error.__traceback__\n            while trace:\n                if trace.tb_frame.f_code.co_name == "solve":\n                    line = str(trace.tb_lineno)\n                trace = trace.tb_next\n            print("${CASE_MARKER}" + case_id + "\\t0\\t\\t" + __gs_encode(type(error).__name__ + ": " + str(error)) + "\\t" + line)\n\n__gs_run()`;
  }

  const rows = cases
    .map(({ id, input }) => `{${JSON.stringify(id)}, ${JSON.stringify(input)}}`)
    .join(",");
  return javaMain(code, `
    private static String __gsEncode(String value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }

    public static void main(String[] args) {
        String[][] cases = {${rows}};
        for (String[] test : cases) {
            try {
                String actual = String.valueOf(solve(test[1])).trim();
                System.out.println("${CASE_MARKER}" + test[0] + "\\t1\\t" + __gsEncode(actual) + "\\t\\t");
            } catch (Throwable error) {
                int line = 0;
                for (StackTraceElement frame : error.getStackTrace()) {
                    if (frame.getClassName().equals("Main") && frame.getMethodName().equals("solve")) {
                        line = frame.getLineNumber();
                        break;
                    }
                }
                String message = error.getClass().getSimpleName() + (error.getMessage() == null ? "" : ": " + error.getMessage());
                System.out.println("${CASE_MARKER}" + test[0] + "\\t0\\t\\t" + __gsEncode(message) + "\\t" + (line > 0 ? line : ""));
            }
        }
    }`);
}

function decode(value: string) {
  if (!value) return "";
  try {
    const padding = "=".repeat((4 - value.length % 4) % 4);
    return Buffer.from(value.replaceAll("-", "+").replaceAll("_", "/") + padding, "base64").toString("utf8");
  } catch {
    return "";
  }
}

interface MarkerResult {
  passed: boolean;
  actual: string;
  error: string;
  line?: number;
}

export function parseAssessmentMarkers(stdout: string) {
  const results = new Map<string, MarkerResult>();
  for (const line of stdout.split(/\r?\n/)) {
    if (!line.startsWith(CASE_MARKER)) continue;
    const [id, passed, actual, error, lineNumber] = line.slice(CASE_MARKER.length).split("\t");
    if (!id) continue;
    const parsedLine = Number(lineNumber);
    results.set(id, {
      passed: passed === "1",
      actual: decode(actual ?? ""),
      error: decode(error ?? ""),
      line: Number.isInteger(parsedLine) && parsedLine > 0 ? parsedLine : undefined,
    });
  }
  return results;
}

function firstUsefulLine(value: string) {
  return value.split(/\r?\n/).map((line) => line.trim()).find((line) => line && !line.startsWith("at "))?.slice(0, 500) ?? "";
}

function globalFailure(run: RunResult): { type: AssessmentErrorType; message: string; line?: number } | undefined {
  if (run.outcome === "ok") return undefined;
  const raw = run.outcome === "compile_error" ? run.compileOutput ?? run.stderr : run.stderr || run.compileOutput || run.stdout;
  const javaLine = raw.match(/Main\.java:(\d+)/)?.[1];
  const pythonLine = [...raw.matchAll(/line (\d+)/g)].at(-1)?.[1];
  const line = Number(javaLine ?? pythonLine);
  if (run.outcome === "compile_error") return {
    type: "compile_error",
    message: firstUsefulLine(raw) || "The code could not be compiled. Check the highlighted line and syntax around it.",
    line: Number.isInteger(line) && line > 0 ? line : undefined,
  };
  if (run.outcome === "timeout") return {
    type: "timeout",
    message: "The program did not finish before the time limit. Check for a loop or recursion that does not make progress.",
  };
  return {
    type: "runtime_error",
    message: firstUsefulLine(raw) || "The program stopped before the tests could finish.",
    line: Number.isInteger(line) && line > 0 ? line : undefined,
  };
}

function sectionScores(cases: AssessmentCaseResult[], mode: "guided" | "independent") {
  return Object.fromEntries((Object.keys(SECTION_POINTS) as AssessmentGroup[]).map((group) => {
    const matching = cases.filter((item) => item.group === group);
    const passed = matching.filter((item) => item.status === "passed").length;
    const possible = mode === "independent" ? SECTION_POINTS[group] : Math.round(100 * matching.length / cases.length);
    return [group, { earned: matching.length ? Math.round(possible * passed / matching.length) : 0, possible, passed, total: matching.length }];
  })) as LessonAssessmentResult["sections"];
}

export function createAssessmentResult({
  run,
  cases,
  mode,
  lessonId,
  language,
  attemptId,
  attemptNumber = 0,
  firstSubmission = false,
  solveDurationMs,
}: {
  run: RunResult;
  cases: LessonTestCase[];
  mode: "guided" | "independent";
  lessonId: LessonSlug;
  language: LearningLanguage;
  attemptId?: string;
  attemptNumber?: number;
  firstSubmission?: boolean;
  solveDurationMs?: number;
}): LessonAssessmentResult {
  const markers = parseAssessmentMarkers(run.stdout);
  const failure = globalFailure(run);
  const caseResults: AssessmentCaseResult[] = cases.map((test) => {
    const marker = markers.get(test.id);
    if (failure) return {
      ...test,
      actual: "Not run",
      status: "not_run",
      errorType: failure.type,
      error: failure.message,
      line: failure.line,
    };
    if (!marker) return {
      ...test,
      actual: "Not run",
      status: "not_run",
      errorType: "internal_error",
      error: "The runner did not return a result for this check. Your submission was not counted as a pass.",
    };
    if (marker.passed && marker.actual.trim().toLowerCase() === test.expected.trim().toLowerCase()) {
      return { ...test, actual: marker.actual, status: "passed" };
    }
    return {
      ...test,
      actual: marker.actual || "No value returned",
      status: "failed",
      errorType: marker.error ? "runtime_error" : "wrong_answer",
      error: marker.error || `Expected ${test.expected}, but the solution returned ${marker.actual || "nothing"}.`,
      line: marker.line,
    };
  });
  const passedCount = caseResults.filter((item) => item.status === "passed").length;
  const sections = sectionScores(caseResults, mode);
  const score = Object.values(sections).reduce((total, section) => total + section.earned, 0);
  const passed = passedCount === cases.length && cases.length > 0;
  const hasRuntimeError = caseResults.some((item) => item.errorType === "runtime_error");
  const hasInternalError = caseResults.some((item) => item.errorType === "internal_error");
  const outcome = failure?.type === "compile_error" ? "compile_error"
    : failure?.type === "timeout" ? "timeout"
      : failure?.type === "runtime_error" || hasRuntimeError ? "runtime_error"
        : failure?.type === "internal_error" || hasInternalError ? "internal_error"
          : passed ? "passed" : "failed";
  const failedGroups = (Object.keys(sections) as AssessmentGroup[]).filter((group) => sections[group].passed < sections[group].total);
  const labels: Record<AssessmentGroup, string> = { correctness: "core logic", edgeCases: "edge cases", efficiency: "larger inputs" };
  const remarks = passed
    ? [mode === "independent" ? "All unseen checks passed without help." : "The implementation handles every learning check." ]
    : failedGroups.map((group) => `Review ${labels[group]}: ${sections[group].passed} of ${sections[group].total} passed.`);
  return {
    mode,
    attemptId,
    lessonId,
    language,
    attemptNumber,
    firstSubmission,
    passed,
    score,
    passedCount,
    totalCount: cases.length,
    solveDurationMs,
    judgeDurationMs: run.durationMs,
    outcome,
    summary: passed ? `${passedCount} of ${cases.length} checks passed.` : `${passedCount} of ${cases.length} checks passed. Open the failed checks below to see exactly what to fix.`,
    remarks,
    sections,
    cases: caseResults,
  };
}
