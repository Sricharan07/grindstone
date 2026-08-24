import { describe, expect, it } from "vitest";
import { aptitudeSet, buildAptitudeItem } from "./catalog";

describe("aptitude catalog", () => {
  it("builds eight deterministic, gradeable questions for all 28 days", () => {
    for (let day = 1; day <= 28; day += 1) {
      const questions = aptitudeSet(day);
      expect(questions).toHaveLength(8);
      expect(new Set(questions.map((question) => question.id)).size).toBe(8);
      expect(new Set(questions.map((question) => question.prompt)).size).toBe(8);
      for (const question of questions) {
        expect(question.options.length).toBeGreaterThanOrEqual(3);
        expect(question.options[question.answerIndex]).toBeTruthy();
        expect(question.explanation.length).toBeGreaterThan(20);
      }
    }
  });

  it("matches focused curriculum days instead of serving unrelated questions", () => {
    expect(aptitudeSet(2).every((question) => question.topic === "Percentages")).toBe(true);
    expect(aptitudeSet(9).every((question) => question.topic.includes("syllogisms"))).toBe(true);
    expect(aptitudeSet(17).every((question) => question.topic === "Reading comprehension")).toBe(true);
    expect(aptitudeSet(24).every((question) => question.topic === "Verbal ability")).toBe(true);
    expect(buildAptitudeItem(16, 0).topic).toBe("Data sufficiency");
  });
});
