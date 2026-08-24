# Grindstone Product Requirements Document

## Document control

| Field | Decision |
|---|---|
| Status | Canonical product specification |
| Version | 2.2 |
| Date | 2026-08-24 |
| Product | Grindstone |
| Product identity | AI-Enabled Full-Stack Software Engineer Interview Sprint |
| Audience | Product, design, curriculum, engineering, content, operations |
| Supersedes | The original multi-route build plan and `docs/PRODUCT_PLAN.md` |

This document combines the original sprint engine with the later single-product direction. When a prior plan conflicts with this PRD, this PRD wins.

## 1. Executive decision

Grindstone is one guided, four-week interview-preparation product for one professional identity: **AI-Enabled Full-Stack Software Engineer**.

The learner makes one curriculum choice during setup:

- Python
- Java

Everything else is decided by the product. There are no separate role tracks, company tiers, learning modes, or menus of unrelated practice rooms.

The honest promise is:

> Complete 28 focused daily sessions that prepare you for common coding, aptitude, full-stack, applied-AI, debugging, system-design, and communication rounds. Grindstone measures evidence of readiness; it does not promise a job or claim that four weeks replaces professional experience.

The sprint contains 70 hours of scheduled work: 150 minutes every day for 28 days. Each week has five acquisition/application days, one gate day, and one lower-intensity consolidation/recovery day. It starts at an intermediate level, but Luna can teach a missing prerequisite inside the current lesson without sending the learner into a separate beginner course.

The product is built around one answer to one question: **What should I do next, why does it matter, and what will prove I learned it?**

## 2. Problem statement

The current product exposes too many destinations and too much internal teaching vocabulary. A first-time learner sees concepts such as PRIMM, transfer, tiers, mastery priors, simulations, and specialist rooms before understanding what Grindstone is preparing them to do. The result is strong individual features inside a confusing overall journey.

Grindstone must fix the following root problems:

1. The learner does not know where to start or which route to follow.
2. Lessons state facts before establishing a plain-language mental model or practical purpose.
3. The explanation, editor, AI help, visualization, and independent practice feel like separate products.
4. Activity can be mistaken for readiness because streaks, XP, attempts, and skill evidence are not clearly separated.
5. A four-week claim can become dishonest if the product implies that all 150 problems or all of full-stack and AI engineering can be mastered in 70 hours.
6. AI help can accidentally replace learning, leak solutions, fail silently, or expose one learner's context to another.
7. A progressive capstone cannot work as a collection of isolated single-file exercises; it needs a persistent, secure project workspace.

## 3. Product principles

### 3.1 One path, not a toolbox

Today is the default product. The learner receives one ordered session and one primary Resume action. Curriculum explains the path. Problems provides deliberate access to the 150-problem library. Progress explains evidence. Everything else is an activity within those surfaces, not another destination.

### 3.2 Plain language outside, learning science inside

The engine may use retrieval practice, spacing, worked examples, subgoal labels, fading, productive failure, and interleaving. The UI does not require the learner to understand those terms. User-facing lesson steps are:

1. Understand
2. Check your prediction
3. Code it
4. Explain it
5. Solve one alone

### 3.3 Verified curriculum, contextual AI

The concept area is not a blank chatbot. Every lesson begins with reviewed, versioned content, runnable examples, original visuals, known misconceptions, and tests. Luna is permanently available beside that content and receives the exact lesson, language, current step, learner code, previous attempts, and allowed help level.

### 3.4 Help should create the next thought, not replace it

Luna gives the smallest useful intervention first. Hints do not reduce XP or shame the learner, but assisted work cannot count as independent mastery. AI is disabled during independent transfer, weekly gates, and mocks.

### 3.5 Evidence over engagement theater

Minutes, streaks, and XP describe consistency. Readiness is based on independent, timed, retained performance and artifact quality. The product never increases readiness merely because a page was opened or a video was watched.

### 3.6 Same outcomes, language-specific implementation

Python and Java learners complete the same concepts, interview patterns, labs, gates, and capstone requirements. The primary language controls DSA, backend, examples, starter code, tests, and interview answers.

All learners also use:

- TypeScript and React for frontend work.
- Python for the applied-AI portion because the practical ML ecosystem is Python-first.
- PostgreSQL and SQL for data work.

For Java learners, Python is a small, scaffolded AI service beside the Spring Boot backend. It does not replace Java as the primary interview language.

### 3.7 Recovery without debt

A missed day never creates a growing wall of overdue work. The planner preserves essential reviews, moves lower-priority work, and shows a recovery session. Weekly gates add targeted rescue work but do not trap the learner behind a permanent lock.

### 3.8 Honest constraints

LeetCode describes Top Interview 150 as best for at least three months, while NeetCode describes its 150 list as appropriate for people already familiar with basic algorithms and data structures. Grindstone therefore includes 150 problems as a long-term library but requires only 40 during the four-week sprint.

## 4. Goals, non-goals, and success measures

### 4.1 Product goals

- A returning learner can resume the correct next task in one click.
- A new learner can explain what Grindstone prepares them for before beginning Day 1.
- Every concept is understandable through plain language, a visual model, a worked example, an in-place editor, and contextual questions to Luna.
- The product produces independent evidence in DSA, full-stack development, applied AI, aptitude and SQL, and interview communication.
- Every learner finishes with a working, tested, deployable AI-enabled full-stack capstone.
- Java and Python paths reach equivalent learning outcomes.
- The private cohort can use Google login while the backend AI runs from a dedicated owner ChatGPT login without exposing that login to learners.

### 4.2 Non-goals for the four-week sprint

- Teaching a complete computer-science degree.
- Making a complete beginner job-ready for every company in 28 days.
- Training foundation models, doing AI research, or replacing the depth expected of a machine-learning scientist. The AI scope is production application engineering: data, embeddings, retrieval, evaluation, safety, and operations.
- Requiring all 150 interview problems during the sprint.
- Preparing for specialized research scientist, data scientist, mobile, embedded, game, or DevOps roles.
- Supporting C++, JavaScript, Go, or other primary interview languages in v2.
- Giving a hiring guarantee, certification, percentile against employers, or recruiter endorsement.
- Copying third-party problem statements, editorials, videos, or hidden test cases.
- A public, anonymous, unlimited AI service.
- Voice interviews in the first release.

### 4.3 Launch success measures

| Measure | Launch target |
|---|---:|
| Setup completion | At least 90% of allowed users who start setup |
| Median setup time | Under 5 minutes, excluding the first learning task |
| Returning time to Resume | Under 10 seconds from page load |
| Day 1 completion | At least 80% of activated cohort members |
| Four-week completion | At least 60% for the initial friend cohort |
| Weekly active completion | At least 4 evidence days per active learner |
| Lesson independent-transfer pass | At least 70% within two attempts |
| Hint usefulness | At least 60% of hint requests lead to progress without immediate escalation |
| Published content defect rate | Under 1%, with all reports reviewed within 48 hours |
| Cross-user AI-context incidents | Zero |
| Uncontained code-execution incidents | Zero |
| WCAG target | WCAG 2.2 AA on all core journeys |

These are product hypotheses for the first cohort, not industry benchmarks. They must be reviewed after each sprint.

## 5. Users and operating assumptions

### 5.1 Primary learner

An early-career or transitioning software engineer preparing for screening and technical rounds, typically with some programming exposure but uneven foundations. The learner can commit 2 to 3 hours every day for 28 days and wants one rigorous plan rather than a catalog.

### 5.2 Cohort

A private group of roughly 4 to 8 friends. Members can see a weekly evidence scoreboard when they opt in. They cannot see another learner's code, AI conversations, failed answers, email address, or detailed readiness breakdown.

### 5.3 Administrator

The host owner manages the email allowlist, content publication, service health, backups, problem reports, AI login, and cohort membership. Admin controls are never shown in the learner navigation.

### 5.4 Device assumptions

- Desktop or laptop is required for coding and capstone labs.
- Mobile fully supports Today, concept explanations, videos, visualizations, aptitude, review, and progress.
- Mobile coding uses a task/editor/console tab layout and is available for short problems, but the UI honestly recommends desktop for multi-file labs.

## 6. Fixed product decisions

| Area | Decision |
|---|---|
| Role | One combined AI-enabled full-stack software engineer identity |
| Primary language | Python or Java only |
| Frontend | TypeScript and React for everyone |
| Python path backend | FastAPI |
| Java path backend | Spring Boot |
| Database | PostgreSQL |
| Applied AI | Python, embeddings, retrieval, RAG, evaluation, safety, and monitoring |
| Sprint | 28 calendar days across 4 weeks |
| Daily plan | 150 minutes every day, including four lower-intensity consolidation/recovery days |
| Required problems | 40 original Grindstone core problems |
| Library | 150 original problems, mapped by pattern and optionally linked to external references |
| Primary navigation | Today, Curriculum, Problems, Progress |
| Tutor | Luna, fixed to `gpt-5.6-luna` with `xhigh` reasoning and no model fallback |
| Learner auth | Google sign-in with an email allowlist |
| Tutor auth | Dedicated owner ChatGPT login on the host through Codex App Server |
| Hosting | Private self-hosted Docker stack behind Cloudflare Tunnel |
| Design | Dark-first, calm product UI; charcoal base with semantic accents |

