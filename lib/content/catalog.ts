export interface CurriculumGroup { id: string; title: string; tier: "Foundation" | "A" | "B" | "C" | "Placement" | "Interview"; topics: string[]; }

export const curriculumGroups: CurriculumGroup[] = [
  { id: "foundations", title: "Coding foundations", tier: "Foundation", topics: ["Notional machine", "Values and types", "Mutability and references", "Operators and truthiness", "Conditionals", "Loops", "Functions and scope", "Recursion and call stack", "Exceptions and stack traces", "Lists, maps, sets, tuples, strings", "Build core structures", "Git, docs, debugger, tests", "Language idioms"] },
  { id: "tier-a", title: "DSA core", tier: "A", topics: ["Complexity from constraints", "Arrays and hashing", "Two pointers", "Sliding window", "Prefix sums", "Binary search", "Binary search on answer", "Sorting and comparators", "Strings", "Linked lists", "Stacks and queues", "Monotonic stack/deque", "Heaps and top-k", "Trees", "BFS and DFS", "Backtracking with pruning", "Greedy and intervals", "DP 1-D", "Bit manipulation"] },
  { id: "tier-b", title: "DSA extended", tier: "B", topics: ["Union-find", "Topological sort", "Dijkstra", "Bellman-Ford", "Floyd-Warshall", "Minimum spanning tree", "Bipartite graphs", "Tries and XOR trie", "Two-heaps median", "K-way merge", "Lowest common ancestor", "Serialize/deserialize", "Tree DP", "DP 2-D", "Knapsack", "LIS n log n", "DP state design", "Sweep line", "Number theory", "Combinatorics", "Design problems"] },
  { id: "tier-c", title: "DSA advanced", tier: "C", topics: ["Segment tree", "Fenwick tree", "Bitmask DP", "Digit DP", "KMP", "Z algorithm", "Rolling hash", "Strongly connected components", "Square-root decomposition", "Matrix exponentiation"] },
  { id: "aptitude", title: "Aptitude and reasoning", tier: "Placement", topics: ["Percentages and profit/loss", "Ratios and averages", "Mixtures", "Time and work", "Time, speed, distance", "Interest", "Permutations and combinations", "Probability", "Number systems", "Ages", "Clocks and calendars", "Mensuration", "Progressions", "Series", "Coding-decoding", "Blood relations", "Direction sense", "Seating", "Syllogisms", "Data sufficiency", "Puzzles", "Data interpretation", "Reading comprehension", "Sentence correction", "Para jumbles", "Error spotting", "Pseudocode MCQs"] },
  { id: "fundamentals", title: "CS fundamentals", tier: "Placement", topics: ["Operating systems", "DBMS", "SQL hands-on", "Networking", "Object-oriented design", "Git"] },
  { id: "big-tech", title: "Loop readiness", tier: "Interview", topics: ["Optimal-complexity bar", "Follow-up transformations", "Speed rounds", "Communication", "Six-phase method", "Codebase rounds", "AI-fluency rounds", "LLD and machine coding", "System design", "Behavioral depth"] },
];

export const recognitionPatterns = ["Frequency map", "Two pointers", "Fixed window", "Variable window", "Prefix sum", "Monotonic stack", "Binary search boundary", "Binary search on answer", "Heap/top-k", "Intervals", "Tree recursion", "BFS layers", "DFS components", "Backtracking state", "Greedy exchange", "Union-find", "Topological dependency", "Shortest path", "DP take/skip", "DP state transition"];

export const companyPolicies = [
  { company: "Amazon", round: "Coding and onsite", policy: "AI use is disqualifying", verified: "Recruiter confirmation required before each loop" },
  { company: "Google practice", round: "AI-assisted coding", policy: "AI permitted; prompt and verification are graded", verified: "Secondary-sourced; editable" },
  { company: "Meta practice", round: "AI-enabled session", policy: "AI permitted only when the round explicitly enables it", verified: "Secondary-sourced; editable" },
];
