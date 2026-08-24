import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { pythonCodebaseFixtures } from "./codebase-fixtures";

describe("codebase round repositories", () => {
  it("ships every repository, implementation, regression test, and brief named in the catalog", async () => {
    expect(new Set(pythonCodebaseFixtures.map((item) => item.repositoryFixture)).size).toBe(pythonCodebaseFixtures.length);
    for (const item of pythonCodebaseFixtures) {
      const directory = resolve(item.repositoryFixture);
      const moduleName = item.repositoryFixture.split("/").at(-1);
      const implementation = moduleName === "pagination_cursor" ? "pagination.py" : moduleName === "daily_report" ? "daily_report.py" : moduleName === "membership_cache" ? "membership.py" : `${moduleName}.py`;
      const testName = moduleName === "pagination_cursor" ? "test_pagination.py" : moduleName === "membership_cache" ? "test_membership.py" : `test_${moduleName}.py`;
      await expect(access(resolve(directory, "README.md"))).resolves.toBeUndefined();
      await expect(access(resolve(directory, implementation))).resolves.toBeUndefined();
      await expect(access(resolve(directory, testName))).resolves.toBeUndefined();
    }
  });
});
