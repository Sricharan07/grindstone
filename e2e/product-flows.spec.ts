import { expect, test, type Page } from "@playwright/test";
import { activitiesFor, SPRINT_DAYS } from "../lib/curriculum/catalog";
import { createDefaultLearnerState } from "../lib/product/default-state";
import { reduceLearnerState } from "../lib/product/reducer";
import type { LearnerAction, LearnerState } from "../lib/product/types";

function onboardedState() {
  return reduceLearnerState(createDefaultLearnerState("Ada"), {
    type: "onboarding.complete",
    payload: { name: "Ada", language: "python", timezone: "UTC", sessionTime: "20:00", startedAt: "2026-08-24T00:00:00Z" },
  });
}

async function routeState(page: Page, initial: LearnerState) {
  let state = initial;
  await page.route("**/api/state", async (route) => {
    if (route.request().method() === "PATCH") state = reduceLearnerState(state, route.request().postDataJSON() as LearnerAction);
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ state, persistence: "memory" }) });
  });
  await page.addInitScript(() => window.localStorage.clear());
}

async function routeJudge(page: Page) {
  await page.route("**/api/judge", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: { outcome: "ok", stdout: "3/3 tests passed", stderr: "", exitCode: 0, signal: null, durationMs: 8 } }) }));
}

function assessmentResult(mode: "guided" | "independent", passed = true, attemptNumber = mode === "independent" ? 1 : 0) {
  const total = mode === "guided" ? 4 : 8;
  const cases = Array.from({ length: total }, (_, index) => ({
    id: `case-${index}`,
    name: index === total - 1 ? "All-negative input" : `Check ${index + 1}`,
    category: index === total - 1 ? "Initialization" : "Core behavior",
    group: index < 4 ? "correctness" : index < 7 ? "edgeCases" : "efficiency",
    input: index === total - 1 ? "-8,-2,-5" : String(index),
    expected: index === total - 1 ? "-2" : String(index),
    actual: !passed && index === total - 1 ? "0" : index === total - 1 ? "-2" : String(index),
    status: !passed && index === total - 1 ? "failed" : "passed",
    ...(!passed && index === total - 1 ? { errorType: "wrong_answer", error: "Expected -2, but the solution returned 0.", correction: "Start best from the first value." } : { correction: "Keep the invariant." }),
  }));
  const passedCount = passed ? total : total - 1;
  return {
    mode,
    ...(mode === "independent" ? { attemptId: `00000000-0000-4000-8000-00000000000${attemptNumber}` } : {}),
    lessonId: "array-scan",
    language: "python",
    attemptNumber,
    firstSubmission: attemptNumber === 1,
    passed,
    score: passed ? 100 : 90,
    passedCount,
    totalCount: total,
    solveDurationMs: mode === "independent" ? 62_000 : undefined,
    judgeDurationMs: 38,
    outcome: passed ? "passed" : "failed",
    summary: passed ? `${total} of ${total} checks passed.` : `${passedCount} of ${total} checks passed. Open the failed checks below to see exactly what to fix.`,
    remarks: passed ? ["All checks passed."] : ["Review larger inputs: 0 of 1 passed."],
    sections: {
      correctness: { earned: 70, possible: 70, passed: Math.min(4, passedCount), total: 4 },
      edgeCases: { earned: 20, possible: 20, passed: 3, total: 3 },
      efficiency: { earned: passed ? 10 : 0, possible: 10, passed: passed ? 1 : 0, total: 1 },
    },
    cases,
  };
}

async function routeLessonAssessments(page: Page, independentPasses = false) {
  let attemptNumber = 1;
  await page.route("**/api/lesson-assessments", async (route) => {
    const body = route.request().postDataJSON() as { action: string; forceNew?: boolean };
    if (body.action === "guided") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: assessmentResult("guided") }) });
      return;
    }
    if (body.action === "start") {
      if (body.forceNew) attemptNumber++;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ attempt: { id: `00000000-0000-4000-8000-00000000000${attemptNumber}`, lessonId: "array-scan", language: "python", attemptNumber, startedAt: new Date(Date.now() - 1000).toISOString(), expiresAt: new Date(Date.now() + 2_700_000).toISOString(), testCount: 8 } }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: assessmentResult("independent", independentPasses, attemptNumber) }) });
  });
}

