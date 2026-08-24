import { describe, expect, it } from "vitest";
import { LESSON_SLUGS } from "@/lib/learning/catalog";
import { PROBLEM_LIBRARY } from "./catalog";

describe("problem library", () => {
  it("ships exactly 150 runnable problem packages", () => {
    expect(PROBLEM_LIBRARY).toHaveLength(150);
    expect(new Set(PROBLEM_LIBRARY.map((problem) => problem.slug)).size).toBe(150);
    expect(new Set(PROBLEM_LIBRARY.map((problem) => problem.title)).size).toBe(150);
    expect(new Set(PROBLEM_LIBRARY.map((problem) => problem.prompt)).size).toBe(150);
    expect(PROBLEM_LIBRARY.filter((problem) => problem.core)).toHaveLength(40);
    expect(PROBLEM_LIBRARY.filter((problem) => problem.core && problem.difficulty === "Easy")).toHaveLength(14);
    expect(PROBLEM_LIBRARY.filter((problem) => problem.core && problem.difficulty === "Medium")).toHaveLength(25);
    expect(PROBLEM_LIBRARY.filter((problem) => problem.core && problem.difficulty === "Hard")).toHaveLength(1);
  });

  it("maps every problem to a complete lesson harness", () => {
    expect(PROBLEM_LIBRARY.every((problem) => LESSON_SLUGS.includes(problem.lessonSlug))).toBe(true);
    expect(PROBLEM_LIBRARY.every((problem) => problem.prompt && problem.inputFormat && problem.examples.length >= 2)).toBe(true);
  });
});
