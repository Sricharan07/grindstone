"use client";

import { AlertTriangle, Check, CircleHelp, Clock3, ShieldCheck, Terminal, X } from "@/components/icons";
import type { AssessmentCaseResult, AssessmentGroup, LessonAssessmentResult } from "@/lib/assessment/types";

const sectionLabel: Record<AssessmentGroup, string> = {
  correctness: "Core logic",
  edgeCases: "Edge cases",
  efficiency: "Larger inputs",
};

function formatDuration(durationMs?: number) {
  if (durationMs === undefined) return undefined;
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes ? `${minutes}m ${String(seconds).padStart(2, "0")}s` : `${seconds}s`;
}

function failurePrompt(test: AssessmentCaseResult) {
  return [
    `Help me understand why the check "${test.name}" failed.`,
    `Input: ${test.input || "(empty)"}`,
    `Expected: ${test.expected}`,
    `My result: ${test.actual}`,
    test.error ? `Runner message: ${test.error}` : "",
    "Ask me one diagnostic question first. Do not replace my full solution.",
  ].filter(Boolean).join("\n");
}

export function AssessmentResults({ result, onAsk }: { result: LessonAssessmentResult; onAsk?: (prompt: string) => void }) {
  const duration = formatDuration(result.solveDurationMs);
  return <section className={`assessment-results ${result.passed ? "assessment-results--passed" : "assessment-results--failed"}`} aria-labelledby="assessment-result-title">
    <header className="assessment-summary">
      <span className="assessment-summary__icon" aria-hidden="true">{result.passed ? <ShieldCheck size={23} /> : <AlertTriangle size={23} />}</span>
      <div>
        <p className="section-label">{result.mode === "independent" ? `Independent attempt ${result.attemptNumber}` : "Learning checks"}</p>
        <h2 id="assessment-result-title">{result.passed ? "Ready to move on" : "Your next fixes are clear"}</h2>
        <p>{result.summary}</p>
      </div>
      <div className="assessment-score" aria-label={`${result.score} out of 100`}>
        <strong>{result.score}</strong><span>/ 100</span>
      </div>
    </header>

    <div className="assessment-facts">
      <span><Check size={15} /><strong>{result.passedCount}/{result.totalCount}</strong> checks passed</span>
      {duration && <span><Clock3 size={15} /><strong>{duration}</strong> solve time</span>}
      <span><Terminal size={15} /><strong>{formatDuration(result.judgeDurationMs)}</strong> runner time</span>
    </div>

    <div className="assessment-sections" aria-label="Score breakdown">
      {(Object.keys(sectionLabel) as AssessmentGroup[]).filter((group) => result.sections[group].total > 0).map((group) => {
        const section = result.sections[group];
        return <div key={group}><span>{sectionLabel[group]}</span><strong>{section.earned}/{section.possible}</strong><small>{section.passed} of {section.total} passed</small></div>;
      })}
    </div>

    <div className="assessment-case-list">
      {result.cases.map((test, index) => {
        const failed = test.status !== "passed";
        return <details key={test.id} open={failed} className={failed ? "assessment-case assessment-case--failed" : "assessment-case"}>
          <summary>
            <span className="assessment-case__status" aria-label={failed ? "Failed" : "Passed"}>{failed ? <X size={15} /> : <Check size={15} />}</span>
            <span><small>Check {index + 1} · {test.category}</small><strong>{test.name}</strong></span>
            <code>{failed ? test.errorType?.replaceAll("_", " ") : "passed"}</code>
          </summary>
          <div className="assessment-case__details">
            <dl>
              <div><dt>Input</dt><dd><code>{test.input || "(empty input)"}</code></dd></div>
              <div><dt>Expected</dt><dd><code>{test.expected}</code></dd></div>
              <div><dt>Your result</dt><dd><code>{test.actual}</code></dd></div>
            </dl>
            {failed && <div className="assessment-correction">
              <div><strong>{test.line ? `Look near line ${test.line}` : "What happened"}</strong><p>{test.error}</p></div>
              <div><strong>How to correct it</strong><p>{test.correction}</p></div>
              {onAsk && <button type="button" className="button button--secondary" onClick={() => onAsk(failurePrompt(test))}><CircleHelp size={16} /> Ask Luna about this failure</button>}
            </div>}
          </div>
        </details>;
      })}
    </div>

    {result.remarks.length > 0 && <footer>{result.remarks.map((remark) => <p key={remark}>{remark}</p>)}</footer>}
  </section>;
}