test("resumable setup asks only for name, Python or Java, and a daily time", async ({ page }) => {
  await routeState(page, createDefaultLearnerState("Member"));
  await page.goto("/onboarding");
  await expect(page.getByRole("heading", { name: "What should we call you?" })).toBeVisible();
  await page.getByLabel("Display name").fill("Grace");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /Java/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Daily start time").fill("19:30");
  await page.getByRole("button", { name: "Start Day 1" }).click();
  await expect(page.getByText("Day 1 · Week 1 · Learning day")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Choose the structure before the loop" })).toBeVisible();
});

test("Today exposes one next action and four primary destinations", async ({ page }) => {
  await routeState(page, onboardedState());
  await page.goto("/");
  await expect(page.getByText("Your next task")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link")).toHaveCount(4);
  await expect(page.getByText("Today's session")).toBeVisible();
  await expect(page.getByText("150", { exact: false }).first()).toBeVisible();
});

test("curriculum shows every one of the 28 ordered days", async ({ page }) => {
  await routeState(page, onboardedState());
  await page.goto("/curriculum");
  await expect(page.getByRole("heading", { name: "Choose a day. Keep every result." })).toBeVisible();
  await expect(page.locator(".week-band")).toHaveCount(4);
  await expect(page.locator(".week-band li button")).toHaveCount(28);
  await expect(page.getByRole("button", { name: /28 Debrief and continue Turn the sprint into interview evidence/ })).toBeVisible();
});

test("a learner on Day 4 can directly start or revisit Day 1 without losing access", async ({ page }) => {
  const state = onboardedState();
  state.sprint.startedAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  await routeState(page, state);
  await page.goto("/curriculum");

  await expect(page.getByText("4", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Start Day 1: Choose the structure before the loop/ })).toBeVisible();
  await page.getByRole("button", { name: /1 Learn and apply Choose the structure before the loop/ }).click();
  await expect(page).toHaveURL(/\/curriculum\?day=1$/);
  await expect(page.getByRole("heading", { name: "Day 1: Choose the structure before the loop" })).toBeVisible();
  await expect(page.getByText("This day does not expire when the calendar moves on.")).toBeVisible();
  await expect(page.locator(".day-activity-list li")).toHaveCount(6);

  await page.getByRole("link", { name: /Start Day 1/ }).last().click();
  await expect(page).toHaveURL(/\/learn\/array-scan$/);
});

test("completed days remain reviewable while future evidence gates stay locked", async ({ page }) => {
  const state = onboardedState();
  state.sprint.startedAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  state.sprint.completedItems = activitiesFor(SPRINT_DAYS[0]).map((activity) => activity.id);
  await routeState(page, state);
  await page.goto("/curriculum?day=1");

  await expect(page.getByText("Completed. Reopen any activity below without losing your saved evidence.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Review Day 1", exact: true })).toHaveAttribute("href", "/learn/array-scan");
  await page.getByRole("button", { name: /6 Evidence gate Week 1 screening gate/ }).click();
  await expect(page.getByText("This timed gate opens on Day 6.")).toBeVisible();
  await expect(page.getByRole("link", { name: /Start Day 6/ })).toHaveCount(0);
});

test("concept lesson combines explanation, generated art, visualization, video, Luna, and editor", async ({ page }) => {
  await routeState(page, onboardedState());
  await routeLessonAssessments(page);
  await page.goto("/learn/hashmap-two-sum");
  await expect(page.getByRole("heading", { name: "Trade memory for immediate lookup" })).toBeVisible();
  await expect(page.locator(".lesson-image")).toHaveAttribute("data-lesson", "hashmap-two-sum");
  await expect(page.getByRole("complementary", { name: "AI tutor thread" })).toBeVisible();
  await expect(page.locator(".concept-visualizer")).toBeVisible();
  await page.getByRole("button", { name: /Load Two Sum video/ }).click();
  await expect(page.locator("iframe")).toHaveAttribute("src", /youtube-nocookie/);
  await page.getByRole("button", { name: /I understand the idea/ }).click();
  await page.getByLabel("Your prediction and reasoning").fill("Lookup must happen before insertion so the current element cannot pair with itself while earlier duplicates remain valid.");
  await page.getByRole("button", { name: /Commit and open editor/ }).click();
  await page.getByRole("button", { name: /Run 4 learning tests/ }).click();
  await expect(page.getByText("4 of 4 checks passed.")).toBeVisible();
  await expect(page.getByRole("button", { name: /Explain my solution/ })).toBeEnabled();
});

