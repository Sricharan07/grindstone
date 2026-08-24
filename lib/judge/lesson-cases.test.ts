import { describe, expect, it } from "vitest";
import { LEARNING_LESSONS, LESSON_SLUGS } from "@/lib/learning/catalog";
import { guidedLessonCases, independentLessonPool, selectIndependentCases, solveLessonReference } from "./lesson-cases";

describe("lesson assessment case bank", () => {
  it("covers every lesson with separate guided and independent inputs", () => {
    for (const slug of LESSON_SLUGS) {
      const guided = guidedLessonCases(slug);
      const independent = independentLessonPool(slug);
      expect(guided, slug).toHaveLength(4);
      expect(independent, slug).toHaveLength(12);
      expect(new Set(guided.map((item) => item.input)).size, slug).toBe(guided.length);
      expect(new Set(independent.map((item) => item.input)).size, slug).toBe(independent.length);
      const guidedInputs = new Set(guided.map((item) => item.input));
      expect(independent.some((item) => guidedInputs.has(item.input)), slug).toBe(false);
      expect([...guided, ...independent].every((item) => item.id && item.name && item.category && item.correction && item.expected !== undefined), slug).toBe(true);
    }
  });

  it("selects a deterministic eight-check assessment with weighted coverage", () => {
    for (const slug of LESSON_SLUGS) {
      const first = selectIndependentCases(slug, "same-seed");
      const second = selectIndependentCases(slug, "same-seed");
      expect(first.map((item) => item.id), slug).toEqual(second.map((item) => item.id));
      expect(first, slug).toHaveLength(8);
      expect(first.filter((item) => item.group === "correctness"), slug).toHaveLength(4);
      expect(first.filter((item) => item.group === "edgeCases"), slug).toHaveLength(3);
      expect(first.filter((item) => item.group === "efficiency"), slug).toHaveLength(1);
    }
  });

  it("keeps the trusted reference solver aligned with every visible example", () => {
    for (const lesson of LEARNING_LESSONS) {
      for (const example of lesson.visibleCases) {
        expect(solveLessonReference(lesson.slug, example.input), `${lesson.slug}: ${example.input}`).toBe(example.output);
      }
    }
  });
});
