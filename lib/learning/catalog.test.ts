import { describe, expect, it } from "vitest";
import { SPRINT_DAYS } from "@/lib/curriculum/catalog";
import { LEARNING_LANGUAGES, LEARNING_LESSONS, LESSON_SLUGS, starterFor } from "./catalog";

describe("learning catalog", () => {
  it("provides one complete concept package for each learning day", () => {
    const scheduled = SPRINT_DAYS.flatMap((day) => day.lessonSlug ? [day.lessonSlug] : []);
    expect(scheduled).toEqual([...LESSON_SLUGS]);
    expect(LEARNING_LESSONS).toHaveLength(20);
    for (const lesson of LEARNING_LESSONS) {
      expect(lesson.steps).toHaveLength(4);
      expect(lesson.hints).toHaveLength(4);
      expect(lesson.visibleCases.length).toBeGreaterThanOrEqual(2);
      expect(lesson.video.youtubeId).toMatch(/^[A-Za-z0-9_-]{11}$/);
      expect(lesson.visualAlt.length).toBeGreaterThan(30);
      expect(JSON.stringify(lesson).toLowerCase()).not.toContain("placeholder");
    }
  });

  it("ships valid starter code for Python and Java from day one", () => {
    expect(LEARNING_LANGUAGES).toEqual(["python", "java"]);
    for (const slug of LESSON_SLUGS) {
      expect(starterFor("python", slug)).toContain("def solve(raw: str)");
      expect(starterFor("java", slug)).toContain("static String solve(String input)");
    }
  });
});
