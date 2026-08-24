import { SPRINT_DAYS } from "@/lib/curriculum/catalog";
import { LEARNING_LESSONS, learningLesson, type LessonSlug } from "@/lib/learning/catalog";

export type ProblemDifficulty = "Easy" | "Medium" | "Hard";

export interface InterviewProblem {
  slug: string;
  title: string;
  lessonSlug: LessonSlug;
  pattern: string;
  difficulty: ProblemDifficulty;
  core: boolean;
  day?: number;
  prompt: string;
  inputFormat: string;
  examples: Array<{ input: string; output: string }>;
  constraints: string[];
}

const learningDays = SPRINT_DAYS.filter((day) => day.kind === "learn" && day.lessonSlug);

const coreProblems: InterviewProblem[] = learningDays.flatMap((day, problemIndex) => {
  const lesson = learningLesson(day.lessonSlug!);
  return day.problems.map((title, index) => ({
    slug: `core-${day.day}-${index + 1}-${lesson.slug}`,
    title,
    lessonSlug: lesson.slug,
    pattern: lesson.area,
    difficulty: (problemIndex * 2 + index < 14 ? "Easy" : problemIndex * 2 + index === 39 ? "Hard" : "Medium") as ProblemDifficulty,
    core: true,
    day: day.day,
    prompt: `In ${title}, ${lesson.outcome.toLowerCase()} Implement solve(raw) for the input contract below. Return only the requested value so the evaluator can compare it exactly.`,
    inputFormat: lesson.inputFormat,
    examples: lesson.visibleCases,
    constraints: [lesson.complexity, "Handle empty, minimal, duplicate, and boundary inputs allowed by the contract.", "Do not print diagnostic text from solve(raw)."],
  }));
});

const supplementalTitles: Record<LessonSlug, string[]> = {
  "array-scan": ["Highest Temperature", "Peak Transaction", "Largest Negative", "Top Sensor Value", "Maximum Daily Load", "Best Score So Far"],
  "hashmap-two-sum": ["Invoice Pair", "Complement Lookup", "Two Prices to Budget", "First Target Pair", "Duplicate Value Pair", "Signed Pair Target"],
  "two-pointers": ["Sorted Fare Pair", "Two-End Sum", "Ordered Pair Search", "Closest Proven Pair", "Negative and Positive Pair", "Boundary Pointer Audit"],
  "prefix-sums": ["Ledger Range Total", "Repeated Segment Sum", "Telemetry Slice Total", "Inclusive Range Query", "Signed Range Balance", "Single-Cell Range"],
  "minimum-window": ["Shortest Capacity Window", "Minimum Sales Span", "Target Work Block", "Smallest Threshold Slice", "Single-Item Window", "Unreachable Window"],
  "stack-matching": ["Template Delimiters", "Nested Configuration", "Balanced Expression", "Empty Document Check", "Mismatched Closure", "Deeply Nested Input"],
  "binary-search": ["Catalog Lookup", "Missing Ordered Value", "Negative Index Search", "Single Record Search", "Right-Edge Lookup", "Large Ordered Index"],
  "copy-with-intent": ["Snapshot Before Update", "Independent Score Backup", "Audit Trail Copy", "Mutable Draft Split", "Preserved Original List", "Copy Then Append"],
  "recursive-factorial": ["Recursive Sequence Product", "Zero Base Case", "Small Factorial", "Large Factorial Trace", "Call-Stack Product", "Base-Case Audit"],
  "tree-levels": ["Org Chart by Level", "Breadth-First Rows", "Sparse Tree Levels", "Single Root Level", "Uneven Frontier", "Complete Tree Rows"],
  "bst-validation": ["Bounded Search Tree", "Deep Ordering Violation", "Valid Single Node", "Right-Subtree Violation", "Global BST Check"],
  "heap-top-k": ["Frequent Search Terms", "Top Event Codes", "Most Common Values", "Single Top Frequency", "Tied Frequency Set"],
  "all-subsets": ["Feature Flag Combinations", "Permission Bundles", "Empty Choice Set", "Four-Item Power Set", "Decision Tree Leaves"],
  "graph-components": ["Disconnected Services", "Friend Group Count", "Isolated Nodes", "Cyclic Component", "Network Region Count"],
  "course-order": ["Build Dependency Check", "Cyclic Course Plan", "Parallel Prerequisites", "Single Dependency", "Deploy Order Feasibility"],
  "shortest-grid-route": ["Warehouse Grid Route", "Blocked Start Path", "Single Cell Route", "Narrow Corridor", "Unreachable Destination"],
  "merge-intervals": ["Meeting Window Merge", "Touching Reservations", "Contained Maintenance Window", "Disjoint Ranges", "Overlapping Deploy Slots"],
  "dynamic-programming": ["Non-Adjacent Revenue", "House Selection", "Empty Opportunity Set", "Alternating Maximum", "Single Choice Maximum"],
  "grid-paths": ["Autonomous Grid Routes", "Single Row Routes", "Rectangular Grid Paths", "Warehouse Path Count", "One-Column Routes"],
  "unique-value-bits": ["Unpaired Event ID", "Unique Signed Value", "Single Sensor Code", "Cancellation Invariant", "Odd Occurrence Value"],
};

const supplementalProblems: InterviewProblem[] = LEARNING_LESSONS.flatMap((lesson, lessonIndex) => {
  const count = lessonIndex < 10 ? 6 : 5;
  return supplementalTitles[lesson.slug].slice(0, count).map((title, challengeIndex) => ({
    slug: `library-${lesson.slug}-${challengeIndex + 1}`,
    title,
    lessonSlug: lesson.slug,
    pattern: lesson.area,
    difficulty: (challengeIndex < 2 ? "Easy" : challengeIndex < 5 ? "Medium" : "Hard") as ProblemDifficulty,
    core: false,
    prompt: `${lesson.intuition} For ${title}, implement solve(raw) using the input contract below and preserve the stated complexity.`,
    inputFormat: lesson.inputFormat,
    examples: lesson.visibleCases,
    constraints: [lesson.complexity, lesson.definition, challengeIndex >= 4 ? "Solve without revealing the concept panel or requesting a completion hint." : "Explain one invariant after the tests pass."],
  }));
});

export const PROBLEM_LIBRARY = [...coreProblems, ...supplementalProblems];

export function problemBySlug(slug: string | undefined) {
  return PROBLEM_LIBRARY.find((problem) => problem.slug === slug);
}

export function scheduledProblems(day: number) {
  return PROBLEM_LIBRARY.filter((problem) => problem.day === day);
}
