import type { Language } from "@/lib/judge/types";

export const LESSON_IDS = [
  "copy-with-intent",
  "array-scan",
  "hashmap-two-sum",
  "two-pointers",
  "minimum-window",
  "prefix-sums",
  "binary-search",
  "stack-matching",
  "recursive-factorial",
  "graph-components",
  "heap-top-k",
  "dynamic-programming",
] as const;

export type LessonId = (typeof LESSON_IDS)[number];

export interface Lesson {
  id: LessonId;
  title: string;
  topic: string;
  minutes: number;
  purpose: string;
  interviewUse: string;
  concept: string;
  mentalModel: string[];
  complexity: string;
  inputFormat: string;
  workedExample: Record<Language, string>;
  visibleCases: Array<{ input: string; output: string }>;
  prediction: string;
  hints: [string, string, string, string];
  transferPrompt: string;
}

export interface CurriculumSession {
  id: string;
  week: 1 | 2 | 3 | 4;
  order: number;
  kind: "learn" | "practice" | "checkpoint" | "mock";
  title: string;
  purpose: string;
  minutes: number;
  lessonId?: LessonId;
}

const examples = (python: string, java: string, cpp: string): Record<Language, string> => ({ python, java, cpp });

export const LESSONS: Lesson[] = [
  {
    id: "copy-with-intent",
    title: "Copy mutable data without accidental sharing",
    topic: "Coding foundations",
    minutes: 22,
    purpose: "Avoid state bugs caused by two variables pointing at the same mutable object.",
    interviewUse: "Interviewers use small mutation examples to test whether your mental model matches the language.",
    concept: "Assignment usually copies a reference, not the object. Create a new collection when later mutation must be independent.",
    mentalModel: ["A variable names a value or object.", "Two names can reach one mutable object.", "A shallow copy creates a new outer collection."],
    complexity: "Copying n values costs O(n) time and O(n) space.",
    inputFormat: "Comma-separated scores, a pipe, then a score to append. Return the original copy.",
    workedExample: examples("backup = scores.copy()", "List<Integer> backup = new ArrayList<>(scores);", "vector<int> backup = scores;"),
    visibleCases: [{ input: "72,81|94", output: "72,81" }, { input: "5|8", output: "5" }],
    prediction: "If backup and scores share the same object, what changes after append?",
    hints: ["Draw two variable names and the objects they point to.", "The copy must happen before the append.", "Use the language's collection copy operation.", "Return the copied values joined by commas."],
    transferPrompt: "Solve again with a new input without opening a hint. This proves the idea transferred beyond the example.",
  },
  {
    id: "array-scan",
    title: "Scan an array with one clear invariant",
    topic: "Arrays",
    minutes: 24,
    purpose: "Turn a vague loop into a statement that is true after every iteration.",
    interviewUse: "Array scans are the base case for counting, aggregation, and later pointer techniques.",
    concept: "Keep the best answer seen so far. After index i, the stored answer must be correct for the prefix ending at i.",
    mentalModel: ["Initialize from real data, not a magic value.", "Update once per item.", "State the prefix invariant aloud."],
    complexity: "One pass is O(n) time and O(1) extra space.",
    inputFormat: "Comma-separated integers. Return the largest integer.",
    workedExample: examples("best = max(best, value)", "best = Math.max(best, value);", "best = max(best, value);"),
    visibleCases: [{ input: "-3,7,2", output: "7" }, { input: "-8,-2,-5", output: "-2" }],
    prediction: "Why does initializing best to zero fail on an all-negative input?",
    hints: ["Test your initialization with only negative values.", "Start from the first parsed value.", "Scan the remaining values and update best.", "Return best as text."],
    transferPrompt: "Run the hidden cases without assistance, then explain the invariant in one sentence.",
  },
  {
    id: "hashmap-two-sum",
    title: "Trade memory for constant-time lookup",
    topic: "Hash maps",
    minutes: 32,
    purpose: "Recognize when storing prior values removes a nested search.",
    interviewUse: "Two Sum is a compact test of complement reasoning, edge cases, and complexity communication.",
    concept: "At each value, ask whether its complement was seen earlier. Only store the current value after checking it.",
    mentalModel: ["Target minus current value is the complement.", "The map stores value to index.", "Check before insert so one element is not reused."],
    complexity: "Expected O(n) time and O(n) space.",
    inputFormat: "Comma-separated integers, a pipe, then the target. Return two zero-based indexes as i,j.",
    workedExample: examples("seen[value] = index", "seen.put(value, index);", "seen[value] = index;"),
    visibleCases: [{ input: "2,7,11,15|9", output: "0,1" }, { input: "3,3|6", output: "0,1" }],
    prediction: "For [3, 3] and target 6, why must lookup happen before insertion?",
    hints: ["Name the value needed to complete the target.", "Store values already passed, not future values.", "Check target - value in the map.", "Return the saved index and current index."],
    transferPrompt: "Solve a fresh case with duplicates and no hint; then state the time-space tradeoff.",
  },
  {
    id: "two-pointers",
    title: "Use sorted order to eliminate impossible pairs",
    topic: "Two pointers",
    minutes: 28,
    purpose: "Replace a quadratic pair search with decisions based on sorted order.",
    interviewUse: "This pattern appears in pair sums, deduplication, partitioning, and interval work.",
    concept: "When the sum is too small, only moving the left pointer can help; when too large, move the right pointer.",
    mentalModel: ["Pointers bound the remaining search space.", "Every move discards impossible pairs.", "The input must be sorted for the proof to hold."],
    complexity: "O(n) time and O(1) extra space.",
    inputFormat: "Sorted comma-separated integers, a pipe, then target. Return the matching indexes i,j.",
    workedExample: examples("left, right = 0, len(values) - 1", "int left = 0, right = values.length - 1;", "int left = 0, right = values.size() - 1;"),
    visibleCases: [{ input: "1,2,3,4,6|6", output: "1,3" }, { input: "2,3,4|6", output: "0,2" }],
    prediction: "If the sum is too small, why can every pair using the current left value be discarded?",
    hints: ["Start at both ends of the sorted input.", "Compare the current sum with target.", "Move exactly one pointer each iteration.", "Return when the sum matches."],
    transferPrompt: "Solve an unseen sorted input without help and explain why no valid pair was skipped.",
  },
  {
    id: "minimum-window",
    title: "Grow and shrink a sliding window",
    topic: "Sliding window",
    minutes: 34,
    purpose: "Track a contiguous range without recomputing every possible range.",
    interviewUse: "Window questions test whether you can maintain enough state while two boundaries move.",
    concept: "Grow the right edge until the condition is met, then shrink the left edge while it stays met.",
    mentalModel: ["The window is always contiguous.", "The running sum changes only at the edges.", "Shrink greedily after the target is reached."],
    complexity: "O(n) time because each edge moves at most n times; O(1) extra space.",
    inputFormat: "Positive comma-separated integers, a pipe, then target sum. Return the shortest qualifying length or 0.",
    workedExample: examples("while total >= target:", "while (total >= target) {", "while (total >= target) {"),
    visibleCases: [{ input: "2,3,1,2,4,3|7", output: "2" }, { input: "1,1,1|5", output: "0" }],
    prediction: "Why is it safe to shrink immediately once a positive-number window reaches the target?",
    hints: ["Keep left, total, and best.", "Add the new right value first.", "While the sum qualifies, update best and remove the left value.", "Use 0 when best was never updated."],
    transferPrompt: "Pass a new case without hints, then explain why positivity matters to this window rule.",
  },
  {
    id: "prefix-sums",
    title: "Precompute repeated range totals",
    topic: "Prefix sums",
    minutes: 26,
    purpose: "Answer many range-sum questions without rescanning the same values.",
    interviewUse: "Prefix state appears in subarray sums, balance points, matrices, and analytics questions.",
    concept: "prefix[i] stores the total before index i, so range left through right is prefix[right + 1] - prefix[left].",
    mentalModel: ["Start prefix with zero.", "Each new entry extends the previous total.", "Subtract the part before the requested range."],
    complexity: "O(n) preprocessing, O(1) per query, O(n) space.",
    inputFormat: "Comma-separated integers, a pipe, then left,right. Return the inclusive range sum.",
    workedExample: examples("answer = prefix[right + 1] - prefix[left]", "int answer = prefix[right + 1] - prefix[left];", "int answer = prefix[right + 1] - prefix[left];"),
    visibleCases: [{ input: "1,2,3,4|1,3", output: "9" }, { input: "5,-2,7|0,1", output: "3" }],
    prediction: "What does the leading zero let you avoid when left is zero?",
    hints: ["Build a prefix list of length n + 1.", "prefix[0] is zero.", "Use right + 1 for an inclusive right boundary.", "Subtract prefix[left]."],
    transferPrompt: "Answer a fresh range query without help and draw which two prefixes are subtracted.",
  },
  {
    id: "binary-search",
    title: "Cut a sorted search space in half",
    topic: "Binary search",
    minutes: 30,
    purpose: "Use a monotonic condition to discard half of the remaining candidates.",
    interviewUse: "Binary search is tested both on arrays and on abstract answer spaces.",
    concept: "Maintain an inclusive range that could still contain the target. Compare the midpoint, then discard the impossible half.",
    mentalModel: ["The target, if present, stays inside left..right.", "Midpoint is computed inside the current range.", "Each branch must make the range smaller."],
    complexity: "O(log n) time and O(1) extra space.",
    inputFormat: "Sorted comma-separated integers, a pipe, then target. Return its index or -1.",
    workedExample: examples("mid = left + (right - left) // 2", "int mid = left + (right - left) / 2;", "int mid = left + (right - left) / 2;"),
    visibleCases: [{ input: "1,3,5,7|5", output: "2" }, { input: "1,3,5,7|4", output: "-1" }],
    prediction: "Which update prevents an infinite loop after checking the midpoint?",
    hints: ["Use inclusive left and right bounds.", "Compare values[mid] with target.", "Discard mid too: use mid + 1 or mid - 1.", "Return -1 after the range becomes empty."],
    transferPrompt: "Solve both a present and absent target without hints and state your range invariant.",
  },
  {
    id: "stack-matching",
    title: "Match nested structure with a stack",
    topic: "Stacks",
    minutes: 27,
    purpose: "Recognize last-opened, first-closed structure.",
    interviewUse: "Stacks power delimiter checks, expression parsing, monotonic scans, and iterative traversal.",
    concept: "Push opening symbols. A closing symbol must match the most recent unmatched opening symbol.",
    mentalModel: ["The top is the only opening that may close next.", "A close with an empty stack fails.", "A valid input ends with an empty stack."],
    complexity: "O(n) time and O(n) worst-case space.",
    inputFormat: "A string containing only brackets. Return true or false in lowercase.",
    workedExample: examples("opening = stack.pop()", "char opening = stack.pop();", "char opening = stack.back(); stack.pop_back();"),
    visibleCases: [{ input: "([]{})", output: "true" }, { input: "([)]", output: "false" }],
    prediction: "Why does counting each bracket type fail on ([)]?",
    hints: ["Counts lose nesting order.", "Map each closing bracket to its opening bracket.", "Reject an empty or mismatched pop.", "At the end, the stack must be empty."],
    transferPrompt: "Pass a deeply nested unseen case without help and explain why the stack order matters.",
  },
  {
    id: "recursive-factorial",
    title: "Design recursion from a smaller promise",
    topic: "Recursion",
    minutes: 25,
    purpose: "Separate the base case from the recursive step and trust a smaller call.",
    interviewUse: "Recursive reasoning is the entry point to trees, backtracking, and memoization.",
    concept: "Define the smallest answer directly. For larger input, combine the current value with the answer for a smaller input.",
    mentalModel: ["Every path must reach a base case.", "The recursive call receives a smaller problem.", "The return value is combined on the way back."],
    complexity: "O(n) time and O(n) call-stack space.",
    inputFormat: "An integer n from 0 through 12. Return n factorial.",
    workedExample: examples("return n * factorial(n - 1)", "return n * factorial(n - 1);", "return n * factorial(n - 1);"),
    visibleCases: [{ input: "5", output: "120" }, { input: "0", output: "1" }],
    prediction: "What happens if the base case returns zero instead of one?",
    hints: ["Factorial of zero is one.", "Make a helper that returns a number.", "Call it with n - 1.", "Multiply n by the smaller answer."],
    transferPrompt: "Solve again without hints, then trace the calls and returns for n = 4.",
  },
  {
    id: "graph-components",
    title: "Traverse every connected component",
    topic: "Graphs",
    minutes: 38,
    purpose: "Use visited state to explore relationships without looping forever.",
    interviewUse: "Graph traversal models networks, dependencies, grids, permissions, and routes.",
    concept: "Start a traversal from every unvisited node. Each new start identifies one connected component.",
    mentalModel: ["Adjacency lists describe neighbors.", "Visited means scheduled or processed, not merely discovered later.", "The outer loop finds disconnected regions."],
    complexity: "O(V + E) time and O(V + E) space for the graph and traversal.",
    inputFormat: "Edges as a-b separated by commas, a pipe, then node count. Return the component count.",
    workedExample: examples("stack = [start]", "Deque<Integer> stack = new ArrayDeque<>();", "vector<int> stack = {start};"),
    visibleCases: [{ input: "0-1,1-2,3-4|5", output: "2" }, { input: "|3", output: "3" }],
    prediction: "Why must an isolated node still count as a component?",
    hints: ["Create a neighbor list for every node, even isolated ones.", "Loop over all node numbers.", "Start DFS or BFS only when a node is unvisited.", "Increment the component count for each new traversal."],
    transferPrompt: "Pass a disconnected hidden graph without assistance and explain when a node becomes visited.",
  },
  {
    id: "heap-top-k",
    title: "Keep only the best k candidates",
    topic: "Heaps",
    minutes: 35,
    purpose: "Avoid sorting everything when only a small frontier matters.",
    interviewUse: "Top-k work appears in ranking, streaming, scheduling, and merge problems.",
    concept: "Count frequencies, then use a heap or ordered entries to select the k most frequent values.",
    mentalModel: ["Counting and selection are separate steps.", "The heap root is the next candidate to remove or return.", "Define tie behavior before coding."],
    complexity: "O(n + u log k) time and O(u) space for u unique values.",
    inputFormat: "Comma-separated integers, a pipe, then k. Return the k most frequent values ordered by frequency descending, then value ascending.",
    workedExample: examples("heapq.heappush(heap, (-count, value))", "queue.add(new int[] {-count, value});", "heap.push({count, -value});"),
    visibleCases: [{ input: "1,1,1,2,2,3|2", output: "1,2" }, { input: "4,4,5,5,6|2", output: "4,5" }],
    prediction: "What tie rule makes the result deterministic when counts match?",
    hints: ["Build a frequency map first.", "Order higher frequency before lower frequency.", "For ties, order the smaller value first.", "Join exactly k selected values with commas."],
    transferPrompt: "Solve a tie-heavy case without help and state what the heap is ordered by.",
  },
  {
    id: "dynamic-programming",
    title: "Reuse answers to overlapping subproblems",
    topic: "Dynamic programming",
    minutes: 40,
    purpose: "Turn repeated recursive work into a small state transition.",
    interviewUse: "Dynamic programming tests state definition, recurrence, base cases, and space reduction.",
    concept: "At each house, choose the better of skipping it or taking it plus the best result from two positions back.",
    mentalModel: ["State means the best answer for a prefix.", "Each new answer depends on two earlier answers.", "Only two rolling values are required."],
    complexity: "O(n) time and O(1) extra space.",
    inputFormat: "Comma-separated non-negative house values. Return the largest non-adjacent sum.",
    workedExample: examples("previous, current = current, max(current, previous + value)", "int next = Math.max(current, previous + value);", "int next = max(current, previous + value);"),
    visibleCases: [{ input: "2,7,9,3,1", output: "12" }, { input: "2,1,1,2", output: "4" }],
    prediction: "Why does a greedy choice of the larger neighboring house fail in general?",
    hints: ["Track best through i - 2 and through i - 1.", "Taking the current value uses the older state.", "Skipping uses the current state.", "Roll the two states forward."],
    transferPrompt: "Pass an unseen case without assistance and derive the recurrence aloud.",
  },
];

