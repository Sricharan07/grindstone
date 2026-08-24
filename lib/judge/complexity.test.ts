import { describe, expect, it } from "vitest";
import { inferComplexity, meetsComplexityBar } from "./complexity";

const sizes = [200, 400, 800, 1600, 3200];

describe("complexity inference", () => {
  it("separates linear, n log n, and quadratic timings", () => {
    expect(inferComplexity(sizes.map((n) => ({ n, durationMs: n * 0.04 + 2 }))).complexity).toBe("O(n)");
    expect(inferComplexity(sizes.map((n) => ({ n, durationMs: n * Math.log2(n) * 0.004 + 2 }))).complexity).toBe("O(n log n)");
    expect(inferComplexity(sizes.map((n) => ({ n, durationMs: n * n * 0.00002 + 2 }))).complexity).toBe("O(n²)");
  });

  it("fails a confidently suboptimal solve without blocking low-confidence evidence", () => {
    expect(meetsComplexityBar({ complexity: "O(n²)", confidence: 0.92 }, "O(n)")).toBe(false);
    expect(meetsComplexityBar({ complexity: "O(n log n)", confidence: 0.91 }, "O(n log n)")).toBe(true);
    expect(meetsComplexityBar({ complexity: "O(n²)", confidence: 0.4 }, "O(n)")).toBe(true);
    expect(meetsComplexityBar(undefined, "O(n)")).toBe(true);
  });
});