## 7. Information architecture

### 7.1 Primary routes

| Route | Purpose | Primary action |
|---|---|---|
| `/` | Today's ordered session and next task | Start or Resume |
| `/curriculum` | The four-week map and purpose of every day | Open current day |
| `/problems` | The Grindstone Interview 150 library | Resume scheduled problem |
| `/progress` | Readiness evidence, streak, reviews, and cohort board | Review weakest evidence |
| `/settings` | Profile, language, schedule, privacy, accessibility | Save settings |

`Settings`, `Sign out`, and admin-only controls live in the profile menu. There is no `More` menu.

### 7.2 Activity routes

Activity routes are opened only from Today, Curriculum, Problems, or a resume link:

- `/session/:sessionId`
- `/session/:sessionId/lesson/:lessonId`
- `/problems/:problemId`
- `/workspace/:workspaceId/task/:taskId`
- `/assessment/:assessmentId`

They do not compete in global navigation.

### 7.3 Legacy route behavior

| Legacy route | Migration behavior |
|---|---|
| `/learn?lesson=:slug` | Redirect to the migrated lesson activity |
| `/solve?problem=:slug` | Redirect to `/problems/:id` |
| `/practice` | Redirect to today's scheduled review |
| `/mock`, `/drive` | Redirect to the scheduled assessment, or Curriculum when none is scheduled |
| `/lab`, `/design`, `/hr`, `/sprint-review` | Redirect to the matching current curriculum activity |
| `/league` | Redirect to `/progress#cohort` |
| `/diagnostic` | Redirect to Day 1 baseline or its saved resume point |

Every redirect preserves a resumable item identifier when one exists. No learner progress is deleted during route cleanup.

## 8. End-to-end learner journey

### 8.1 Sign-in and profile creation

1. The learner signs in with an allowed Google account.
2. First sign-in creates a user and an incomplete profile in one transaction.
3. Setup asks only for display name, Python or Java, timezone, and preferred session time. The 28-day calendar is fixed and begins when setup is completed.
4. Every selection auto-saves immediately and can resume on another device.
5. The product explains that React/TypeScript and a small amount of Python for AI are included regardless of primary language.
6. Finishing setup opens Day 1. There is no separate route-selection or company-tier decision.

If the email is not allowed, the user sees a clear access-request message without learning whether another email is registered.

### 8.2 Baseline without an onboarding wall

There is no one-hour diagnostic gate. Day 1 collects a baseline through the normal recall, aptitude, coding, explanation, and lab tasks. Days 1 to 3 refine the estimate. The learner starts useful work immediately.

The baseline changes scaffolding, review frequency, and foundation rescue; it does not switch the learner to a different curriculum.

### 8.3 Today

Today shows:

- `Day 7 of 28` and the day's plain-language outcome.
- One sentence explaining why the outcome appears in interviews.
- Total planned time, completed time, and a realistic finish estimate.
- One Start or Resume button.
- Six ordered activities with duration, status, and collected evidence.
- A compact row for current streak, readiness band and confidence, and week progress.
- A recovery explanation when the plan changed because of missed work or a failed gate.

Today does not lead with charts, badges, a feed, or unlocked destinations.

### 8.4 Curriculum

Curriculum shows four full-width week bands and 28 ordered days. Every day has:

- A learner-facing outcome.
- Interview patterns.
- Engineering artifact.
- Aptitude topic.
- Required evidence.
- Status: upcoming, today, in progress, needs review, or complete.

Future days can be inspected. Weekly assessments and independent mocks remain unavailable until their required evidence window opens, because seeing their hidden content early invalidates the assessment.

### 8.5 Learning workspace

The workspace header must answer, in this order:

1. What am I learning?
2. Where will I use it?
3. What should I already know?
4. What will I be able to do at the end?

The body uses five plain-language stages:

#### Understand

- One-sentence intuition.
- One concrete real-world analogy, clearly labeled as an analogy.
- One original, generated concept illustration that makes the mental model visible.
- One deterministic, code-native visualization for actual state changes, data movement, control flow, or architecture. Generated imagery never substitutes for an accurate execution trace.
- One short worked example in the learner's primary language.
- Named steps written as verbs.
- Operation cost and complexity in plain language.
- One curated video link or internal micro-video with captions, transcript, duration, source, and a written fallback.
- Inline definitions for every required technical term.

The concept page is one continuous learning workspace, not a gallery of disconnected cards. It presents the explanation, generated image, interactive visualization, video, chosen-language example, editor, output, and Luna in the order needed for the current objective. Media is collapsible after it has served its purpose so the editor can become the primary surface without navigating away.

Luna remains visible in a right-side panel on desktop and a persistent bottom sheet on mobile. Selecting any paragraph or code opens `Explain this` with the exact selection attached.

#### Check your prediction

The learner commits to the expected output or state before running the example. The execution visualizer then steps through variables, references, call stack, and output. A wrong prediction is treated as useful evidence, not a failure.

#### Code it

The explanation collapses and its key answer is obscured. The learner edits and runs code in place. They can reopen the explanation, but that action is recorded as assistance for this attempt.

#### Explain it

The learner states the approach, why it works, complexity, and one edge case. Luna may grade against a rubric but must identify uncertainty and never claim that fluent wording alone proves mastery.

#### Solve one alone

A fresh related task opens with AI, ghost text, solution content, and worked examples disabled. Passing visible and hidden tests creates independent evidence and schedules recall.

### 8.6 Foundation rescue

Each lesson lists prerequisites in everyday language. A learner can select any one and choose `Teach me this first`.

Luna's rescue sequence is fixed:

1. Define the term in one sentence.
2. Show the smallest possible example.
3. Compare it with a concept already present in the learner model.
4. Animate or trace the example.
5. Ask one checking question.
6. Return to the exact paused lesson location.
7. Schedule a ten-minute review for the next day.

Rescue must not open another course, reset the lesson, or consume the daily interview-problem time.

### 8.7 Problems

The problem library supports search and filters for pattern, difficulty, status, and scheduled/core/library. The default view is `My scheduled problems`, not all 150.

The problem workspace contains:

- Original statement, examples, constraints, and function contract.
- Python or Java editor with starter code.
- Run, Submit, Reset, and Report problem actions.
- Visible examples and isolated hidden tests.
- Test output that distinguishes wrong answer, compile error, runtime error, timeout, memory limit, and judge outage.
- Step-through visualization when the problem supports tracing.
- Luna chat and help controls when assistance is allowed.
- Complexity target and post-submit analysis.
- A fresh related transfer problem.

### 8.8 Progress

Progress is ordered as:

1. Readiness band, numerical score, confidence, and what evidence would change it.
2. Five readiness dimensions with evidence dates and weak competencies.
3. Four-week completion and scheduled review queue.
4. Streak and training calendar.
5. Weekly friend scoreboard, collapsed by default and opt-in.
6. Attempt history and downloadable personal data.

## 9. Luna AI tutor requirements

### 9.1 Product role

Luna is a course-aware tutor, debugger, Socratic questioner, and feedback assistant. Luna is not the curriculum source of truth, an autonomous coding agent, or an assessment answer key.

Context-aware assistants are already used by CodeSignal and Codecademy: both products describe an assistant that knows the current lesson or exercise and learner code. Codecademy also documents the difficulty of preventing an answer-oriented model from giving the solution too early. Grindstone adopts the useful pattern but validates it with its own tutor evals.

### 9.2 Context contract

Each tutor request may include only:

- User ID pseudonym, language, current day, lesson and step.
- Published lesson excerpt and approved misconceptions.
- Current editor buffer and public test output.
- The learner's previous messages in this scoped thread.
- Help already used in this attempt.
- A compact mastery summary for relevant prerequisites.

It must never include:

- Another learner's information.
- Hidden tests or reference solutions.
- Google OAuth tokens, Codex tokens, environment variables, or host paths.
- Owner account details.
- Unrelated project files.

### 9.3 Help ladder

| Level | Learner action | Luna response | Evidence effect |
|---|---|---|---|
| 0 | Ask a conceptual question | Clarify with an example or question | No effect when no solution detail is revealed |
| 1 | Nudge me | Name the misconception or next question | Attempt marked lightly assisted |
| 2 | Show the pattern | Give subgoals or pseudocode without implementation | Attempt marked assisted |
| 3 | Show the next step | Give one logical step or one line | Attempt cannot prove independent mastery |
| 4 | Explain a solution | Available only after a completed attempt or explicit surrender | Attempt becomes study evidence only |

The learner can ask open questions at every non-assessment step. The UI always shows the current help level and what it means.

### 9.4 Inline ghost hint

The half-faded editor hint is opt-in, not continuous autocomplete.

- It appears after the learner clicks `Hint in editor` or invokes the documented editor command.
- It provides at most one logical line or structural placeholder.
- Accepting any portion records Level 3 assistance.
- It is disabled in independent transfer, recall re-solves, gates, and mocks.
- It cannot include imports, helper functions, or multiple lines that reveal the full solution.
- It is cleared when the code context changes enough to make the hint stale.

