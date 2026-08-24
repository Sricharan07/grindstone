import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const routeEnum = pgEnum("route", [
  "foundations",
  "service-it",
  "product",
  "big-tech",
  "non-tech",
]);
export const sprintStatusEnum = pgEnum("sprint_status", [
  "draft",
  "active",
  "complete",
  "abandoned",
]);
export const contentStatusEnum = pgEnum("content_status", [
  "generated",
  "verified",
  "published",
  "quarantined",
  "retired",
]);
export const attemptOutcomeEnum = pgEnum("attempt_outcome", [
  "correct",
  "incorrect",
  "partial",
  "timeout",
  "error",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name"),
    email: text("email").notNull(),
    emailVerified: timestamp("email_verified", { withTimezone: true }),
    image: text("image"),
    ...timestamps,
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)],
);

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    sessionToken: text("session_token").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (table) => [index("sessions_user_idx").on(table.userId)],
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })],
);

export const profiles = pgTable("profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  route: routeEnum("route").notNull().default("foundations"),
  preferredLanguage: text("preferred_language").notNull().default("python"),
  driveDate: timestamp("drive_date", { withTimezone: true }),
  dailyMinutes: integer("daily_minutes").notNull().default(60),
  timezone: text("timezone").notNull().default("UTC"),
  diagnosticComplete: boolean("diagnostic_complete").notNull().default(false),
  ...timestamps,
});

export const learnerSnapshots = pgTable("learner_snapshots", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  revision: integer("revision").notNull().default(0),
  state: jsonb("state").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const diagnosticSessions = pgTable(
  "diagnostic_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    route: routeEnum("route"),
    answers: jsonb("answers").notNull().default(sql`'[]'::jsonb`),
    topicPriors: jsonb("topic_priors"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("diagnostic_sessions_user_idx").on(table.userId, table.createdAt)],
);

export const driveSessions = pgTable(
  "drive_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    packSlug: text("pack_slug").notNull(),
    sectionIndex: integer("section_index").notNull().default(0),
    answers: jsonb("answers").notNull().default(sql`'{}'::jsonb`),
    sectionScores: jsonb("section_scores"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    score: real("score"),
    ...timestamps,
  },
  (table) => [index("drive_sessions_user_idx").on(table.userId, table.createdAt)],
);

export const sprints = pgTable(
  "sprints",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    goal: text("goal").notNull(),
    route: routeEnum("route").notNull(),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    status: sprintStatusEnum("status").notNull().default("draft"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("sprints_user_number_idx").on(table.userId, table.number),
  ],
);

export const sprintWeeks = pgTable(
  "sprint_weeks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sprintId: uuid("sprint_id")
      .notNull()
      .references(() => sprints.id, { onDelete: "cascade" }),
    week: integer("week").notNull(),
    focus: text("focus").notNull(),
    loadFactor: real("load_factor").notNull(),
    gateScore: real("gate_score"),
    gatePassed: boolean("gate_passed"),
    recalibration: jsonb("recalibration"),
    ...timestamps,
  },
  (table) => [uniqueIndex("sprint_week_idx").on(table.sprintId, table.week)],
);

export const commitments = pgTable("commitments", {
  id: uuid("id").primaryKey().defaultRandom(),
  sprintId: uuid("sprint_id")
    .notNull()
    .references(() => sprints.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  implementationIntention: text("implementation_intention").notNull(),
  dailyFloorMinutes: integer("daily_floor_minutes").notNull().default(20),
  daysPerWeek: integer("days_per_week").notNull().default(6),
  stakeCents: integer("stake_cents"),
  public: boolean("public").notNull().default(true),
  ...timestamps,
});

export const checkins = pgTable(
  "checkins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sprintId: uuid("sprint_id")
      .notNull()
      .references(() => sprints.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    body: text("body").notNull(),
    completedMinutes: integer("completed_minutes"),
    mood: integer("mood"),
    ...timestamps,
  },
  (table) => [index("checkins_sprint_user_idx").on(table.sprintId, table.userId)],
);

export const concepts = pgTable("concepts", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  track: text("track").notNull(),
  tier: text("tier").notNull(),
  prerequisites: jsonb("prerequisites")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  bodyL1: text("body_l1").notNull(),
  bodyL2: text("body_l2").notNull(),
  bodyL3: text("body_l3").notNull(),
  ...timestamps,
});

