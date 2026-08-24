export interface AuditableQuestion {
  id: string;
  answer: string;
  distractors: string[];
  verification?: { reproducedAnswer?: string; independentAnswer?: string };
  status: "generated" | "verified" | "published" | "quarantined" | "retired";
}

export function auditQuestion(question: AuditableQuestion) {
  const reasons: string[] = [];
  const normalized = [question.answer, ...question.distractors].map((value) => value.trim().toLowerCase());
  if (new Set(normalized).size !== normalized.length) reasons.push("duplicate-options");
  if (!question.verification?.reproducedAnswer) reasons.push("missing-execution-verification");
  if (question.verification?.reproducedAnswer !== question.answer) reasons.push("execution-disagreement");
  if (question.verification?.independentAnswer !== question.answer) reasons.push("independent-solve-disagreement");
  return { publishable: reasons.length === 0, reasons };
}

export function summarizeAudit(questions: AuditableQuestion[]) {
  const totals = { published: 0, quarantined: 0, unverified: 0 };
  for (const question of questions) {
    const audit = auditQuestion(question);
    if (audit.publishable) totals.published += 1;
    else if (audit.reasons.includes("missing-execution-verification")) totals.unverified += 1;
    else totals.quarantined += 1;
  }
  return totals;
}