### 9.5 Availability and failure behavior

- AI status is checked before the request and while streaming.
- The learner can cancel a request.
- Timeout, quota, auth expiry, model unavailability, and malformed output have distinct messages.
- The prompt and learner draft remain available for retry.
- Static hints and verified explanations remain usable when Luna is offline.
- There is no silent model fallback.
- Assessment timers never pause because Luna is unavailable; Luna is disabled there anyway.

### 9.6 Authentication and model policy

Codex App Server is the supported integration boundary. Official OpenAI documentation describes it as an interface for embedding authentication, conversation history, and streamed agent events inside a product, and documents ChatGPT-managed login, rate-limit inspection, and automatic token refresh.

Grindstone uses:

- A dedicated host-side ChatGPT login.
- `gpt-5.6-luna`.
- `xhigh` reasoning.
- No tools, network, command execution, file writes, or approval requests.
- Read-only sandboxing and ephemeral scoped threads.
- Per-user daily quotas, two concurrent tutor turns by default, and global backpressure.

Credentials stay in the dedicated Codex home volume and never enter the browser, application database, logs, analytics, or backups.

**Compliance launch gate:** the owner must verify that serving a private multi-user cohort from the selected ChatGPT plan is permitted by the current OpenAI terms and workspace policy. The technical ability of App Server to authenticate does not by itself establish a right to resell or broadly share subscription access. Until verified, the deployment remains a private, non-commercial friend cohort.

## 10. Learning and assessment model

### 10.1 Daily session

| Activity | Minutes | Completion evidence |
|---|---:|---|
| Scheduled recall | 10 | Recall response or independent re-solve |
| General aptitude | 20 | Timed accuracy and review |
| Visual concept with Luna | 25 | Prediction and concept check |
| Interview problem solving | 45 | Code attempt, tests, complexity, explanation |
| Full-stack and AI lab | 40 | Runnable artifact or test |
| Explain and plan review | 10 | Teach-back, mistake note, next review |
| **Total** | **150** | Demonstrated work, not elapsed time alone |

The system does not add filler. A learner who demonstrates the required evidence early can finish early. A learner who needs more time can stop at 150 minutes, save safely, and resume without losing the streak.

On Days 7, 14, 21, and 28, the same 150-minute envelope is used at lower cognitive intensity. Those sessions introduce no new core interview problem. They emphasize retained re-solves, misconception repair, aptitude error review, capstone cleanup, reflection, and planning. This preserves a true 28-day habit without pretending that maximum-load acquisition is healthy every day.

### 10.2 Internal pedagogy

The content engine uses the following, while the learner sees plain-language actions:

- Retrieval practice and spacing for retention.
- Predict, run, inspect, change, and create for code comprehension.
- Subgoal-labeled worked examples.
- Parsons-style ordering only as an optional rescue scaffold, never as an unexplained destination.
- Faded examples that remove help as evidence improves.
- Short, structured attempt-before-explanation where appropriate.
- Interleaving from Week 3 onward.
- Self-explanation and teach-back.
- Fresh transfer for independent evidence.

Worked examples are especially useful for reducing unproductive search, but can create shallow copying. Every worked example must therefore lead to prediction, explanation, modification, and fresh transfer.

### 10.3 Adaptation rules

The curriculum outcomes and day order stay fixed. The planner may adapt:

- Example complexity.
- Number and type of visible hints.
- Fade level.
- Which prerequisite receives rescue.
- Which previous item fills the 10-minute recall block.
- Which same-pattern library problem is used as extra practice.
- Whether one lower-priority lab extension is deferred after missed work.

It may not silently remove a gate requirement, change languages, skip a required security task, or substitute an easier transfer and still award equivalent readiness evidence.

### 10.4 Weekly gates

| Gate | Required evidence | Pass rule | On miss |
|---|---|---|---|
| Week 1: Screening | Timed mixed coding, aptitude, and explanation | Coding at least 60%, aptitude at least 55%, no critical foundation gap | Add two targeted rescues and one re-solve in Week 2 |
| Week 2: Backend | Authenticated API, database, validation, and tests | At least 80% rubric and all security-critical checks | Preserve Week 3, replace one extension with backend repair |
| Week 3: Full-stack AI | Working UI, retrieval flow, citations, and failure states | At least 75% rubric and no cross-user data leak | Add an integration repair task before production work |
| Week 4: Interview loop | Timed coding, aptitude, debug, system defense, communication | Overall at least 70%, no readiness dimension below 55 | Produce a one-week recovery plan, not a fake pass or full restart |

### 10.5 Interview-date taper

When a learner records a real interview date within 48 hours, Grindstone suppresses new hard problems and long labs. Today becomes light recall, known-pattern recognition, one short explanation drill, logistics, and sleep guidance. The sprint calendar does not assume that every learner interviews immediately after Day 28.

## 11. Four-week curriculum

### 11.1 Sprint outcomes

| Week | Outcome |
|---|---|
| 1. Screening foundations | Pass a basic coding and general-ability screen and trace a request through a small service |
| 2. Data structures and backend | Build and test an authenticated API backed by PostgreSQL |
| 3. Full-stack AI application | Connect a React interface to a retrieval-enabled backend with cited answers |
| 4. Production and interviews | Evaluate, secure, observe, deploy, and defend the system in a realistic loop |

### 11.2 Progressive capstone

Every learner builds **Evidence Desk**, an authenticated knowledge application where a user can create notes, tag them, search them, and ask a question that returns a grounded answer with citations.

Python path:

- FastAPI backend and AI module.
- PostgreSQL with vector search.
- React and TypeScript frontend.

Java path:

- Spring Boot backend.
- Small scaffolded Python AI sidecar.
- PostgreSQL with vector search.
- React and TypeScript frontend.

Final capstone acceptance:

- Sign-in and per-user ownership work.
- Notes can be created, read, updated, deleted, searched, and paginated.
- Validation and stable error responses exist.
- The UI has loading, empty, success, and retryable error states.
- Retrieval returns citations to stored notes.
- At least ten evaluation cases measure retrieval and groundedness.
- Prompt-injection and cross-user access tests pass.
- Unit, integration, and end-to-end tests pass.
- Logs, latency, errors, and AI usage are observable.
- The system runs from documented container commands.
- The learner can explain requirements, API, data model, retrieval path, tradeoffs, failure modes, and next scaling step.

### 11.3 Day-by-day plan

Each week's five acquisition/application days introduce two required core problems. Gate and consolidation/recovery days re-test earlier work and introduce no new core problem.

