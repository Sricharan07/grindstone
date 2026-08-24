import { expect, test, type Page } from "@playwright/test";
import { createDefaultLearnerState } from "../lib/product/default-state";
import { reduceLearnerState } from "../lib/product/reducer";
import type { LearnerAction } from "../lib/product/types";

const bank = Array.from({ length: 8 }, (_, index) => ({
  id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  topic: index % 2 ? "Reasoning" : "Quantitative aptitude",
  prompt: `Verified gate question ${index + 1}`,
  difficulty: 0.4,
  options: ["Correct", "Distractor one", "Distractor two", "Distractor three"],
  targetSeconds: 45,
}));

async function routeQuestionBank(page: Page, correct: boolean) {
  await page.route("**/api/questions?*", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ questions: bank }) }));
  await page.route("**/api/questions/grade", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ correct, answerIndex: 0, explanation: "Verified by the server-side answer key." }) }));
}

async function routeJudge(page: Page) {
  await page.route("**/api/judge", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: { outcome: "ok", stdout: "4/4 tests passed", stderr: "", exitCode: 0, signal: null, durationMs: 8 }, complexity: { complexity: "O(n)", confidence: 0.94 } }) }));
}

test.beforeEach(async ({ page }) => {
  let state = createDefaultLearnerState("E2E member");
  await page.route("**/api/state", async (route) => {
    if (route.request().method() === "PATCH") state = reduceLearnerState(state, route.request().postDataJSON() as LearnerAction);
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ state, persistence: "memory" }) });
  });
  await page.addInitScript(() => window.localStorage.clear());
});

test("JSON APIs reject malformed requests without server errors", async ({ request }) => {
  const endpoints = [
    { method: "POST", url: "/api/coach" },
    { method: "POST", url: "/api/content/reports" },
    { method: "POST", url: "/api/questions/grade" },
    { method: "POST", url: "/api/responses/grade" },
    { method: "POST", url: "/api/sql" },
    { method: "PATCH", url: "/api/state" },
  ];

  for (const endpoint of endpoints) {
    const response = await request.fetch(endpoint.url, {
      method: endpoint.method,
      headers: { "content-type": "application/json" },
      data: "{",
    });
    expect(response.status(), endpoint.url).toBe(400);
    await expect(response.json()).resolves.toHaveProperty("error");
  }
});

test("PRIMM preserves a wrong prediction through live reconciliation", async ({ page }) => {
  await page.goto("/learn");
  await page.getByLabel("What prints, and why?").fill("It prints [72, 81] because backup is a separate list.");
  await page.getByRole("button", { name: "Commit prediction" }).click();
  await page.getByRole("button", { name: "Run code" }).click();
  await expect(page.getByRole("heading", { name: "Step through the notional machine" })).toBeVisible();
  await expect(page.getByText("It prints [72, 81] because backup is a separate list.")).toBeVisible();
  await page.getByRole("button", { name: "Next execution step" }).click();
  await page.getByRole("button", { name: "Next execution step" }).click();
  await expect(page.getByRole("button", { name: /Reconcile the gap/ })).toBeEnabled();
});

test("timed drive expires the current section without an answer", async ({ page }) => {
  await routeQuestionBank(page, true);
  await page.goto("/drive");
  await page.getByRole("button", { name: "Run one-item rehearsal" }).click();
  await expect(page.getByTestId("drive-timer")).toContainText("00:03");
  await expect(page.getByText("Section 2/5")).toBeVisible({ timeout: 7_000 });
});

test("Parsons exercise supports a complete corrected ordering", async ({ page }) => {
  await page.goto("/learn");
  await page.getByRole("button", { name: "Remove line 4" }).click();
  await page.getByRole("button", { name: "Move line 2 up" }).click();
  await page.getByRole("button", { name: "Move line 4 up" }).click();
  await page.getByRole("button", { name: "Move line 6 up" }).click();
  await page.getByRole("button", { name: "Check order" }).click();
  await expect(page.getByText("Structure is correct.")).toBeVisible();
});

test("solve loop requires an approach and opens the automatic follow-up", async ({ page }) => {
  await routeJudge(page);
  await page.goto("/solve");
  await expect(page.getByRole("button", { name: /Submit/ })).toBeDisabled();
  await page.getByLabel("Approach before code").fill("Scan once, check the complement, then store each value and index.");
  await page.getByRole("button", { name: "70%" }).click();
  await page.getByRole("button", { name: /Submit/ }).click();
  await expect(page.getByRole("complementary", { name: "Submission feedback" })).toBeVisible();
  await page.getByRole("button", { name: /Start follow-up/ }).click();
  await expect(page.getByRole("heading", { name: "Two Sum: streaming follow-up" })).toBeVisible();
});

test("failed Friday gate produces an explicit lower-load recalibration", async ({ page }) => {
  await routeQuestionBank(page, false);
  await page.goto("/sprint-review");
  await page.getByRole("button", { name: "Friday gate" }).click();
  await page.getByRole("button", { name: /Start gate/ }).click();
  for (let index = 0; index < 8; index += 1) {
    await page.locator(".gate-options button").nth(3).click();
    await page.getByRole("button", { name: index === 7 ? /Grade gate/ : /Lock answer/ }).click();
  }
  await expect(page.getByRole("heading", { name: "Gate missed. The plan has recalibrated." })).toBeVisible();
  await expect(page.getByText("New material budget")).toBeVisible();
});

