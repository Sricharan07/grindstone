export interface LiveContentSignals { attempts: number; wrong: number; reports: number; optionCounts: number[]; reauditPassed: boolean; }

const normalized = (value: unknown) => String(value ?? "").trim().toLowerCase();

export function storedVerificationPasses(payload: unknown, verification: unknown) {
  const body = payload as { options?: unknown[]; answerIndex?: number } | null;
  const audit = verification as {
    reproducedAnswer?: unknown;
    independentAnswer?: unknown;
    executionRequired?: boolean;
    execution?: { passed?: boolean };
    independent?: { passed?: boolean; answer?: unknown };
    ambiguity?: { passed?: boolean; issues?: unknown[] };
  } | null;
  const expected = body?.options?.[body.answerIndex ?? -1];
  if (expected === undefined || !audit) return false;

  if ("reproducedAnswer" in audit) {
    return normalized(audit.reproducedAnswer) === normalized(expected)
      && normalized(audit.independentAnswer) === normalized(expected);
  }

  const executionPassed = audit.executionRequired === false || audit.execution?.passed === true;
  return executionPassed
    && audit.independent?.passed === true
    && normalized(audit.independent.answer) === normalized(expected)
    && audit.ambiguity?.passed === true
    && (audit.ambiguity.issues?.length ?? 0) === 0;
}

export function optionDistribution(answers: unknown[]) {
  const counts = new Map<number, number>();
  for (const answer of answers) {
    const value = typeof answer === "number"
      ? answer
      : typeof answer === "object" && answer !== null && "selectedIndex" in answer
        ? Number((answer as { selectedIndex: unknown }).selectedIndex)
        : Number.NaN;
    if (Number.isInteger(value) && value >= 0) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  const largestIndex = Math.max(-1, ...counts.keys());
  return Array.from({ length: largestIndex + 1 }, (_, index) => counts.get(index) ?? 0);
}

export function shouldRetireContent(signal: LiveContentSignals) {
  if (signal.reports >= 2 && !signal.reauditPassed) return { retire: true, reason: "reported-and-failed-reaudit" };
  if (signal.attempts >= 20 && signal.wrong / signal.attempts > 0.6 && !signal.reauditPassed) return { retire: true, reason: "high-wrong-rate-and-failed-reaudit" };
  const total = signal.optionCounts.reduce((sum, value) => sum + value, 0); const largest = Math.max(...signal.optionCounts, 0);
  if (total >= 24 && largest / total < 0.34 && !signal.reauditPassed) return { retire: true, reason: "near-random-distribution-and-failed-reaudit" };
  return { retire: false, reason: null };
}