| Day | What the learner is learning and why | Core interview problems | Engineering and AI lab | Aptitude | Required evidence |
|---:|---|---|---|---|---|
| 1 | Array scans and Big O; maintain one true summary instead of rescanning | Highest Reading; Peak Score | Open the capstone, run tests, trace browser to server to database, add a health endpoint | Mixed baseline | Two solutions, one complexity explanation, running scaffold |
| 2 | Hash keys and complements; turn repeated search into one lookup | Pair to Target; First Matching Pair | Specify the notes API, request/response shapes, status codes, and first route | Percentages | Passing code and an API contract with examples |
| 3 | Pointer movement on ordered input; eliminate impossible candidates | Sorted Pair Target; Two-End Target | Design PostgreSQL users, notes, and tags; write create, select, filter, and join queries | Ratios and proportions | Schema diagram, queries, and hidden problem tests |
| 4 | Prefix-state invariants; precompute repeated range work | Range Total; Repeated Range Sum | Implement create/read/update/delete with validation and stable errors | Averages and mixtures | Invariant explanation and validated CRUD path |
| 5 | Sliding windows and disciplined debugging; change one thing at a time | Shortest Target Span; Minimum Budget Window | Repair a seeded request failure, add regression tests, and explain the root cause | Time, work, speed, and distance | Debug log, tests, and two problem passes |
| 6 | Week 1 gate: select patterns under time and explain the choice | No new problem; timed re-solves | Demonstrate the thin API/database slice and review failures | Timed data interpretation | Gate score and a generated Week 2 rescue plan when needed |
| 7 | Consolidate Week 1 mental models and recover gaps before adding more material | No new problem; independently re-solve two missed or assisted tasks | Refactor the thin slice, repair failed checks, improve tests and notes, and plan Week 2 | Review the Week 1 error log | Two retained re-solves, corrected misconceptions, clean artifact, and Week 2 plan |
| 8 | Stack state and service boundaries | Bracket Balance; Nested Delimiters | Separate controller/route, service, repository, and configuration concerns | Number and letter sequences | Layered endpoint and stack explanations |
| 9 | Binary search as ordered boundary finding | Ordered Lookup; Exact Index Search | Add migrations and indexes; compare query plans before and after an index | Deductive reasoning and syllogisms | Three query-plan observations and two problem passes |
| 10 | Mutable references and explicit ownership | Independent Backup; Copy Before Update | Add pagination, filtering, input validation, and one stable error envelope | Directions and arrangements | Contract tests and a pointer trace |
| 11 | Recursive base cases and identity/authentication boundaries | Recursive Product; Factorial Base Case | Integrate Google identity, authorize note ownership, and test forbidden access | Probability and counting basics | Ownership tests and two hidden-test passes |
| 12 | Tree traversal and breadth-first processing | Level by Level; Tree Level Lines | Add unit, repository, API integration, and CI tests; remove one flaky test | Critical reasoning | Green test suite and traversal explanation |
| 13 | Week 2 gate: build and defend an authenticated backend | No new problem; timed mixed re-solves | Run backend rubric: auth, database, validation, tests, errors, and documentation | Timed mixed reasoning | Gate artifact and targeted repair plan |
| 14 | Consolidate backend and data skills, repair gate weaknesses, and protect retention | No new problem; one independent re-solve plus a SQL/debug task | Repair gate failures, simplify one backend path, and strengthen its tests and documentation | Mixed Week 2 error review | Retained re-solve, corrected backend evidence, and Week 3 plan |
| 15 | Search-tree ordering and recursion; model UI as components | Validate Search Tree; Bounded BST Check | Build the React/TypeScript shell, navigation, note list, and reusable states | Tables and charts | Accessible UI shell and two problem passes |
| 16 | Priority-queue selection; make UI state explicit | K Highest Frequencies; Most Frequent Values | Build controlled forms, client validation, reducer/state flow, and optimistic-state rollback | Data sufficiency | Form tests, state diagram, and hidden tests |
| 17 | Combinatorial branching; integrate real APIs safely | All Subsets; Decision Tree Count | Connect the UI to the backend with authenticated requests, loading, empty, error, and retry states | Reading comprehension | End-to-end CRUD and failure-state evidence |
| 18 | Graph regions; understand inference, train/validation/test splits, precision/recall, and embeddings | Network Components; Disconnected Regions | In Python, inspect a tiny classification result, generate embeddings for notes, visualize similarity, and expose a narrow AI-service contract | Assumptions and conclusions | Metric check, similarity visualization, and tested endpoint |
| 19 | Dependency order; understand transformers at a systems level and choose retrieval instead of unnecessary fine-tuning | Course Order; Dependency Cycle | Add chunking, vector retrieval, cited answers, no-answer behavior, and frontend citations | Timed workplace data | RAG trace with citations and two graph passes |
| 20 | Week 3 gate: prove the full vertical slice and diagnose integration failures | No new problem; interleaved re-solves | Demo sign-in to cited answer, including empty, unauthorized, model-down, and retry states | Timed mixed set | Gate rubric and recorded integration repair when needed |
| 21 | Consolidate the frontend/AI vertical slice before production hardening | No new problem; recognize patterns and independently re-solve one weak task | Repair integration findings, improve accessibility, remove brittle state, and retest the end-to-end path | Mixed Week 3 error review | Retained result, polished vertical slice, and Week 4 risk list |
| 22 | Shortest paths; measure AI rather than trusting a demo | Shortest Grid Route; Blocked Grid Path | Create a ten-case evaluation set; measure retrieval hit rate, citation validity, and groundedness | Numerical speed set | Reproducible eval report and two problem passes |
| 23 | Interval reasoning; design for slow or failing dependencies | Merge Meeting Windows; Combined Ranges | Add timeouts, retries with bounds, caching, rate limits, and idempotent behavior | Reasoning speed set | Failure-injection tests and interval explanation |
| 24 | Dynamic-programming state; secure an AI-enabled application | Non-Adjacent Maximum; Take-or-Skip Loot | Test tenant isolation, prompt injection, output handling, secret boundaries, and authorization | Verbal speed set | Security tests and explicit threat model |
| 25 | DP recurrence and two-dimensional state; observe production behavior | Count Grid Routes; Robot Route Count | Add structured logs, request IDs, latency/error metrics, AI usage, and a feedback event | Company-style cognitive section | Dashboard/query evidence and recurrence explanations |
| 26 | Bit invariants and final transfer; package and defend the system | Unique Value Bits; Single Unpaired Value | Containerize, document setup, draw the system design, and rehearse scaling tradeoffs | Full aptitude simulation | Deployable build, diagram, runbook, and 40th core pass |
| 27 | Final interview loop: select, solve, debug, explain, and defend without assistance | No new problem; timed mixed interview | Complete coding, code-reading/debugging, system-design defense, and capstone review | Light timed mixed warm-up | Final gate and readiness snapshot with confidence |
| 28 | Debrief the loop, repair the highest-value miss, package the evidence, and choose the next plan | No new problem; independently revisit one missed interview subgoal | Finalize README, demo, portfolio evidence, resume bullet, and the next 28-day plan | Final aptitude error review | Corrected evidence, polished capstone package, and personalized continuation plan |

### 11.4 Core 40 distribution

| Pattern | Required in sprint |
|---|---:|
| Arrays and complexity | 2 |
| Hash maps | 2 |
| Two pointers | 2 |
| Prefix sums | 2 |
| Sliding window | 2 |
| Stack | 2 |
| Binary search | 2 |
| Mutable references | 2 |
| Recursion | 2 |
| Tree breadth-first search | 2 |
| Binary search trees | 2 |
| Heap / priority queue | 2 |
| Backtracking and subsets | 2 |
| Graph components | 2 |
| Topological order | 2 |
| Grid shortest path | 2 |
| Intervals | 2 |
| 1-D dynamic programming | 2 |
| 2-D dynamic programming | 2 |
| Bit manipulation | 2 |
| **Total** | **40** |

Target difficulty for the core 40 is 14 easy, 25 medium, and 1 hard. Difficulty is a content-review label, not a readiness score.

### 11.5 Grindstone Interview 150

The full library follows a broad, recognizable pattern distribution so the learner can continue after the sprint:

| Category | Problems |
|---|---:|
| Arrays and complexity | 8 |
| Hash maps | 8 |
| Two pointers | 8 |
| Prefix sums | 8 |
| Sliding window | 8 |
| Stack | 8 |
| Binary search | 8 |
| Mutable references | 8 |
| Recursion | 8 |
| Tree breadth-first search | 8 |
| Binary search trees | 7 |
| Heap / priority queue | 7 |
| Backtracking and subsets | 7 |
| Graph components | 7 |
| Topological order | 7 |
| Grid shortest path | 7 |
| Intervals | 7 |
| 1-D dynamic programming | 7 |
| 2-D dynamic programming | 7 |
| Bit manipulation | 7 |
| **Total** | **150** |

Each library item requires:

- An original Grindstone title and statement.
- A source/provenance record and optional external reference link.
- Python and Java contracts, starters, reference implementations, and hidden tests.
- Visible examples, constraints, expected complexity, edge cases, and follow-ups.
- At least one deliberately wrong fixture that the tests catch.
- A problem visualizer or a documented reason visualization is not useful.
- A pattern lesson link and a fresh transfer variant.
- Published, quarantined, retired, and reported states.

No scraper runs against LeetCode, NeetCode, or another practice site. External IDs and links may be stored for a learner's private cross-reference, but Grindstone does not republish third-party statements, editorials, videos, or tests without permission.

`Most asked` is not shown as a marketing claim unless Grindstone has a licensed or public frequency source with a recorded company, role, region, sample window, and `last_verified_at` date. Without that evidence, problems are labeled `Core`, `Classic`, or by pattern rather than with invented frequency.

### 11.6 Communication progression

The final ten minutes of each day build interview communication instead of becoming generic journaling:

- Week 1: state the approach, invariant, and complexity before or after coding.
- Week 2: explain an API, schema, test, debugging hypothesis, and security boundary.
- Week 3: demonstrate a user flow, describe a failure state, and explain why retrieval produced its citations.
- Week 4: answer a project tradeoff, tell one concise STAR story from the capstone, handle a follow-up, and defend the system design.

Communication is recorded only with learner consent. Text is the required v2 path; voice remains a future enhancement.

## 12. Persistent capstone workspace

Single-file judging is not sufficient for the capstone. Grindstone needs a persistent multi-file workspace.

### 12.1 Workspace behavior

- One workspace per learner per sprint, created from the selected language template.
- Browser file tree, CodeMirror editor, terminal output, test runner, and authenticated preview.
- Automatic save with revision history and explicit restore points.
- A task diff shows what changed for the current lab without exposing a reference answer.
- Preinstalled, version-pinned dependencies; arbitrary package installation and outbound network are disabled.
- Idle containers stop automatically and resume from the saved workspace.
- A failed build never destroys the previous good snapshot.

### 12.2 Isolation

- One active container per user.
- No host filesystem mount other than the user's scoped workspace.
- No access to the Grindstone database, Docker socket, Codex home, secrets, or other workspaces.
- CPU, memory, process, disk, output, and wall-clock limits.
- Authenticated preview proxy with random internal ports and no public direct binding.
- Network disabled by default; calls to the course's mock AI endpoint go through a narrow allowlisted proxy.
- Daily cleanup of abandoned containers and quota alerts before disk exhaustion.

## 13. Readiness, mastery, streaks, and scoreboard

### 13.1 Separate concepts

