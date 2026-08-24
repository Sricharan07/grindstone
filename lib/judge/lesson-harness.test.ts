import { describe, expect, it } from "vitest";
import { LESSON_SLUGS } from "@/lib/learning/catalog";
import { buildLessonHarness, isLessonSlug, lessonCases } from "./lesson-harness";

describe("lesson harness", () => {
  it("wraps the solve contract for both product languages", () => {
    const python = buildLessonHarness("python", "def solve(raw):\n    return '7'", "array-scan");
    const java = buildLessonHarness("java", "public class Main { static String solve(String input) { return \"7\"; } }", "array-scan");
    expect(python).toContain("__grindstone_check");
    expect(java).toContain("public static void main");
  });

  it("ships hidden cases for every lesson and rejects unknown slugs", () => {
    expect(LESSON_SLUGS.every((slug) => lessonCases(slug).length >= 3)).toBe(true);
    expect(isLessonSlug("hashmap-two-sum")).toBe(true);
    expect(isLessonSlug("placeholder-lesson")).toBe(false);
  });
});