test("Solve Alone times one submission, reveals failed checks, and starts a fresh retry", async ({ page }) => {
  let state = onboardedState();
  state = reduceLearnerState(state, { type: "lesson.save", payload: { lessonId: "array-scan", progress: { stage: "transfer", prediction: "The maximum must start from real input values.", explanation: "I scan once while best remains correct for the prefix already seen." } } });
  await routeState(page, state);
  await routeLessonAssessments(page, false);
  await page.goto("/learn/array-scan");
  await expect(page.getByText("8", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("unseen checks")).toBeVisible();
  await expect(page.getByText(/00:0[0-9]/)).toBeVisible();
  await page.getByRole("button", { name: /Submit for grading/ }).click();
  await expect(page.getByRole("heading", { name: "Your next fixes are clear" })).toBeVisible();
  await expect(page.getByText("Expected -2, but the solution returned 0.")).toBeVisible();
  await expect(page.getByText("Start best from the first value.")).toBeVisible();
  await page.getByRole("button", { name: "Ask Luna about this failure" }).click();
  await expect(page.getByLabel("Ask the AI tutor")).toHaveValue(/All-negative input/);
  await page.getByRole("button", { name: /Retry with a new test set/ }).click();
  await expect(page.getByText("Attempt 2 · Python")).toBeVisible();
  await expect(page.getByRole("button", { name: /Submit for grading/ })).toBeEnabled();
});

test("failed-check feedback stays readable without page overflow on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let state = onboardedState();
  state = reduceLearnerState(state, { type: "lesson.save", payload: { lessonId: "array-scan", progress: { stage: "code", prediction: "The best value must be correct for the scanned prefix." } } });
  await routeState(page, state);
  await routeLessonAssessments(page);
  await page.goto("/learn/array-scan");
  await page.getByRole("button", { name: /Run 4 learning tests/ }).click();
  await expect(page.getByRole("heading", { name: "Ready to move on" })).toBeVisible();
  await expect(page.getByText("4 of 4 checks passed.")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("problem library contains all 150 runnable packages and the scheduled Core 40", async ({ page }) => {
  await routeState(page, onboardedState());
  await routeJudge(page);
  await page.goto("/problems");
  await expect(page.locator(".problem-row")).toHaveCount(2);
  await page.getByRole("button", { name: "All 150" }).click();
  await expect(page.locator(".problem-row")).toHaveCount(150);
  await page.getByRole("button", { name: "Core 40" }).click();
  await expect(page.locator(".problem-row")).toHaveCount(40);
  await page.locator(".problem-row").first().click();
  await expect(page.getByRole("region", { name: "Problem editor" })).toBeVisible();
});

test("aptitude and Evidence Desk activities are usable sessions, not dead links", async ({ page }) => {
  await routeState(page, onboardedState());
  await page.goto("/session/1/aptitude");
  await expect(page.getByRole("heading", { name: "Mixed baseline" })).toBeVisible();
  await expect(page.getByText("Question 1 of 8")).toBeVisible();
  await page.locator(".answer-options button").first().click();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.locator(".answer-explanation")).toBeVisible();

  await page.goto("/session/1/lab");
  await expect(page.getByText("Definition of done")).toBeVisible();
  await expect(page.locator(".lab-checklist label")).toHaveCount(4);
  await page.getByLabel("What changed, what failed, and why?").fill("The health endpoint now reports the application and database state. I ran the focused endpoint test and observed a passing result after the request-path fix.");
  await page.getByLabel("Evidence reference").fill("commit 1a2b3c");
  await expect(page.getByRole("button", { name: /Complete build evidence/ })).toBeDisabled();
});

test("progress refuses to invent a readiness number before evidence exists", async ({ page }) => {
  await routeState(page, onboardedState());
  await page.goto("/progress");
  await expect(page.getByText("Observed performance, not a motivational guess")).toBeVisible();
  await expect(page.getByText("The product is still collecting proof.")).toBeVisible();
  await page.getByRole("button", { name: /Scoreboard/ }).click();
  await expect(page.getByText("The board is hidden.")).toBeVisible();
});

test("legacy destinations redirect into the simpler product", async ({ page }) => {
  await routeState(page, onboardedState());
  await page.goto("/practice");
  await expect(page).toHaveURL(/\/problems$/);
  await page.goto("/mock");
  await expect(page).toHaveURL(/\/curriculum$/);
});