| Metric | Meaning | Must not mean |
|---|---|---|
| Completion | Scheduled items finished | Skill mastery |
| Streak | Consistent minimum evidence days | Hours worked or readiness |
| XP | Weekly participation and challenge points | Hiring probability |
| Mastery | Evidence for a specific competency | Permanent knowledge |
| Readiness | Weighted, recent, independent evidence | A job guarantee |

### 13.2 Attempt evidence score

For an eligible graded attempt:

- Correctness: 40%
- Independence: 25%
- Time against a reviewed target: 15%
- Retention on a later attempt: 10%
- Explanation, tests, or artifact quality: 10%

Assistance can reduce only the independence component. It never produces negative points.

### 13.3 Readiness dimensions

| Dimension | Weight |
|---|---:|
| Coding patterns and debugging | 30% |
| Full-stack engineering | 25% |
| Applied AI engineering | 20% |
| Aptitude and SQL | 15% |
| Communication and interview execution | 10% |

The product shows `Not enough evidence` until every dimension has at least two eligible observations and the learner has completed one weekly gate. Once visible, the score always includes a confidence label:

- Low: minimum evidence only or evidence older than 14 days.
- Medium: at least half of required independent observations and evidence in the last 7 days.
- High: all required observations, at least two retained re-tests, and a current gate.

Readiness bands:

- 0 to 49: Building foundations
- 50 to 64: Screening practice
- 65 to 79: Interviewing with gaps
- 80 to 100: Ready to schedule, subject to dimension floors

`Ready to schedule` also requires no dimension below 65 and a passed current mock. The score may decline when retained performance decays. Every change must be explainable from visible evidence.

### 13.4 Streak

- A streak day requires at least 20 active minutes and one graded evidence item.
- Completing the full 150-minute plan is tracked separately.
- All 28 calendar days are scheduled. Consolidation/recovery days use lower-intensity retained evidence rather than new core content.
- An administrator-configured accommodation day is neutral and cannot lower readiness.
- Two recovery tokens are available per four-week sprint.
- A token is consumed only after the learner confirms it on the next visit.
- Timezone changes do not retroactively create or erase days; the change takes effect at the next local midnight.
- Opening the app, watching a video, or leaving a timer running cannot protect a streak.

### 13.5 XP and friend scoreboard

Weekly XP rewards evidence, not raw volume:

| Evidence | XP |
|---|---:|
| Daily evidence floor | 5 |
| Full planned day | 10 additional |
| New independent problem | 12 |
| Retained independent re-solve | 8 |
| Lab artifact passing its tests | 15 |
| Weekly gate completed | 20 |
| Helpful peer accountability check-in | 3, maximum 3 per week |

Rules:

- Assisted attempts can receive completion XP but not the independent-problem bonus.
- Repeating the same easy item earns no additional XP after the scheduled review.
- Daily and weekly caps prevent farming.
- The board resets every Monday in the cohort timezone.
- Participation is opt-in and a nickname may be used.
- Personal improvement and nearest peers appear before the full ranking.
- The board never exposes readiness, failures, help usage, or exact time spent.
- The administrator can disable the board for a cohort.

This restrained design is intentional: systematic reviews report mixed gamification effects and note that persistent low leaderboard rank can reduce engagement or motivation.

## 14. Content and media system

### 14.1 Lesson content contract

Every lesson version contains:

- Plain-language title and one-sentence outcome.
- Interview purpose.
- Prerequisite list and rescue mappings.
- Intuition, precise definition, and analogy.
- One original concept illustration generated for this exact lesson and reviewed for factual accuracy.
- One deterministic, code-native diagram or interactive visualization that shows actual state, data, control flow, or architecture.
- Python and Java worked examples with expected output.
- Named steps, complexity, edge cases, and misconceptions.
- Prediction question and trace data.
- Editor task, explanation rubric, and fresh transfer.
- Video metadata, caption availability, original written equivalent, duration, publisher, license/link status, and fallback.
- Video-selection review covering correctness, lesson fit, spoiler risk, length, recency, captions, language, accessibility, and the date embedding was last verified.
- Source list and reviewer history.

### 14.2 Video policy

- Use NeetCode as the default external-video candidate for interview data structures, algorithms, and pattern recognition when a video matches the exact lesson objective. Use other reputable educators when their explanation is clearer, more current, more visual, better captioned, or better aligned with Python/Java and the required depth.
- High view count, likes, and recent engagement are discovery signals and tie-breakers, not proof of teaching quality. A video must first pass factual correctness, objective fit, clarity, spoiler risk, duration, recency, caption, language, and accessibility review.
- Show at most one primary video in the concept flow. An optional `More explanations` menu may contain at most two reviewed alternatives and must not become a recommendation feed.
- Embed only through the official YouTube player when the owner has enabled embedding. Do not download, rehost, clip, extract audio, suppress ads, alter player controls, or republish the creator's transcript without permission.
- Use YouTube privacy-enhanced mode, click-to-play rather than autoplay, the standard player controls, an origin/referrer configuration that satisfies YouTube requirements, and a clear privacy disclosure before the third-party player loads.
- Keep the unmodified video title and thumbnail, channel/creator attribution, `Watch on YouTube` link, duration, and lesson-specific reason for recommendation visible.
- YouTube captions remain in the YouTube player. Grindstone supplies its own original written explanation and accessible equivalent; it stores a third-party transcript only when the license or creator permission explicitly permits that use.
- The lesson remains complete when the video is unavailable.
- The concept page shows the video title, publisher, duration, learning purpose, and external-link disclosure before playback.
- Publish-time and scheduled link checks flag removals, embedding restrictions, age/region blocks, changed privacy status, and materially changed metadata. A failure switches to the original written/visual explanation and a direct YouTube link when appropriate.
- Videos are short and scoped to the current objective; a 45-minute lecture is not placed inside a 25-minute concept segment.
- Watching a YouTube video is optional, creates no readiness evidence by itself, and never earns watch-based XP or gates access to the next activity.

### 14.3 Visual policy

- Generated illustrations establish intuition and relationships; deterministic visualizers show runtime truth.
- Visualizers show actual state, data movement, pointers, stack frames, tree/graph traversal, request flow, SQL relations, embedding neighborhoods, retrieval ranking, or architecture.
- Decorative illustrations do not satisfy the visual requirement.
- Every visual has alt text and a non-visual equivalent.
- Animation includes pause, step, restart, speed, and reduced-motion behavior.
- Colors are redundant with shape, label, or position.
- No essential label, code, or explanation is baked only into a generated bitmap. Accessible HTML text or a code-native annotation layer carries it.

### 14.4 Generated image production

Grindstone uses original generated images deliberately, not as generic decoration.

1. The content author writes a visual brief containing the learning objective, entities, relationships, allowed states, forbidden inaccuracies, selected-language context, aspect ratio, and mobile crop.
2. OpenAI ImageGen creates the concept illustration in a consistent Grindstone art direction: charcoal ground, off-white structure, and restrained lime, cyan, amber, green, and red semantic accents. It must avoid gradients, decorative blobs, stock-like atmosphere, and fake UI.
3. The prompt asks for minimal or no embedded words and never asks the model to render source code. Labels and code are added as accessible, responsive UI outside the bitmap.
4. A content reviewer compares the image with the precise concept definition and rejects misleading object identity, pointer direction, ordering, cardinality, data flow, or architecture.
5. The approved source image is exported as optimized AVIF/WebP with a PNG fallback, stored locally, versioned with the lesson, and supplied in desktop and mobile-safe variants.
6. The asset record stores prompt, generation model, generation date, reviewer, version, alt text, provenance, and the learning claim it supports.
7. A generated image can explain intuition but can never prove program behavior. When the learner needs to inspect execution, the lesson uses the deterministic visualizer driven by the same trace fixtures as the worked example.

### 14.5 Content quality pipeline

1. Author original content against the schema.
2. Execute every code example and reference solution.
3. Verify visible, hidden, performance, and deliberately wrong fixtures.
4. Have an independent solver answer without the claimed solution.
5. Run ambiguity, duplicate, language-parity, accessibility, and source checks.
6. Quarantine any disagreement.
7. Publish only a versioned, auditable artifact.
8. Auto-retire on confirmed defects and preserve affected learner attempts for regrading.

AI may draft content but cannot publish it merely because another AI approved it. Executable verification is the primary gate; non-executable aptitude and communication content requires independent review and ambiguity checks.

### 14.6 Complete launch inventory

Friend launch requires completed content, not shells or `coming soon` entries:

- 28 primary day lesson bundles in Python and Java.
- 40 Core problem packages assigned by the sprint.
- 110 additional fully published Interview 150 problem packages.
- At least 800 original aptitude items balanced across numerical, logical, verbal, and data interpretation, including four gate forms and one spare equivalent form per gate.
- 28 capstone lab tasks for both language paths, including starter revision, tests, rubric, failure fixtures, and finished internal reference revision.
- One reviewed, generated original concept image, one deterministic visualization, and one verified video/transcript package for every primary concept lesson.
- Foundation-rescue packages for every prerequisite named by the 28 lessons.
- Four weekly gates, the final interview loop, and deterministic regrading fixtures.

