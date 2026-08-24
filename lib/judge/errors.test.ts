import { describe, expect, it } from "vitest";
import { publicJudgeError } from "./errors";

describe("public judge errors", () => {
  it("turns transport failures into a useful learner-facing message", () => {
    expect(publicJudgeError(new TypeError("fetch failed"))).toBe(
      "Code execution is temporarily unavailable. Please retry in a moment.",
    );
    expect(publicJudgeError(new Error("Cannot connect to the Docker daemon"))).toBe(
      "Code execution is temporarily unavailable. Please retry in a moment.",
    );
  });

  it("preserves specific execution errors and supplies a fallback", () => {
    expect(publicJudgeError(new Error("Runtime package is missing"))).toBe("Runtime package is missing");
    expect(publicJudgeError(undefined, "Trace failed")).toBe("Trace failed");
  });
});