export const workedExamples = pgTable("worked_examples", {
  id: uuid("id").primaryKey().defaultRandom(),
  conceptId: uuid("concept_id")
    .notNull()
    .references(() => concepts.id, { onDelete: "cascade" }),
  language: text("language").notNull(),
  code: text("code").notNull(),
  expectedOutput: text("expected_output").notNull(),
  subgoalLabels: jsonb("subgoal_labels")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  fadeLevel: integer("fade_level").notNull().default(0),
  traceable: boolean("traceable").notNull().default(true),
  ...timestamps,
});

export const parsonsItems = pgTable("parsons_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  conceptId: uuid("concept_id")
    .notNull()
    .references(() => concepts.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  blocks: jsonb("blocks").$type<Array<{ code: string; distractor?: boolean }>>().notNull(),
  solutionOrder: jsonb("solution_order").$type<number[]>().notNull(),
  ...timestamps,
});

export const questions = pgTable(
  "questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceKey: text("source_key").unique(),
    kind: text("kind").notNull(),
    topic: text("topic").notNull(),
    difficulty: real("difficulty").notNull(),
    prompt: text("prompt").notNull(),
    payload: jsonb("payload").notNull(),
    explanation: text("explanation").notNull(),
    status: contentStatusEnum("status").notNull().default("generated"),
    verification: jsonb("verification"),
    reportCount: integer("report_count").notNull().default(0),
    ...timestamps,
  },
  (table) => [index("questions_topic_status_idx").on(table.topic, table.status)],
);

export const problems = pgTable("problems", {
  id: uuid("id").primaryKey().defaultRandom(),
  leetcodeId: integer("leetcode_id"),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  statement: text("statement").notNull(),
  difficulty: text("difficulty").notNull(),
  tier: text("tier").notNull(),
  tags: jsonb("tags").$type<string[]>().notNull(),
  optimalTime: text("optimal_time").notNull(),
  optimalSpace: text("optimal_space").notNull(),
  followups: jsonb("followups").$type<string[]>().notNull(),
  sourceUrl: text("source_url"),
  status: contentStatusEnum("status").notNull().default("generated"),
  ...timestamps,
});

export const problemTests = pgTable(
  "problem_tests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    problemId: uuid("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    input: text("input").notNull(),
    expectedOutput: text("expected_output").notNull(),
    performance: boolean("performance").notNull().default(false),
    scale: integer("scale"),
    hidden: boolean("hidden").notNull().default(true),
  },
  (table) => [index("problem_tests_problem_idx").on(table.problemId)],
);

export const codebaseTasks = pgTable("codebase_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  language: text("language").notNull(),
  repositoryFixture: text("repository_fixture").notNull().unique(),
  plantedBugs: jsonb("planted_bugs").$type<string[]>().notNull(),
  rubric: jsonb("rubric").notNull(),
  status: contentStatusEnum("status").notNull().default("generated"),
  ...timestamps,
});

export const aiFluencyTasks = pgTable("ai_fluency_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  injectedFlaw: text("injected_flaw").notNull(),
  detectionRubric: jsonb("detection_rubric").notNull(),
  ...timestamps,
});

export const attempts = pgTable(
  "attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    itemType: text("item_type").notNull(),
    itemId: text("item_id").notNull(),
    outcome: attemptOutcomeEnum("outcome").notNull(),
    answer: jsonb("answer"),
    language: text("language"),
    code: text("code"),
    durationMs: integer("duration_ms").notNull(),
    timed: boolean("timed").notNull().default(true),
    scaffoldLevel: integer("scaffold_level").notNull().default(0),
    measuredComplexity: text("measured_complexity"),
    complexityConfidence: real("complexity_confidence"),
    communicationScore: real("communication_score"),
    ...timestamps,
  },
  (table) => [index("attempts_user_created_idx").on(table.userId, table.createdAt)],
);