export const CURRICULUM: CurriculumSession[] = [
  { id: "w1-copy", week: 1, order: 1, kind: "learn", title: "Mutable data and copies", purpose: "Prevent reference-sharing bugs.", minutes: 22, lessonId: "copy-with-intent" },
  { id: "w1-array", week: 1, order: 2, kind: "learn", title: "Array scans and invariants", purpose: "Build correct one-pass loops.", minutes: 24, lessonId: "array-scan" },
  { id: "w1-retrieval", week: 1, order: 3, kind: "practice", title: "Foundations retrieval", purpose: "Recall both ideas without the examples visible.", minutes: 18 },
  { id: "w1-map", week: 1, order: 4, kind: "learn", title: "Hash maps and complements", purpose: "Trade memory for fast lookup.", minutes: 32, lessonId: "hashmap-two-sum" },
  { id: "w1-communication", week: 1, order: 5, kind: "practice", title: "Explain the tradeoff", purpose: "Practice saying the approach before coding.", minutes: 15 },
  { id: "w1-check", week: 1, order: 6, kind: "checkpoint", title: "Week 1 checkpoint", purpose: "Prove foundations transfer without hints.", minutes: 35 },
  { id: "w2-pointers", week: 2, order: 1, kind: "learn", title: "Two pointers", purpose: "Use order to discard impossible pairs.", minutes: 28, lessonId: "two-pointers" },
  { id: "w2-window", week: 2, order: 2, kind: "learn", title: "Sliding windows", purpose: "Maintain contiguous ranges efficiently.", minutes: 34, lessonId: "minimum-window" },
  { id: "w2-prefix", week: 2, order: 3, kind: "learn", title: "Prefix sums", purpose: "Precompute repeated range work.", minutes: 26, lessonId: "prefix-sums" },
  { id: "w2-mix", week: 2, order: 4, kind: "practice", title: "Choose the linear pattern", purpose: "Distinguish scan, pointers, window, and prefix state.", minutes: 24 },
  { id: "w2-search", week: 2, order: 5, kind: "learn", title: "Binary search", purpose: "Exploit monotonic order.", minutes: 30, lessonId: "binary-search" },
  { id: "w2-check", week: 2, order: 6, kind: "checkpoint", title: "Week 2 checkpoint", purpose: "Solve a new linear-data problem unaided.", minutes: 40 },
  { id: "w3-stack", week: 3, order: 1, kind: "learn", title: "Stacks and nesting", purpose: "Model last-opened, first-closed structure.", minutes: 27, lessonId: "stack-matching" },
  { id: "w3-recursion", week: 3, order: 2, kind: "learn", title: "Recursive contracts", purpose: "Trust a smaller version of the problem.", minutes: 25, lessonId: "recursive-factorial" },
  { id: "w3-graphs", week: 3, order: 3, kind: "learn", title: "Graph traversal", purpose: "Explore relationships with visited state.", minutes: 38, lessonId: "graph-components" },
  { id: "w3-retrieval", week: 3, order: 4, kind: "practice", title: "Traversal retrieval", purpose: "Choose stack, queue, or recursion from the prompt.", minutes: 25 },
  { id: "w3-heaps", week: 3, order: 5, kind: "learn", title: "Heaps and top k", purpose: "Keep a small best-candidate frontier.", minutes: 35, lessonId: "heap-top-k" },
  { id: "w3-mock", week: 3, order: 6, kind: "mock", title: "45-minute coding interview", purpose: "Practice thinking aloud with all help disabled.", minutes: 45 },
  { id: "w4-dp", week: 4, order: 1, kind: "learn", title: "Dynamic programming", purpose: "Reuse overlapping subproblem answers.", minutes: 40, lessonId: "dynamic-programming" },
  { id: "w4-debug", week: 4, order: 2, kind: "practice", title: "Debug from failing evidence", purpose: "Localize a bug before changing code.", minutes: 28 },
  { id: "w4-mixed", week: 4, order: 3, kind: "practice", title: "Mixed pattern selection", purpose: "Name the pattern and invariant before implementation.", minutes: 30 },
  { id: "w4-behavioral", week: 4, order: 4, kind: "practice", title: "Behavioral evidence", purpose: "Connect actions, decisions, and measurable results.", minutes: 25 },
  { id: "w4-mock", week: 4, order: 5, kind: "mock", title: "Full interview loop", purpose: "Rehearse coding, communication, and recovery under time.", minutes: 75 },
  { id: "w4-check", week: 4, order: 6, kind: "checkpoint", title: "Sprint readiness review", purpose: "Close the sprint using measured evidence, not activity alone.", minutes: 35 },
];

