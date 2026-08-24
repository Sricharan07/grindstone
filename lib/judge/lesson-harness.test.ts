import { describe, expect, it } from "vitest";
import { buildLessonHarness, isLessonId } from "./lesson-harness";

describe("lesson harness", () => {
  it("wraps the same solve contract for all supported languages", () => {
    const python = buildLessonHarness("python", "def solve(raw):\n    return '7'", "array-scan");
    const java = buildLessonHarness("java", "public class Main { static String solve(String input) { return \"7\"; } }", "array-scan");
    const cpp = buildLessonHarness("cpp", "#include <bits/stdc++.h>\nusing namespace std; class Solution { public: string solve(string input) { return \"7\"; } };", "array-scan");
    expect(python).toContain("__grindstone_check");
    expect(java).toContain("public static void main");
    expect(cpp).toContain("int main()");
  });

  it("rejects unknown lesson identifiers", () => {
    expect(isLessonId("hashmap-two-sum")).toBe(true);
    expect(isLessonId("placeholder-lesson")).toBe(false);
  });
});