An unpublished row, empty body, repeated generic question, unimplemented button, missing test harness, or media placeholder fails the launch inventory.

## 15. UX and visual design specification

### 15.1 Design direction

Grindstone should feel like a focused professional training environment, not a marketing site, game lobby, or admin dashboard.

- Neutral charcoal background: `#0B0C0E`.
- Primary surface: `#141619`.
- Border: `#2A2D31`.
- Primary text: `#F4F5F2`.
- Muted text: `#A8ADB4`.
- Primary action and current step: lime `#C7DD32` with near-black text.
- Luna/contextual help: cyan `#35C9D0`.
- Aptitude/timed warning: amber `#F4B84A`.
- Success: green `#48C78E`.
- Failure: red `#F36B6B`.

Color is semantic, not decorative. The interface must not become a one-hue lime dashboard.

### 15.2 Typography and density

- Inter, SF Pro, or system sans for UI.
- JetBrains Mono or the existing legible mono stack for code.
- Fixed rem scale; no viewport-width font scaling.
- Body copy at least 16px desktop and mobile.
- Prose limited to roughly 65 to 75 characters per line.
- Compact labels and panels use compact headings, not hero-sized type.

### 15.3 Components

- Lucide icons for familiar actions.
- Icon buttons have accessible names and tooltips where meaning is not universal.
- Buttons, tabs, fields, menus, and notices have default, hover, focus, active, disabled, loading, error, and success states.
- Cards have at most 8px radius and are used only for genuine repeated objects or tools.
- No cards inside cards and no floating-card page sections.
- Skeletons preserve layout during loading.
- Empty states explain the next action without product-tour prose.
- Motion lasts 150 to 250ms and communicates state only.

### 15.4 Responsive behavior

- Desktop lesson: content/editor center with a persistent Luna side panel.
- Tablet: resizable content/editor split with Luna drawer.
- Mobile: fixed activity tabs for Learn, Code, Output, and Luna; the primary action remains visible without covering editor content.
- Problem statements and console never force horizontal page scroll; code scroll is contained inside the editor.
- Fixed toolbars and timers have stable dimensions so labels and results cannot shift the layout.

## 16. Accessibility

Core flows must meet WCAG 2.2 AA.

- Full keyboard access, visible focus, logical focus order, skip links, and no keyboard traps in CodeMirror.
- Minimum 24 by 24 CSS pixel targets per WCAG 2.2, with a Grindstone design target of 44 by 44 for primary controls.
- Labels and instructions visible to all users, not only assistive technology.
- Errors identify the field, cause, and recovery action.
- Judge, save, AI-stream, timer, and completion updates use appropriate live status announcements without stealing focus.
- Contrast checked for text, icons, borders, editor tokens, focus rings, charts, and disabled controls.
- Captions and transcripts for video; alt text and text equivalents for diagrams.
- Reduced-motion mode turns animations into manual step changes.
- Timed assessments warn before expiry and support documented accommodations configured by an admin without changing question scoring.
- Editor font size, line height, theme, tab size, and keymap are configurable.

## 17. Functional requirements

### 17.1 Auth and profile

- `AUTH-01`: Google sign-in must enforce the allowlist server-side.
- `AUTH-02`: First sign-in creates user and profile atomically.
- `AUTH-03`: Setup auto-saves each field and resumes at the last incomplete field.
- `AUTH-04`: Session expiry preserves unsaved editor work locally and restores it after sign-in.
- `AUTH-05`: Deleting an account requires re-authentication, exports data first when requested, and removes personal data from active storage.

### 17.2 Planner and resume

- `PLAN-01`: Exactly one current next item exists per active learner.
- `PLAN-02`: Resume returns to the last meaningful position, editor revision, timer state, and allowed help level.
- `PLAN-03`: Planner changes include a plain-language reason.
- `PLAN-04`: Overdue reviews are capped and prioritized; missed days never create more than one recovery block.
- `PLAN-05`: Multi-tab writes use revision checks and present a recoverable conflict instead of last-write-wins data loss.

### 17.3 Judge and editor

- `CODE-01`: Python and Java run against version-pinned runtimes.
- `CODE-02`: Run uses visible tests; Submit uses visible and hidden tests.
- `CODE-03`: A network, compile, runtime, timeout, memory, judge, or malformed-response failure is never shown as a wrong answer.
- `CODE-04`: Drafts save locally within 500ms of idle and remotely within 2 seconds when online.
- `CODE-05`: Reset previews the affected changes and can be undone.
- `CODE-06`: Hidden tests never reach client payloads, AI context, logs, or analytics.

### 17.4 Tutor

- `AI-01`: Every turn is scoped to one user and lesson/problem/workspace context.
- `AI-02`: Tutor outputs stream, cancel, time out, and retry safely.
- `AI-03`: Assistance level is appended to the attempt event log.
- `AI-04`: Assessments block AI server-side as well as in the UI.
- `AI-05`: Prompt injection, solution leakage, cross-user context, malformed output, refusal, empty response, auth expiry, and quota exhaustion have automated tests.
- `AI-06`: The UI identifies Luna as AI and provides a report action on every response.

### 17.5 Progress

- `PROG-01`: Every readiness value links to the evidence that produced it.
- `PROG-02`: Regrading content recomputes affected evidence without changing unrelated XP events.
- `PROG-03`: Assisted attempts cannot become independent through a client-side change.
- `PROG-04`: Scoreboard opt-in, nickname, and visibility settings are enforced server-side.

### 17.6 Concept media

- `MEDIA-01`: Every published primary concept page includes a reviewed generated image, deterministic visualization, verified video/transcript package, written explanation, chosen-language example and editor, and Luna entry point.
- `MEDIA-02`: A generated image cannot publish without the required prompt/provenance metadata, factual review, alt text, and desktop/mobile-safe variants.
- `MEDIA-03`: Deterministic visualizer state must be generated from or verified against the same fixtures as the runnable worked example.
- `MEDIA-04`: A video or image failure never blocks the lesson; the written explanation and deterministic visualizer remain usable and the defect is reported automatically.
- `MEDIA-05`: Media is optimized, lazy-loaded below the fold, and given stable responsive dimensions so it cannot shift or overlap the editor.

## 18. Data model

The normalized source of truth should include:

- `users`, `accounts`, `sessions`, `profiles`, `cohorts`, `cohort_memberships`.
- `sprints`, `curriculum_days`, `session_instances`, `session_items`, `task_progress`.
- `competencies`, `prerequisites`, `lessons`, `lesson_variants`, `media_assets`, `visualizations`.
- `problems`, `problem_variants`, `problem_tests`, `problem_followups`, `content_versions`, `content_reports`.
- `attempts`, `attempt_events`, `predictions`, `explanations`, `hint_events`, `judge_runs`.
- `review_items`, `mastery_snapshots`, `readiness_snapshots`, `gate_results`.
- `workspaces`, `workspace_revisions`, `lab_artifacts`, `preview_sessions`.
- `tutor_threads`, `tutor_messages`, `ai_usage`, `ai_feedback`.
- `xp_events`, `streak_days`, `recovery_tokens`.
- `audit_runs`, `quarantines`, `regrade_jobs`.

Requirements:

- Attempt and XP events are append-only.
- Readiness and leaderboard rows are derived views or rebuildable snapshots.
- Content versions referenced by an attempt are immutable.
- Generated media records retain prompt, model/date, reviewer, provenance, responsive variants, alt text, and the exact lesson version that uses them.
- AI account tokens are never database fields.
- User deletion and content-retention rules are documented per table.
- All user-owned rows enforce ownership in the application and database query layer.

## 19. Technical architecture

Preserve the working infrastructure and replace the frontend information architecture, curriculum content, and legacy state model deliberately.

### 19.1 Preserved foundations

- Next.js 16 App Router and React 19.
- TypeScript.
- PostgreSQL 17 and Drizzle migrations.
- NextAuth/Auth.js Google login and email allowlist.
- CodeMirror 6.
- Judge adapter boundary with Piston and Docker-run containment fallback.
- Separate read-only SQL sandbox.
- Redis and BullMQ.
- Codex App Server integration.
- Docker hosting, Cloudflare Tunnel, health checks, and rotating backups.

### 19.2 Required additions

- PostgreSQL vector extension or a separately isolated vector service; v2 chooses PostgreSQL with `pgvector` to keep operations simple.
- Persistent per-user project workspace service.
- Authenticated preview proxy.
- Normalized curriculum/session/attempt schema.
- Streaming tutor transport and explicit rate-limit status.
- Content/media versioning and broken-link monitoring.
- OpenTelemetry-compatible request, judge, workspace, and tutor telemetry without learner code or prompts in default logs.

### 19.3 Trust boundaries

1. Browser is untrusted.
2. Learner code is untrusted and executes only in a constrained judge or workspace container.
3. Learner SQL reaches only the separate sandbox database.
4. Learner prompts and retrieved notes are untrusted data, not instructions.
5. Luna has no tools or direct database/file access.
6. Codex credentials exist only in the host-side Codex volume.
7. Hidden tests and reference solutions remain server-only.
8. Cloudflare is the only public ingress; internal services are not publicly bound.

