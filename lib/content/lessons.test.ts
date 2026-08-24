import { describe, expect, it } from "vitest";
import { CURRICULUM, LESSONS, LESSON_IDS, lessonById, starterFor } from "./lessons";

describe("four-week curriculum", () => {
  it("contains six ordered sessions per week and twelve executable lessons", () => {
    expect(CURRICULUM).toHaveLength(24);
    for (const week of [1, 2, 3, 4]) {
      const sessions = CURRICULUM.filter((session) => session.week === week);
      expect(sessions).toHaveLength(6);
      expect(sessions.map((session) => session.order)).toEqual([1, 2, 3, 4, 5, 6]);
    }
    expect(LESSONS).toHaveLength(12);
    expect(new Set(LESSONS.map((lesson) => lesson.id)).size).toBe(LESSON_IDS.length);
  });

  it("supports every lesson in Python, Java, and C++ from day one", () => {
    for (const lesson of LESSONS) {
      expect(lesson.workedExample.python.length).toBeGreaterThan(5);
      expect(lesson.workedExample.java.length).toBeGreaterThan(5);
      expect(lesson.workedExample.cpp.length).toBeGreaterThan(5);
      expect(lesson.visibleCases.length).toBeGreaterThanOrEqual(2);
      expect(lesson.hints).toHaveLength(4);
    }
    expect(starterFor("python")).toContain("def solve");
    expect(starterFor("java")).toContain("class Main");
    expect(starterFor("cpp")).toContain("class Solution");
    expect(lessonById("not-real").id).toBe(LESSON_IDS[0]);
  });

  it("does not force numeric parsing for text and graph inputs", () => {
    for (const language of ["python", "java", "cpp"] as const) {
      expect(starterFor(language, "stack-matching")).not.toMatch(/values\s*=\s*numbers/);
      expect(starterFor(language, "graph-components")).not.toMatch(/values\s*=\s*numbers/);
      expect(starterFor(language, "hashmap-two-sum")).toMatch(/values\s*=\s*numbers/);
    }
  });
});
