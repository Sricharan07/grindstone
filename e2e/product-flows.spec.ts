import { expect, test, type Page } from "@playwright/test";
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
  await expect(page.getByRole("heading", { name: "Know what you are learning, building, and proving." })).toBeVisible();
  await expect(page.locator(".week-band")).toHaveCount(4);
  await expect(page.locator(".week-band li button")).toHaveCount(28);
  await expect(page.getByRole("button", { name: /28 Debrief and continue Turn the sprint into interview evidence/ })).toBeVisible();
});

test("concept lesson combines explanation, generated art, visualization, video, Luna, and editor", async ({ page }) => {
  await routeState(page, onboardedState());
  await routeJudge(page);
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
  await page.getByRole("button", { name: /Run hidden tests/ }).click();
  await expect(page.getByText("3/3 tests passed")).toBeVisible();
  await expect(page.getByRole("button", { name: /Explain my solution/ })).toBeEnabled();
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