## 20. Security and privacy

- Use secure, HTTP-only, same-site cookies; CSRF protection; session rotation; and re-authentication for destructive actions.
- Enforce allowlist and admin role checks on every protected route, not only navigation.
- Validate and size-limit all prompts, code, uploads, URLs, and JSON.
- Apply per-user, per-IP, and global rate limits to judge, AI, workspace, and auth endpoints.
- Keep code execution networkless, resource-limited, non-root, and without Docker socket access.
- Run the judge smoke suite for infinite loops, memory exhaustion, process bombs, filesystem writes, and outbound network.
- Treat retrieved documents as untrusted and delimit them from tutor instructions.
- Never render AI output as HTML, SQL, shell, or code to execute without validation and an explicit learner action.
- Test prompt injection, sensitive information disclosure, improper output handling, excessive agency, vector-store tenant leakage, misinformation, and unbounded consumption based on the OWASP LLM risk model.
- Encrypt backups at rest when they leave the host and test restoration monthly.
- Log security events and service metadata, but redact tokens, learner code, prompts, note bodies, hidden tests, and email addresses.
- Provide data export and deletion for each learner.

## 21. Failure states and edge cases

| Situation | Required behavior |
|---|---|
| AI model unavailable | Keep lesson and editor usable, show static hints, preserve prompt, show retry and status |
| Owner ChatGPT login expired | Admin alert; learners see AI temporarily unavailable, never a login prompt for the owner's account |
| AI rate limit reached | Show reset information when available; queue nothing silently; no fallback model |
| AI returns a full answer too early | Block or redact against the help contract, record eval failure, offer the correct smaller hint |
| Prompt injection in learner code or notes | Treat as quoted data; no tools; do not reveal prompt, secrets, hidden tests, or other users |
| Judge unavailable | Preserve code and attempt; identify service failure; do not mark incorrect or stop session completion |
| Compile/runtime/timeout/memory errors | Distinct diagnosis with public output only and a focused recovery action |
| Browser goes offline | Continue reading and local editing; queue safe saves; disable server runs with a clear state |
| Save conflict across tabs | Keep both revisions, show a diff, and let the learner choose; never silently overwrite |
| Broken video or blocked embed | Use transcript and internal explanation; report link automatically |
| Generated concept image missing or inaccurate | Keep the deterministic visualization and written explanation available, quarantine the image, and block that lesson version from publication until review |
| Visualization cannot trace code | Explain limitation and fall back to a manually authored state sequence |
| Learner changes Python/Java before Day 2 | Regenerate starter state with no readiness penalty |
| Learner changes language after Day 2 | Preserve history, create a new language workspace, map completed concepts, require language-specific re-solves before independent credit |
| Java learner reaches AI lab | Explain why Python is used; open scaffolded sidecar tasks, keep Java backend intact |
| Missing prerequisite | Start foundation rescue inline and schedule a short review; do not redirect away |
| Learner finishes early | End the day when evidence is complete; optional library work does not inflate readiness |
| Learner exceeds 150 minutes | Save and offer stop/resume; do not encourage fatigue to preserve a badge |
| Learner misses one day | Create one recovery block, move lower-priority extension, keep core outcome |
| Learner misses three or more days | Offer a revised calendar or repeat the current week; never stack all missed tasks |
| Weekly gate fails | Add targeted repair and show exact evidence gap; do not fake pass or lock the whole product |
| Content item is wrong | Quarantine, notify affected learners, regrade from immutable attempt data, and explain any score change |
| Hidden test is ambiguous | Remove it from scoring until reviewed; never expose it as a hint |
| Scoreboard tie | Rank by independent retained evidence, then gate completion time; display equal rank when still tied |
| Low-ranked learner | Emphasize personal improvement, allow opt-out, avoid push notifications about rank loss |
| Timezone or DST change | Freeze completed day boundaries and apply new timezone next midnight |
| Sprint end | Preserve access, produce next plan, and keep 150 library progress; do not reset evidence |
| Mobile screen too small for capstone | Allow lesson/review and show desktop recommendation; never render overlapping unusable panes |
| Host disk nearing limit | Stop new workspaces/content jobs before user data writes fail; alert admin and preserve running drafts |
| Backup or restore failure | Fail health/ops check, alert admin, and do not claim backups are healthy |

## 22. Migration from the current product

### 22.1 What is replaced

- Current global navigation and the 13-destination mental model.
- Role/route choices, C++ choice, and user-facing tier terminology.
- Separate Learn, Practice, Mock, Drive, Lab, Design, HR, League, and Sprint Review destinations.
- The current lesson copy, visual hierarchy, and opaque pedagogy labels.
- Snapshot JSON as the long-term primary source of truth.

### 22.2 What is preserved

- Users, auth accounts, sessions, allowlists, and admin assignments.
- Code attempts, lesson drafts, predictions, explanations, and help history.
- Published content only when it passes the new schema and language rules.
- Judge adapters, SQL sandbox, AI integration, worker, health checks, hosting, and backups.
- XP events as historical activity, clearly separated from v2 readiness.

### 22.3 Migration rules

1. Add new schema without dropping old tables.
2. Backfill profiles and map Python/Java; C++ users must choose Python or Java on first v2 visit.
3. Convert existing attempts and lesson state into immutable v2 evidence with `legacy` provenance.
4. Create a 28-day sprint instance and map only equivalent completed competencies.
5. Recompute readiness under v2 rules; never carry over an unexplained old number.
6. Run parity reports before enabling new writes.
7. Deploy redirects and a reversible feature flag.
8. Keep old reads available to admins for one release.
9. Remove old routes and code only after data reconciliation, end-to-end parity, and backup restore tests pass.

## 23. Analytics and observability

Track only events needed to improve learning and reliability:

- Setup started/completed and field where abandonment occurred.
- Start/resume, task completion, save conflict, and recovery-plan changes.
- Prediction correctness, run, submit, outcome class, duration, assistance level, and transfer result.
- Foundation rescue topic and whether the learner returned successfully.
- Hint requested, level, latency, cancellation, and next-attempt progress.
- Video unavailable, generated image load failure, visualization used, and concept report.
- Gate outcomes, readiness evidence changes, and confidence.
- Workspace build/test/preview status and resource failures.
- Service latency/error rates for web, database, judge, AI, workspace, tunnel, and backups.

Do not send raw code, prompts, note bodies, hidden tests, OAuth data, or emails to analytics. Provide an admin cohort dashboard only after learner-facing flows are complete.

## 24. Performance and reliability targets

- p75 largest contentful paint under 2.5 seconds on a typical tunneled broadband connection.
- Core interaction response under 200ms when no server round trip is required.
- Draft local save under 500ms idle and remote acknowledgment under 2 seconds p95.
- Python visible-test result under 5 seconds p95; Java under 10 seconds p95 for normal tasks.
- AI first meaningful streamed content under 20 seconds p95 and complete response under 45 seconds p95.
- Workspace resume under 20 seconds p95 after an idle stop.
- Health endpoint reports database, Redis, judge, SQL sandbox, workspace capacity, AI status, disk, and last successful backup separately.
- Private-host target availability is 99% during configured cohort hours; planned maintenance is announced in advance.

## 25. Build sequence

### Phase 1: Product reset

- New design tokens and accessible component states.
- Four-route shell, profile menu, setup, Today, Curriculum, and redirects.
- Normalized session and progress schema with migration reports.

### Phase 2: Learning and problems

- New lesson workspace, generated concept-image pipeline, deterministic visualizers, video/transcript model, and Python/Java variants.
- Luna context contract, help ladder, streaming, ghost hint, and tutor evals.
- Interview 150 library schema, Core 40 content, judge harnesses, and transfer.

### Phase 3: Full-stack AI capstone

- Persistent isolated workspaces and preview proxy.
- Python/FastAPI and Java/Spring Boot templates.
- React/TypeScript, PostgreSQL/pgvector, AI sidecar, eval, security, and deployment tasks.

### Phase 4: Evidence and simulation

- Reviews, gates, readiness, streaks, XP, opt-in scoreboard, final loop, and recovery planning.

### Phase 5: Hardening and friend launch

- Content audit and regrade path.
- Security containment suite.
- Accessibility audit.
- Mobile and desktop visual QA.
- Backup restore drill and Windows-host smoke test.
- Observed usability session with at least three target learners who receive no coaching.

No phase is considered shipped because its page exists. It ships only when its end-to-end evidence path and failure states work.

## 26. Release acceptance criteria

### 26.1 Product

- A new user can sign in, complete setup, understand the promise, and start Day 1 without choosing a route or deciphering internal terminology.
- A returning user has one correct Resume action.
- All 28 days render with complete objectives, time budgets, activities, and evidence.
- Every primary concept page contains its reviewed generated image, deterministic visualization, verified video link with transcript/fallback, chosen-language example and editor, and persistent Luna access. None may be a placeholder.
- Every YouTube embed uses the official click-to-play player with creator attribution, an external YouTube link, privacy disclosure, unmodified controls, and an original Grindstone written equivalent; content audit rejects disabled embeds and unauthorized copied transcripts.
- The Core 40 manifest contains exactly 40 unique, published, Python/Java-tested problems.
- The library contains exactly 150 unique, fully published, Python/Java-tested problem packages. No placeholder or upcoming problem counts toward the 150.
- The capstone passes its final acceptance suite in both language paths.

