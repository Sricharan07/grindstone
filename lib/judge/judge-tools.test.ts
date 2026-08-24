import { describe, expect, it } from "vitest";
import { buildDockerRunArgs } from "./docker-run";
import { buildProblemHarness, buildScalingHarness, parseScalingOutput } from "./harness";
import { rowsMatch, validateReadOnlySql } from "./sql";
import { buildPythonTraceProgram, tracePython } from "./tracer";
import type { JudgeAdapter } from "./types";

describe("SQL sandbox guard", () => {
  it("accepts a read query and rejects writes, stacked statements, and dangerous functions", () => {
    expect(validateReadOnlySql("select department, count(*) from employees group by department").type).toBe("select");
    expect(() => validateReadOnlySql("delete from employees")).toThrow(/Only SELECT/);
    expect(() => validateReadOnlySql("select 1; select 2")).toThrow(/exactly one/);
    expect(() => validateReadOnlySql("select pg_sleep(2)")).toThrow(/not permitted/);
  });

  it("compares returned rows by columns, order, and normalized values", () => {
    expect(rowsMatch([{ department: "Engineering", hires: 3 }], [{ department: "Engineering", hires: "3" }])).toBe(true);
    expect(rowsMatch([{ department: "Engineering", hires: 3 }], [{ department: "Finance", hires: 3 }])).toBe(false);
  });
});

describe("problem harnesses", () => {
  it("injects hidden tests in all supported languages", () => {
    expect(buildProblemHarness("python", "class Solution: pass", "two-sum")).toContain("len(cases)");
    expect(buildProblemHarness("java", "class Main { int[] twoSum(int[] a,int t){return null;} }", "two-sum")).toContain("public static void main");
    expect(buildProblemHarness("cpp", "class Solution {};", "two-sum")).toContain("int main");
  });

  it("injects executable checks for every planted Python repository", () => {
    expect(buildProblemHarness("python", "def collect_rows(fetch): pass", "pagination-cursor")).toContain("expected IDs 1 and 2");
    expect(buildProblemHarness("python", "class RetryBudget: pass", "retry-budget")).toContain("consecutive failures");
    expect(buildProblemHarness("python", "def event_ids_for_utc_day(events, day): pass", "daily-report")).toContain("tzinfo");
    expect(buildProblemHarness("python", "class Memberships: pass", "membership-cache")).toContain("group cache");
  });

  it("builds and parses scaling evidence", () => {
    expect(buildScalingHarness("python", "class Solution: pass", "two-sum")).toContain("perf_counter_ns");
    expect(parseScalingOutput("200:0.2\n400:0.41\nnoise")).toEqual([{ n: 200, durationMs: 0.2 }, { n: 400, durationMs: 0.41 }]);
  });
});

describe("Docker-run sandbox commands", () => {
  it("keeps the compiler path and executable temp output available", () => {
    const java = buildDockerRunArgs({ language: "java", code: "class Main {}" }, "/tmp/java");
    const cpp = buildDockerRunArgs({ language: "cpp", code: "int main() {}" }, "/tmp/cpp");
    expect(java.slice(-3, -1)).toEqual(["sh", "-c"]);
    expect(cpp.slice(-3, -1)).toEqual(["sh", "-c"]);
    expect(cpp).toContain("/tmp:rw,exec,nosuid,nodev,size=64m");
  });
});

describe("Python tracer", () => {
  it("instruments learner code and separates the trace marker from stdout", async () => {
    expect(buildPythonTraceProgram("x = 1")).toContain("sys.settrace");
    const judge: JudgeAdapter = {
      name: "fixture",
      health: async () => ({ ok: true, adapter: "fixture", detail: "ready", languages: ["python"] }),
      ensureLanguages: async () => undefined,
      run: async () => ({ outcome: "ok", stdout: 'hello\n__GRINDSTONE_TRACE__[{"line":1,"locals":{"x":"1"},"stack":["<module>"]}]', stderr: "", durationMs: 3, exitCode: 0, signal: null }),
    };
    const traced = await tracePython(judge, "x = 1");
    expect(traced.result.stdout).toBe("hello");
    expect(traced.frames[0]).toMatchObject({ line: 1, locals: { x: "1" } });
  });
});
