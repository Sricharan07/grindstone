import { describe, expect, it } from "vitest";
import { gradeResponse } from "./response-rubric";

describe("response evidence rubrics", () => {
  it("does not award a behavioral pass for length without evidence", () => {
    const response = "We worked on a project and things happened over several weeks. ".repeat(12);
    const grade = gradeResponse("behavioral", response);
    expect(grade.score).toBeLessThan(50);
    expect(grade.feedback).toContain("personal ownership");
    expect(grade.feedback).toContain("measured result");
  });

  it("finds explicit ownership, action, measurement, failure, and reflection", () => {
    const response = "I missed the launch because I accepted a risky dependency. I built a retry queue, tested the rollback, and reduced failed requests by 41 percent. I learned to test that failure mode earlier, and next time I would run the rollback drill before launch.";
    const grade = gradeResponse("behavioral", response);
    expect(grade.score).toBeGreaterThanOrEqual(90);
    expect(grade.feedback).toEqual([]);
  });

  it("requires the AI-fluency answer to identify containment and prove it", () => {
    const weak = gradeResponse("ai_fluency", "Please implement merge ranges with tests and complexity. The answer seems wrong.");
    const strong = gradeResponse("ai_fluency", "Preserve the input and state the complexity. Add adversarial tests. The max endpoint must remain larger when a nested interval is contained: [(1, 10), (2, 3)] should return [(1, 10)].");
    expect(strong.score).toBeGreaterThan(weak.score);
    expect(strong.feedback).toEqual([]);
  });

  it("grades LLD contracts, ownership, invariants, concurrency, and tests separately", () => {
    const grade = gradeResponse("lld", "The API method returns a ticket ID. The service owns the queue invariant and rejects an invalid transition with an error. A lock prevents a concurrent race. Tests assert the happy path, edge case, and a new requirement.");
    expect(grade.feedback).toEqual([]);
    expect(grade.score).toBeGreaterThanOrEqual(90);
  });

  it("requires a teach-back to explain references, mutation, assignment, and copying", () => {
    const grade = gradeResponse("teach_back", "Assignment copies the reference, so both names point at the same list object. Append mutates that shared list in place. Calling .copy() creates an independent list.");
    expect(grade.feedback).toEqual([]);
    expect(grade.score).toBeGreaterThanOrEqual(90);
  });
});