### 26.2 AI

- Model and reasoning configuration are fixed and health-checked with no fallback.
- At least 100 scripted tutor evals cover concept questions, debugging, misconception handling, hint escalation, solution leakage, prompt injection, cross-user boundaries, refusal, timeout, empty output, and cancellation.
- No critical leakage or assessment-bypass eval fails.
- Static learning and grading continue when AI is unavailable.

### 26.3 Judge and workspace

- Python and Java reference solutions pass all visible, hidden, and performance tests.
- Deliberately wrong and suboptimal solutions fail the intended tests.
- Infinite loop, memory exhaustion, process bomb, filesystem escape, outbound network, hidden-test exposure, and cross-workspace access smoke tests fail safely.
- Workspace revision restore and multi-tab conflict recovery work.

### 26.4 UX and accessibility

- Today, Curriculum, lesson, problem, workspace, and Progress pass desktop and 390x844 mobile visual checks with no overlap or clipped actions.
- Every generated image and deterministic visualization renders nonblank at desktop and mobile sizes, keeps important content in frame, and matches its reviewed concept or trace fixture.
- Core journeys pass automated accessibility checks plus keyboard and screen-reader manual tests.
- All asynchronous states are visible and announced appropriately.
- Usability heuristic score is at least 36/40 with no heuristic below 3/4.
- Three first-time users can identify what to do next and what they are learning without assistance.

### 26.5 Operations

- Lint, typecheck, unit, integration, end-to-end, production build, content audit, Docker validation, judge containment, tutor eval, and migration tests pass.
- Windows-host deployment, tunnel, Google login, owner ChatGPT login, judge, workspace, and backup restore are tested on the actual host.
- Admin can identify service failure, disk pressure, expired AI auth, broken media, quarantined content, and failed backups without database access.

## 27. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Scope is too large for a four-week learning claim | Promise readiness practice, require 40 not 150, preserve post-sprint path |
| Intermediate start excludes weak learners | Inline foundation rescue, adaptive fade, visible prerequisites, no beginner-course redirect |
| Java learners are overwhelmed by Python and TypeScript | Explain fixed ecosystem roles up front, scaffold non-primary languages, assess outcomes rather than syntax trivia |
| AI gives answers and weakens learning | Help ladder, opt-in ghost hint, assistance-aware evidence, AI-off transfer and mocks |
| AI hallucinates or leaks data | Verified curriculum, scoped context, no tools, tenant isolation, evals, reports, OWASP-aligned testing |
| Owner account reaches limits or violates plan terms | Compliance gate, explicit rate status, quotas, no fallback, private non-commercial cohort until verified |
| 150-problem content is incomplete or legally risky | Original content, provenance, no scraping/republishing, publish status visible |
| Multi-file workspaces expand attack surface | Dedicated containers, no network, quotas, preview auth, containment tests, idle cleanup |
| Readiness number creates false confidence | Evidence links, confidence label, dimension floors, retained re-tests, honest wording |
| Leaderboard discourages lower-ranked learners | Opt-in, weekly reset, personal progress first, no readiness exposure, disable option |
| External videos disappear or distract | Written equivalent, captions/transcripts, link monitoring, short scoped media |
| Self-hosted PC sleeps, fills disk, or loses data | Cohort hours, health alerts, disk guardrails, rotating encrypted backups, restore drills |

## 28. Research basis

These sources inform the product but do not eliminate the need to test Grindstone with its own learners.

### Interview scope and practice products

- [LeetCode Top Interview 150](https://leetcode.com/studyplan/top-interview-150/) describes 150 comprehensive questions and recommends a preparation horizon of at least three months.
- [NeetCode 150](https://neetcode.io/practice/practice/neetcode150) describes its list as intended for learners already familiar with basic algorithms and data structures and provides the category distribution used as a coverage reference.
- [NeetCode's interview-concept video](https://www.youtube.com/watch?v=UrcwDOEBzZE) is an example of the channel's concise interview-pattern coverage; individual videos still require lesson-level review before selection.
- [CodeSignal Learn](https://codesignal.com/learn-app/) combines practice-based paths, an integrated IDE, and a context-aware AI tutor.
- [Codecademy's AI Learning Assistant](https://www.codecademy.com/resources/blog/behind-the-build-ai-learning-assistant) documents exercise/code context, selected-code explanations, prompt testing, and progressive hints instead of immediate answers.
- [YouTube's IFrame Player documentation](https://developers.google.com/youtube/iframe_api_reference) and [Developer Policies guide](https://developers.google.com/youtube/terms/developer-policies-guide) define the supported embed surface, attribution, controls, playback-integrity, referrer, privacy, and anti-incentive requirements used by Grindstone.

### Learning science and programming pedagogy

- [Dunlosky et al., Improving Students' Learning With Effective Learning Techniques](https://pubmed.ncbi.nlm.nih.gov/26173288/) supports practice testing and distributed practice as high-utility techniques.
- [A Review of Worked Examples in Programming Activities](https://eric.ed.gov/?id=EJ1381113) reviews code tracing, subgoals, visualization, incomplete examples, and Parsons-style activities in programming education.
- [Improving problem solving with subgoal labels](https://www.sciencedirect.com/science/article/abs/pii/S095947521530044X) reports improved programming problem solving when instruction and examples use subgoal labels.
- [PRIMM research summary](https://www.raspberrypi.org/blog/primm-talk-in-programming-lessons-research-seminar/) explains predict, run, investigate, modify, and make, and reports a controlled mixed-methods study with 493 students.
- [Productive Failure meta-analysis](https://journals.sagepub.com/doi/10.3102/00346543211019105) finds benefits when problem solving precedes instruction with high design fidelity, while also documenting conditions and limitations.

### Curriculum coverage

- [React Learn](https://react.dev/learn) and [React with TypeScript](https://react.dev/learn/typescript) cover components, data, events, state, and typed React code.
- [Full Stack Open](https://fullstackopen.com/en/part0/general_info/) provides a useful coverage reference for React, APIs, TypeScript, testing, debugging, containers, configuration, and databases. Grindstone does not copy its licensed course content.
- [FastAPI's official learning path](https://fastapi.tiangolo.com/learn/) covers APIs, dependencies, security, SQL, and testing.
- [Spring Boot testing reference](https://docs.spring.io/spring-boot/reference/testing/spring-boot-applications.html) informs Java backend test coverage.
- [PostgreSQL tutorial](https://www.postgresql.org/docs/current/tutorial.html) covers tables, queries, joins, aggregates, foreign keys, transactions, and window functions.
- [Google Machine Learning Crash Course exercises](https://developers.google.com/machine-learning/crash-course/exercises) use interactive and programming work across data, classification, overfitting, neural networks, embeddings, LLMs, production ML, and fairness.

### Aptitude, accessibility, security, and motivation

- [TCS iON NQT](https://www.tcsion.com/hub/national-qualifier-test/) defines numerical, reasoning, verbal, data-interpretation, and cognitive assessment coverage relevant to the initial cohort.
- [SHL numerical, deductive, and inductive sample](https://www.shl.com/assets/documents/product-factsheet-verify-g-plus.pdf) provides a workplace-assessment coverage reference. Grindstone questions remain original.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) is the accessibility conformance target.
- [W3C accessible forms tutorial](https://www.w3.org/WAI/tutorials/forms/) informs labels, instructions, grouping, and error recovery.
- [OWASP Top 10 for LLM and GenAI Applications](https://genai.owasp.org/llm-top-10/) informs prompt-injection, sensitive-information, output, agency, vector, misinformation, and consumption controls.
- [Systematic review of gamification and motivation](https://pmc.ncbi.nlm.nih.gov/articles/PMC10448467/) reports positive and negative effects, including negative feelings associated with low leaderboard rank and system failures.

### OpenAI integration

- [Official OpenAI authentication documentation](https://learn.chatgpt.com/docs/auth) documents ChatGPT and API-key sign-in modes for Codex clients and the policy differences between them.
- [Official Codex App Server documentation](https://learn.chatgpt.com/docs/app-server) documents embedding Codex in a product, ChatGPT-managed authentication, account status, rate limits, conversation events, and browser/device login flows.
- [Official GPT-5.6 model guidance](https://developers.openai.com/api/docs/guides/latest-model) identifies Luna as the efficient high-volume GPT-5.6 variant and documents configurable reasoning effort. Grindstone still must evaluate `xhigh` against latency and tutor quality in its own workload.

### Evidence limits

Vendor pages establish current product patterns, not causal learning effects. Much programming-education research studies formal courses or novices rather than adult interview preparation. The four-week schedule, readiness weights, hint ladder, scoreboard rules, and capstone scope are therefore explicit product hypotheses. They must be measured, reviewed after each cohort, and changed when Grindstone's evidence contradicts them.