export function lessonById(value: string | null | undefined) {
  return LESSONS.find((lesson) => lesson.id === value) ?? LESSONS[0];
}

export function nextLessonId(completed: ReadonlySet<string>) {
  return LESSONS.find((lesson) => !completed.has(lesson.id))?.id ?? LESSONS[0].id;
}

export function starterFor(language: Language, lessonId: LessonId = LESSON_IDS[0]) {
  const lesson = lessonById(lessonId);
  const usesNumberList = lessonId !== "stack-matching" && lessonId !== "graph-components";
  const pythonParsedInput = usesNumberList ? "    values = numbers(parts[0])\n" : "";
  const javaParsedInput = usesNumberList ? "        int[] values = numbers(parts[0]);\n" : "";
  const cppParsedInput = usesNumberList ? "        vector<int> values = numbers(first);\n" : "";
  if (language === "python") return `def numbers(text: str) -> list[int]:\n    return [] if text == "" else [int(value) for value in text.split(",")]\n\ndef solve(raw: str) -> str:\n    parts = raw.split("|")\n${pythonParsedInput}    # ${lesson.inputFormat}\n    # Write the smallest clear solution, then return its answer as text.\n    return ""`;
  if (language === "java") return `import java.util.*;\n\npublic class Main {\n    static int[] numbers(String text) {\n        if (text.isEmpty()) return new int[0];\n        return Arrays.stream(text.split(",")).mapToInt(Integer::parseInt).toArray();\n    }\n\n    public static String solve(String input) {\n        String[] parts = input.split("\\\\|", -1);\n${javaParsedInput}        // ${lesson.inputFormat}\n        // Write the smallest clear solution, then return its answer as text.\n        return "";\n    }\n}`;
  return `#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\n    vector<int> numbers(const string& text) {\n        vector<int> result;\n        if (text.empty()) return result;\n        string value; stringstream stream(text);\n        while (getline(stream, value, ',')) result.push_back(stoi(value));\n        return result;\n    }\npublic:\n    string solve(string input) {\n        size_t divider = input.find('|');\n        string first = divider == string::npos ? input : input.substr(0, divider);\n        string second = divider == string::npos ? "" : input.substr(divider + 1);\n${cppParsedInput}        // ${lesson.inputFormat}\n        // Write the smallest clear solution, then return its answer as text.\n        return "";\n    }\n};`;
}
