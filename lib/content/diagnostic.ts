export interface DiagnosticQuestion {
  id: string;
  topic: string;
  prompt: string;
  options: string[];
  answer: number;
  difficulty: number;
  routes: string[];
}

export const diagnosticQuestions: DiagnosticQuestion[] = [
  { id: "quant-rate", topic: "Quantitative", prompt: "A price rises by 20% and then falls by 20%. What is the net change?", options: ["No change", "4% decrease", "4% increase", "8% decrease"], answer: 1, difficulty: 0.3, routes: ["all"] },
  { id: "logic-syllogism", topic: "Reasoning", prompt: "All debuggers test hypotheses. Some engineers are debuggers. Which conclusion must follow?", options: ["All engineers test hypotheses", "Some engineers test hypotheses", "No engineer guesses", "Some debuggers are not engineers"], answer: 1, difficulty: 0.35, routes: ["all"] },
  { id: "code-loop", topic: "Coding foundations", prompt: "What prints? x = 0; for i in range(3): x += i; print(x)", options: ["2", "3", "6", "Error"], answer: 1, difficulty: 0.3, routes: ["coding"] },
  { id: "mutability", topic: "Coding foundations", prompt: "a = [1]; b = a; b.append(2). What is a?", options: ["[1]", "[1, 2]", "[2]", "Undefined"], answer: 1, difficulty: 0.4, routes: ["coding"] },
  { id: "complexity", topic: "Complexity", prompt: "A loop halves n each iteration. Its time complexity is:", options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], answer: 1, difficulty: 0.45, routes: ["coding"] },
  { id: "hashing", topic: "Arrays & hashing", prompt: "For an unsorted array, which tool supports an expected O(n) duplicate check?", options: ["Stack", "Hash set", "Binary search without sorting", "Heap"], answer: 1, difficulty: 0.45, routes: ["coding"] },
  { id: "window", topic: "Sliding window", prompt: "Positive values and a minimum-length contiguous sum suggest:", options: ["Fixed window", "Variable sliding window", "Union-find", "Topological sort"], answer: 1, difficulty: 0.55, routes: ["dsa"] },
  { id: "graph", topic: "Graphs", prompt: "Shortest path in an unweighted graph is normally found with:", options: ["DFS", "BFS", "Dijkstra only", "Kruskal"], answer: 1, difficulty: 0.55, routes: ["dsa"] },
  { id: "sql", topic: "SQL", prompt: "Which clause filters groups after aggregation?", options: ["WHERE", "HAVING", "ORDER BY", "LIMIT"], answer: 1, difficulty: 0.45, routes: ["all"] },
  { id: "os", topic: "CS fundamentals", prompt: "Which condition is required for deadlock?", options: ["Preemption", "Circular wait", "Cache coherence", "Paging"], answer: 1, difficulty: 0.5, routes: ["all"] },
  { id: "communication", topic: "Communication", prompt: "Before optimizing under interview conditions, the strongest next step is to:", options: ["Start coding silently", "State the brute force and its complexity", "Ask for the solution", "Skip edge cases"], answer: 1, difficulty: 0.4, routes: ["all"] },
  { id: "systems", topic: "System design", prompt: "Which property makes retrying the same request safe?", options: ["Sharding", "Idempotency", "Replication", "Backpressure"], answer: 1, difficulty: 0.7, routes: ["advanced"] },
];

export function scoreDiagnostic(answers: Record<string, string>) {
  const byTopic: Record<string, { correct: number; total: number; difficulty: number }> = {};
  for (const question of diagnosticQuestions) {
    const entry = byTopic[question.topic] ?? { correct: 0, total: 0, difficulty: 0 };
    entry.total += 1;
    entry.difficulty += question.difficulty;
    if (Number(answers[question.id]) === question.answer) entry.correct += 1;
    byTopic[question.topic] = entry;
  }
  const topicPriors = Object.fromEntries(Object.entries(byTopic).map(([topic, value]) => [topic, Number((0.2 + (value.correct / value.total) * 0.65).toFixed(2))]));
  const totalCorrect = Object.values(byTopic).reduce((sum, value) => sum + value.correct, 0);
  const codingCorrect = ["Coding foundations", "Complexity", "Arrays & hashing", "Sliding window", "Graphs"].reduce((sum, topic) => sum + (byTopic[topic]?.correct ?? 0), 0);
  const route = codingCorrect <= 1 ? "foundations" : codingCorrect <= 3 ? "product" : totalCorrect >= 10 ? "big-tech" : "product";
  const goal = route === "foundations" ? "Write working code unaided and clear a service-IT coding round." : route === "big-tech" ? "Prove Tier B, communication, and system-design readiness." : "Pass a startup or product-company screening round.";
  return { totalCorrect, total: diagnosticQuestions.length, topicPriors, route, goal } as const;
}
