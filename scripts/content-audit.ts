import { auditQuestion, summarizeAudit, type AuditableQuestion } from "@/lib/content/audit";
import { buildBootstrapBank } from "@/lib/content/bootstrap-bank";

const fixture: AuditableQuestion[] = Array.from({ length: 50 }, (_, index) => ({
  id: `deliberately-wrong-${index + 1}`,
  answer: "42",
  distractors: ["12", "24", "48"],
  verification: { reproducedAnswer: "41", independentAnswer: "42" },
  status: "generated",
}));

const summary = summarizeAudit(fixture);
if (summary.quarantined !== fixture.length) {
  throw new Error(`Auditor regression: caught ${summary.quarantined} of ${fixture.length} wrong fixtures`);
}

const bank = buildBootstrapBank();
const byTopic: Record<string, { published: number; quarantined: number; unverified: number }> = {};
let executionVerified = 0;
for (const [index, question] of bank.entries()) {
  const audit = auditQuestion({ id: `bootstrap-${index}`, answer: question.payload.options[question.payload.answerIndex], distractors: question.payload.options.filter((_, optionIndex) => optionIndex !== question.payload.answerIndex), verification: question.verification, status: "published" });
  const topic = byTopic[question.topic] ?? { published: 0, quarantined: 0, unverified: 0 };
  if (audit.publishable) topic.published += 1;
  else if (audit.reasons.includes("missing-execution-verification")) topic.unverified += 1;
  else topic.quarantined += 1;
  if (question.verification.reproducedAnswer) executionVerified += 1;
  byTopic[question.topic] = topic;
}

console.info(JSON.stringify({
  launchBank: { total: bank.length, executionVerifiedShare: executionVerified / bank.length, byTopic },
  regressionFixture: { total: fixture.length, ...summary },
}, null, 2));