export const predictions = pgTable("predictions", {
  id: uuid("id").primaryKey().defaultRandom(),
  attemptId: uuid("attempt_id").references(() => attempts.id, {
    onDelete: "cascade",
  }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  predictedSuccess: real("predicted_success").notNull(),
  predictedOutput: text("predicted_output"),
  rationale: text("rationale"),
  ...timestamps,
});

export const teachBacks = pgTable("teach_backs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  conceptId: uuid("concept_id")
    .notNull()
    .references(() => concepts.id, { onDelete: "cascade" }),
  response: text("response").notNull(),
  aiFeedback: text("ai_feedback"),
  score: real("score"),
  ...timestamps,
});

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  itemType: text("item_type").notNull(),
  itemId: text("item_id").notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
  stability: real("stability").notNull(),
  difficulty: real("difficulty").notNull(),
  fsrsState: jsonb("fsrs_state").notNull(),
  ...timestamps,
}, (table) => [uniqueIndex("reviews_user_item_idx").on(table.userId, table.itemType, table.itemId)]);

export const mastery = pgTable(
  "mastery",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    topic: text("topic").notNull(),
    rating: real("rating").notNull().default(0.25),
    confidence: real("confidence").notNull().default(0),
    attempts: integer("attempts").notNull().default(0),
    calibrationError: real("calibration_error").notNull().default(0),
    ...timestamps,
  },
  (table) => [primaryKey({ columns: [table.userId, table.topic] })],
);

export const traces = pgTable("traces", {
  id: uuid("id").primaryKey().defaultRandom(),
  attemptId: uuid("attempt_id")
    .notNull()
    .references(() => attempts.id, { onDelete: "cascade" }),
  frames: jsonb("frames").notNull(),
  ...timestamps,
});

export const companyPacks = pgTable("company_packs", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  company: text("company").notNull(),
  roleFamily: text("role_family").notNull(),
  loopShape: jsonb("loop_shape").notNull(),
  aiPolicy: jsonb("ai_policy").notNull(),
  lastVerified: timestamp("last_verified", { withTimezone: true }).notNull(),
  ...timestamps,
});

export const mockSessions = pgTable("mock_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  companyPackId: uuid("company_pack_id").references(() => companyPacks.id),
  kind: text("kind").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  score: real("score"),
  rubricScores: jsonb("rubric_scores"),
  debrief: text("debrief"),
  ...timestamps,
});

export const starStories = pgTable("star_stories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  situation: text("situation").notNull(),
  task: text("task").notNull(),
  action: text("action").notNull(),
  result: text("result").notNull(),
  metrics: text("metrics"),
  principles: jsonb("principles").$type<string[]>().notNull(),
  ...timestamps,
});

export const xpEvents = pgTable(
  "xp_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    attemptId: uuid("attempt_id").references(() => attempts.id),
    amount: integer("amount").notNull(),
    reason: text("reason").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("xp_events_user_created_idx").on(table.userId, table.createdAt)],
);

export const aiUsage = pgTable(
  "ai_usage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    purpose: text("purpose").notNull(),
    model: text("model").notNull(),
    inputTokens: integer("input_tokens").notNull(),
    outputTokens: integer("output_tokens").notNull(),
    costUsd: real("cost_usd").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("ai_usage_created_idx").on(table.createdAt)],
);

export const contentReports = pgTable(
  "content_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    questionId: uuid("question_id").references(() => questions.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    reason: text("reason").notNull(),
    details: text("details"),
    resolved: boolean("resolved").notNull().default(false),
    ...timestamps,
  },
  (table) => [index("content_reports_question_idx").on(table.questionId, table.createdAt)],
);

export const contentBatches = pgTable(
  "content_batches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    purpose: text("purpose").notNull(),
    requested: integer("requested").notNull(),
    generated: integer("generated").notNull().default(0),
    published: integer("published").notNull().default(0),
    quarantined: integer("quarantined").notNull().default(0),
    estimatedCostUsd: real("estimated_cost_usd").notNull().default(0),
    actualCostUsd: real("actual_cost_usd").notNull().default(0),
    status: text("status").notNull().default("queued"),
    error: text("error"),
    ...timestamps,
  },
  (table) => [index("content_batches_created_idx").on(table.createdAt)],
);
