import { describe, expect, it } from "vitest";
import { auditQuestion, summarizeAudit } from "./audit";

describe("content audit", () => {
  it("quarantines disagreement and duplicate distractors", () => {
    const result = auditQuestion({
      id: "bad",
      answer: "12",
      distractors: ["10", "12", "14"],
      verification: { reproducedAnswer: "11", independentAnswer: "12" },
      status: "generated",
    });
    expect(result.publishable).toBe(false);
    expect(result.reasons).toContain("duplicate-options");
    expect(result.reasons).toContain("execution-disagreement");
  });

  it("catches every item in the 50-question deliberately-wrong fixture", () => {
    const fixture = Array.from({ length: 50 }, (_, index) => ({ id: `bad-${index}`, answer: String(index), distractors: ["x", "y", "z"], verification: { reproducedAnswer: `wrong-${index}`, independentAnswer: String(index) }, status: "generated" as const }));
    const result = summarizeAudit(fixture);
    expect(result).toEqual({ published: 0, quarantined: 50, unverified: 0 });
  });
});