test("full drive rehearsal reaches a scored result across every section", async ({ page }) => {
  await routeQuestionBank(page, true);
  await routeJudge(page);
  await page.route("**/api/responses/grade", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ score: 84, dimensions: [], feedback: [] }) }));
  await page.goto("/drive");
  await page.getByRole("button", { name: "Run one-item rehearsal" }).click();
  for (let section = 0; section < 5; section += 1) {
    await expect(page.getByText(`Section ${section + 1}/5`)).toBeVisible();
    const options = page.locator(".drive-options button");
    const textarea = page.locator(".drive-session textarea");
    if (await options.count()) await options.first().click();
    if (await textarea.count()) await textarea.fill("I owned the failure, changed the review process, and reduced repeat incidents by forty percent.");
    await page.getByRole("button", { name: section === 4 ? /Finish drive/ : /Lock answer/ }).click();
    if (section < 4) await expect(page.getByText(`Section ${section + 2}/5`)).toBeVisible();
  }
  await expect(page.getByText("TCS NQT complete")).toBeVisible();
  await expect(page.getByRole("button", { name: "Return to drive packs" })).toBeVisible();
});

test("codebase lab exposes and grades every planted repository", async ({ page }) => {
  await routeJudge(page);
  await page.goto("/lab");
  await page.getByRole("tab", { name: "Codebase round" }).click();
  const fixture = page.getByLabel("Repository fixture");
  await expect(fixture.locator("option")).toHaveCount(5);
  await fixture.selectOption({ label: "Cache invalidation preserves stale membership" });
  await page.getByLabel("Committed hypothesis").fill("The remove path invalidates the user key but leaves the group membership index cached.");
  await page.getByRole("button", { name: "Run repository tests" }).click();
  await expect(page.getByText("Every repository test passes.")).toBeVisible();
});

test("practice uses an adaptive queue and records calibrated recognition evidence", async ({ page }) => {
  let questionRequest = "";
  page.on("request", (request) => {
    if (request.url().includes("/api/questions?")) questionRequest = request.url();
  });
  await routeQuestionBank(page, true);
  await page.goto("/practice");
  await expect(page.getByText("Verified gate question 1")).toBeVisible();
  expect(new URL(questionRequest).searchParams.get("topic")).toBe("Percentages");
  expect(new URL(questionRequest).searchParams.get("targetDifficulty")).toBe("0.43");
  await page.getByRole("button", { name: "Correct" }).click();
  await page.getByRole("button", { name: "70%" }).click();
  await page.getByRole("button", { name: /Check answer/ }).click();
  await expect(page.getByText("Correct, with evidence.")).toBeVisible();
  await page.getByRole("tab", { name: "Patterns" }).click();
  await page.getByRole("button", { name: "Variable sliding window" }).click();
  await page.getByRole("button", { name: "Commit pattern" }).click();
  await expect(page.getByText("Correct discrimination.")).toBeVisible();
  await expect(page.getByText("2 attempts recorded")).toBeVisible();
});

test("practice keeps failed reports retryable and identifies coding queue outages", async ({ page }) => {
  await routeQuestionBank(page, true);
  await page.route("**/api/content/reports", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Reporting service unavailable" }) }));
  await page.route("**/api/problems", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Coding corpus unavailable" }) }));
  await page.goto("/practice");
  await expect(page.getByText("Verified gate question 1")).toBeVisible();
  await page.getByRole("button", { name: "Report item" }).click();
  await expect(page.getByText("Reporting service unavailable")).toBeVisible();
  await expect(page.getByRole("button", { name: "Report item" })).toBeEnabled();
  await page.getByRole("tab", { name: "Patterns" }).click();
  await expect(page.getByText("Coding corpus unavailable")).toBeVisible();
});

test("grading outages leave AI and discussion submissions retryable", async ({ page }) => {
  await page.route("**/api/responses/grade", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Grading service unavailable" }) }));

  await page.goto("/lab");
  await page.getByRole("tab", { name: "AI fluency" }).click();
  await page.getByLabel("Your original prompt").fill("Merge every overlapping range without mutating the caller input and include adversarial tests.");
  await page.getByLabel("What is wrong?").fill("A contained interval can shrink the merged range because the code overwrites the prior end.");
  await page.getByLabel("Adversarial test", { exact: true }).fill("[(1, 10), (2, 3)] should return [(1, 10)]");
  await page.getByRole("button", { name: "Submit verification" }).click();
  await expect(page.getByText("Grading service unavailable")).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit verification" })).toBeEnabled();

  await page.goto("/hr");
  await page.getByRole("tab", { name: "Group discussion" }).click();
  await page.getByPlaceholder("Capture your opening and synthesis...").fill("I would frame the tradeoff, cite evidence, acknowledge the counterpoint, and invite another view.");
  await page.getByRole("button", { name: "Start two-minute rehearsal" }).click();
  await page.getByRole("button", { name: "Finish and grade" }).click();
  await expect(page.getByText("Grading service unavailable")).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry grading" })).toBeEnabled();
});
