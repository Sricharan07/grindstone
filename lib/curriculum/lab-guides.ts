import { sprintDay } from "./catalog";

const dayChecks: Record<number, [string, string]> = {
  1: ["The app starts from a documented command and the health endpoint returns a useful status.", "The request path from browser to server to database is written in your own words."],
  2: ["The notes API contract includes one valid and one invalid request example.", "Every response shape and status code is explicit."],
  3: ["Users, notes, tags, and ownership constraints appear in the schema.", "Create, filter, and join queries run against real sample data."],
  4: ["Create, read, update, and delete all work through the public API.", "Invalid input returns one stable, field-specific error shape."],
  5: ["The seeded request failure is reproduced before it is fixed.", "A regression test fails before the patch and passes after it."],
  6: ["The thin API and database slice works from a clean start.", "You can explain the first failure and the evidence that localized it."],
  7: ["One confusing backend path is simpler without changing behavior.", "The Week 2 setup and remaining risk are documented."],
  8: ["Route, service, repository, and configuration responsibilities are separate.", "A test proves that the service is not coupled to the transport layer."],
  9: ["Migrations reproduce the schema from an empty database.", "Before-and-after query plans justify each added index."],
  10: ["Pagination, filtering, and validation share one stable contract.", "Boundary and malformed-input tests cover the public endpoint."],
  11: ["A signed-in user can access only notes they own.", "Unauthenticated, forbidden, and successful requests are tested separately."],
  12: ["Unit, repository, and API integration tests run in CI.", "The removed flaky behavior is explained and reproducible."],
  13: ["Auth, database, validation, errors, tests, and setup docs pass the backend rubric.", "The service can be demonstrated from a clean checkout."],
  14: ["The highest-risk gate failure has a regression test.", "One backend path and its documentation are clearer than before."],
  15: ["Navigation, note list, loading, empty, and error states are keyboard reachable.", "The UI renders useful content at mobile and desktop widths."],
  16: ["Form state and validation have one visible source of truth.", "An optimistic failure rolls the interface back without losing the draft."],
  17: ["Authenticated create, edit, delete, and search work through the UI.", "Loading, empty, error, retry, and success states are demonstrated."],
  18: ["The embedding endpoint has a narrow typed request and response contract.", "A similarity visualization and metric check use known examples."],
  19: ["Answers include citations tied to retrieved note chunks.", "No-answer and low-confidence cases do not invent a response."],
  20: ["Sign-in through cited answer works as one vertical flow.", "Empty, unauthorized, model-down, and retry states are demonstrated."],
  21: ["The highest-risk integration failure now has a regression test.", "Keyboard, focus, status, and error announcements are checked."],
  22: ["At least ten evaluation cases have expected retrieval and answer behavior.", "Retrieval hit, citation, and groundedness results are reproducible."],
  23: ["Timeouts, retries, cache, and rate limits have explicit bounds.", "A failure-injection test proves duplicate requests remain safe."],
  24: ["Tenant isolation and authorization are tested below the UI layer.", "Prompt injection, unsafe output, and secret exposure have regression cases."],
  25: ["Structured logs connect one request ID across the full path.", "Latency, error, AI usage, and feedback signals are visible."],
  26: ["A clean machine can start the containerized product from the README.", "The system diagram and runbook explain scaling and failure tradeoffs."],
  27: ["The complete capstone is defended without opening implementation notes.", "A failure is diagnosed aloud from an observed symptom and evidence."],
  28: ["The README, demo, portfolio proof, and resume bullet are current.", "The next plan targets measured gaps instead of restarting blindly."],
};

const commandsByWeek = {
  1: ["Start the application and its dependencies from a clean terminal.", "Run the narrowest automated test that proves today's behavior."],
  2: ["Apply migrations to an empty test database.", "Run backend unit and integration tests with authentication enabled."],
  3: ["Run the full vertical slice at desktop and mobile widths.", "Exercise success, empty, unauthorized, failure, and retry states."],
  4: ["Run the complete automated suite and one failure-injection check.", "Reproduce the build or deployment from the written runbook."],
} as const;

export function labGuide(dayNumber: number) {
  const day = sprintDay(dayNumber);
  const specific = dayChecks[day.day];
  return {
    day,
    deliverable: day.lab,
    criteria: [
      ...specific,
      "The relevant automated checks pass, and their command and result are recorded below.",
      "You can explain one design choice, one tradeoff, and one failure mode without reading a reference answer.",
    ],
    verification: commandsByWeek[day.week],
  };
}
