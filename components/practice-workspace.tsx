"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  Bug,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Database,
  Gauge,
  Lightbulb,
  Play,
  RotateCcw,
  Send,
  Shuffle,
  Target,
  Timer,
} from "@/components/icons";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ProgressBar } from "./ui/progress-bar";
import { CodeEditor } from "./code-editor";
import { useLearnerState } from "./state/learner-state-provider";
import type { RunResult } from "@/lib/judge/types";
import { selectPracticeQueue } from "@/lib/product/practice-selection";

type PracticeMode = "mcq" | "patterns" | "debugging" | "sql";

const modes = [
  { id: "mcq" as const, label: "Timed MCQ", icon: Timer },
  { id: "patterns" as const, label: "Patterns", icon: Shuffle },
  { id: "debugging" as const, label: "Debugging", icon: Bug },
  { id: "sql" as const, label: "SQL lab", icon: Database },
];

export function PracticeWorkspace() {
  const [mode, setMode] = useState<PracticeMode>("mcq");
  const { state, ready } = useLearnerState();

  return (
    <div className="practice-workspace">
      <header className="workspace-heading">
        <div>
          <p className="context-line">{state.sprint.week >= 3 ? `Interleaved for week ${state.sprint.week}` : `Blocked acquisition for week ${state.sprint.week}`}</p>
          <h2>Practice the choice, not the chapter.</h2>
          <p>{state.sprint.week >= 3 ? "Your queue mixes skills because recognition is part of the interview." : "Your queue holds one topic steady while difficulty moves to your current edge."}</p>
        </div>
        <div className="practice-summary"><span><Target size={16} /> {state.attempts.length} attempts recorded</span></div>
      </header>

      <div className="mode-tabs" role="tablist" aria-label="Practice mode">
        {modes.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={mode === item.id}
              className={cn(mode === item.id && "mode-tab--active")}
              onClick={() => setMode(item.id)}
            >
              <Icon size={17} /> {item.label}
            </button>
          );
        })}
      </div>

      {mode === "mcq" && (ready ? <McqPractice /> : <section className="practice-panel"><div className="feedback-box"><strong>Loading your practice edge…</strong></div></section>)}
      {mode === "patterns" && <PatternPractice />}
      {mode === "debugging" && <DebuggingPractice />}
      {mode === "sql" && <SqlPractice />}
    </div>
  );
}

function McqPractice() {
  const { state, dispatch } = useLearnerState();
  const [selection] = useState(() => selectPracticeQueue(state));
  const [questions, setQuestions] = useState<Array<{ id: string; topic: string; prompt: string; difficulty: number; options: string[]; targetSeconds: number }>>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [reported, setReported] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [grade, setGrade] = useState<{ correct: boolean; answerIndex: number; explanation: string } | null>(null);
  const [grading, setGrading] = useState(false);
  const question = questions[questionIndex];

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ limit: "12", targetDifficulty: String(selection.targetDifficulty) });
    if (selection.topic) params.set("topic", selection.topic);
    fetch(`/api/questions?${params}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json() as { questions?: typeof questions; error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Question bank unavailable");
        setQuestions(payload.questions ?? []);
      })
      .catch((error) => { if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : "Question bank unavailable"); });
    return () => controller.abort();
  }, [selection]);

  useEffect(() => {
    if (!question || submitted) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [questionIndex, question, submitted]);

  function nextQuestion() {
    setQuestionIndex((index) => (index + 1) % questions.length);
    setSelected(null);
    setPrediction(null);
    setSubmitted(false);
    setSeconds(0);
    setReported(false);
    setReportError(null);
    setGrade(null);
  }

  const correct = grade?.correct ?? false;

  async function submitAnswer() {
    if (selected === null || prediction === null || !question) return;
    setGrading(true);
    try {
      const response = await fetch("/api/questions/grade", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ questionId: question.id, selectedIndex: selected }) });
      const payload = await response.json() as { correct?: boolean; answerIndex?: number; explanation?: string; error?: string };
      if (!response.ok || payload.correct === undefined || payload.answerIndex === undefined || !payload.explanation) throw new Error(payload.error ?? "Answer could not be graded");
      const result = { correct: payload.correct, answerIndex: payload.answerIndex, explanation: payload.explanation };
      setGrade(result);
      setSubmitted(true);
      dispatch({ type: "attempt.record", payload: {
        id: crypto.randomUUID(), itemType: "question", itemId: question.id, topic: question.topic, correct: result.correct,
        difficulty: question.difficulty, durationMs: seconds * 1000, targetDurationMs: question.targetSeconds * 1000,
        predictedSuccess: prediction / 100, scaffoldLevel: 0, timed: true, answer: { selectedIndex: selected }, createdAt: new Date().toISOString(),
      } });
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Answer could not be graded");
    } finally { setGrading(false); }
  }

  async function reportQuestion() {
    setReporting(true);
    setReportError(null);
    const payload = { itemId: question.id, reason: "learner-report", createdAt: new Date().toISOString() };
    try {
      const response = await fetch("/api/content/reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ itemId: payload.itemId, reason: payload.reason }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Report could not be sent");
      dispatch({ type: "content.report", payload });
      setReported(true);
    } catch (error) {
      setReportError(error instanceof Error ? error.message : "Report could not be sent");
    } finally {
      setReporting(false);
    }
  }

  if (loadError) return <section className="practice-panel"><div className="feedback-box feedback-box--warning"><strong>Practice bank unavailable</strong><p>{loadError}</p></div></section>;
  if (!question) return <section className="practice-panel"><div className="feedback-box"><strong>Loading published questions…</strong><p>The queue contains only content that cleared the audit pipeline.</p></div></section>;

  return (
    <section className="practice-panel mcq-panel">
      <div className="practice-panel__main">
        <div className="question-meta">
          <span>{question.topic}</span>
          <strong className={cn(seconds > question.targetSeconds && "timer-over")}>
            <Clock3 size={15} /> {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
          </strong>
        </div>
        <ProgressBar value={((questionIndex + 1) / questions.length) * 100} label="Question set progress" />
        <p className="question-count">Question {questionIndex + 1} of {questions.length}</p>
        <h3 className="question-prompt">{question.prompt}</h3>

        <div className="answer-list">
          {question.options.map((option, index) => {
            const state = submitted
              ? index === grade?.answerIndex
                ? "correct"
                : selected === index
                  ? "wrong"
                  : "idle"
              : selected === index
                ? "selected"
                : "idle";
            return (
              <button
                type="button"
                key={option}
                disabled={submitted}
                className={`answer-row answer-row--${state}`}
                onClick={() => setSelected(index)}
              >
                <span>{String.fromCharCode(65 + index)}</span>
                <p>{option}</p>
                {state === "correct" && <Check size={18} />}
                {state === "wrong" && <RotateCcw size={18} />}
              </button>
            );
          })}
        </div>

        {submitted && (
          <div className={cn("answer-feedback", correct ? "answer-feedback--correct" : "answer-feedback--wrong")}>
            <span>{correct ? <Check size={19} /> : <Lightbulb size={19} />}</span>
            <div>
              <strong>{correct ? "Correct, with evidence." : "The committed answer missed."}</strong>
              <p>{grade?.explanation}</p>
              <small>Predicted {prediction}% · actual {correct ? "correct" : "incorrect"} · {seconds}s</small>
            </div>
          </div>
        )}

        <div className="question-actions">
          {!submitted ? (
            <button
              type="button"
              className="button button--primary"
              disabled={selected === null || prediction === null || grading}
              onClick={() => void submitAnswer()}
            >
              {grading ? "Grading…" : "Check answer"} <ArrowRight size={17} />
            </button>
          ) : (
            <button type="button" className="button button--primary" onClick={nextQuestion}>
              Next question <ArrowRight size={17} />
            </button>
          )}
          <button type="button" className="button button--quiet" disabled={reported || reporting} onClick={() => void reportQuestion()}>
            {reported ? <Check size={16} /> : <AlertTriangle size={16} />} {reported ? "Reported" : reporting ? "Sending…" : "Report item"}
          </button>
        </div>
        {reportError && <p className="warning-text">{reportError}</p>}
      </div>

      <aside className="prediction-rail">
        <span><BrainCircuit size={18} /> Calibration</span>
        <h3>Will you get this right?</h3>
        <p>Commit before answering. Feeling fluent is not the same as retrieval.</p>
        <div className="prediction-options">
          {[30, 50, 70, 90].map((value) => (
            <button
              type="button"
              key={value}
              disabled={submitted}
              className={cn(prediction === value && "prediction-option--active")}
              onClick={() => setPrediction(value)}
            >
              {value}%
            </button>
          ))}
        </div>
        <div className="target-time">
          <Gauge size={18} />
          <span><small>Target pace</small><strong>{question.targetSeconds}s</strong></span>
        </div>
      </aside>
    </section>
  );
}

function PatternPractice() {
  const { dispatch } = useLearnerState();
  const [reveal, setReveal] = useState(false);
  const [pattern, setPattern] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(20);
  const [problems, setProblems] = useState<Array<{ id: string; number: number | null; slug: string; title: string; difficulty: string; tags: string[] }>>([]);
  const [problemsLoading, setProblemsLoading] = useState(true);
  const [problemsError, setProblemsError] = useState<string | null>(null);

  useEffect(() => {
    if (reveal) return;
    const timer = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [reveal]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/problems", { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json() as { problems?: typeof problems; error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Coding queue unavailable");
        setProblems(payload.problems ?? []);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setProblemsError(error instanceof Error ? error.message : "Coding queue unavailable");
      })
      .finally(() => {
        if (!controller.signal.aborted) setProblemsLoading(false);
      });
    return () => controller.abort();
  }, []);

  function commitPattern() {
    if (!pattern || reveal) return;
    const correct = pattern === "Variable sliding window";
    setReveal(true);
    dispatch({ type: "attempt.record", payload: {
      id: crypto.randomUUID(),
      itemType: "recognition",
      itemId: "positive-minimum-window",
      topic: "Pattern recognition",
      correct,
      difficulty: 0.45,
      durationMs: (20 - remaining) * 1000,
      targetDurationMs: 20_000,
      scaffoldLevel: 0,
      timed: true,
      answer: { pattern },
      createdAt: new Date().toISOString(),
    } });
  }

  return (
    <section className="practice-panel pattern-panel">
      <div className="recognition-drill">
        <div className="question-meta"><span>20-second recognition</span><strong><Timer size={15} /> 00:{String(remaining).padStart(2, "0")}</strong></div>
        <h3>Given an array of positive integers, find the smallest contiguous subarray whose sum is at least <em>target</em>.</h3>
        <p>Name the pattern. Do not solve it.</p>
        <div className="pattern-options">
          {["Prefix sum", "Variable sliding window", "Two pointers from ends", "Monotonic queue"].map((option) => (
            <button key={option} type="button" disabled={reveal} className={cn(pattern === option && "pattern-option--active")} onClick={() => setPattern(option)}>
              {option}
            </button>
          ))}
        </div>
        <button type="button" className="button button--primary" disabled={!pattern || reveal} onClick={commitPattern}>
          Commit pattern <Send size={16} />
        </button>
        {reveal && (
          <div className={cn("feedback-box", pattern === "Variable sliding window" ? "feedback-box--success" : "feedback-box--warning")}>
            <strong>{pattern === "Variable sliding window" ? "Correct discrimination." : "The positivity constraint is the clue."}</strong>
            <p>Because every value is positive, expanding can only increase the sum and contracting can only decrease it. That monotonic movement makes a variable window valid.</p>
          </div>
        )}
      </div>

      <div className="problem-queue">
        <div className="section-heading-row">
          <div><h3>Coding queue</h3><p>Only problems with executable harnesses appear here.</p></div>
          <Link href="/solve">Open gym <ArrowRight size={15} /></Link>
        </div>
        {problems.map((problem) => (
          <Link href={`/solve?problem=${problem.slug}`} className="problem-row" key={problem.id}>
            <span className="problem-number">{problem.number ?? "—"}</span>
            <div><strong>{problem.title}</strong><small>{problem.tags.join(" · ")}</small></div>
            <span className={`difficulty difficulty--${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span>
            <ChevronRight size={17} />
          </Link>
        ))}
        {problemsError && <p className="warning-text">{problemsError}</p>}
        {!problemsError && problemsLoading && <p>Loading the coding queue…</p>}
        {!problemsError && !problemsLoading && !problems.length && <p>No published coding problems are available. Import the corpus after seeding Postgres.</p>}
      </div>
    </section>
  );
}

function DebuggingPractice() {
  const { dispatch } = useLearnerState();
  const [hypothesis, setHypothesis] = useState("");
  const [code, setCode] = useState(`def min_len(nums, target):
    left = total = 0
    best = float("inf")
    for right, value in enumerate(nums):
        total += value
        while total > target:
            best = min(best, right - left + 1)
            total -= nums[left]
            left += 1
    return best`);
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);

  async function runTests() {
    setRunning(true); setResult(null);
    try {
      const response = await fetch("/api/judge", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ language: "python", code, problem: "min-window", timeoutMs: 8_000 }) });
      const payload = await response.json() as { result?: RunResult; error?: string };
      if (!response.ok || !payload.result) throw new Error(payload.error ?? "Judge unavailable");
      setResult(payload.result);
      dispatch({ type: "attempt.record", payload: { id: crypto.randomUUID(), itemType: "debugging", itemId: "minimum-window-boundary", topic: "Debugging", correct: payload.result.outcome === "ok", difficulty: 0.45, durationMs: 0, targetDurationMs: 10 * 60_000, scaffoldLevel: 1, timed: false, answer: { hypothesis }, createdAt: new Date().toISOString() } });
    } catch (error) {
      setResult({ outcome: "internal_error", stdout: "", stderr: error instanceof Error ? error.message : "Judge unavailable", exitCode: null, signal: null, durationMs: 0 });
    } finally { setRunning(false); }
  }

  return (
    <section className="practice-panel debugging-panel">
      <div className="debug-brief">
        <span className="status-pill status-pill--danger"><Bug size={14} /> Planted bug</span>
        <h3>A valid window is being skipped.</h3>
        <p>Reproduce → read → localize → hypothesize → change one thing → verify.</p>
      </div>
      <div className="debug-grid">
        <div className="code-panel"><div className="code-panel__bar"><span><i /> min_window.py</span><strong>Python</strong></div><CodeEditor language="python" value={code} onChange={(value) => { setCode(value); setResult(null); }} /></div>
        <div className="debug-console">
          <div><span>Failing test</span><code>min_len([2, 3, 1], 5)</code><strong>Expected 2 · got inf</strong></div>
          <label htmlFor="hypothesis">Commit a hypothesis before running</label>
          <textarea id="hypothesis" rows={4} value={hypothesis} onChange={(event) => setHypothesis(event.target.value)} placeholder="The loop skips… because…" />
          <button type="button" className="button button--secondary" disabled={hypothesis.trim().length < 12 || running} onClick={() => void runTests()}>
            <Play size={16} /> {running ? "Running tests…" : "Run regression suite"}
          </button>
          {result && <div className={cn("feedback-box", result.outcome === "ok" ? "feedback-box--success" : "feedback-box--warning")}><strong>{result.outcome === "ok" ? "Every hidden regression passed." : "The regression suite still fails."}</strong><p>{result.stdout || result.stderr}</p></div>}
        </div>
      </div>
    </section>
  );
}

function SqlPractice() {
  const { dispatch } = useLearnerState();
  const [query, setQuery] = useState("SELECT department, COUNT(*) AS hires\nFROM employees\nWHERE hired_at >= DATE '2026-01-01'\nGROUP BY department\nORDER BY hires DESC;");
  const [result, setResult] = useState<{ rows?: Array<Record<string, unknown>>; matchedExpected?: boolean; durationMs?: number; error?: string } | null>(null);
  const [running, setRunning] = useState(false);

  async function runQuery() {
    setRunning(true); setResult(null);
    try {
      const response = await fetch("/api/sql", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query, task: "hires-by-department" }) });
      const payload = await response.json() as { rows?: Array<Record<string, unknown>>; matchedExpected?: boolean; durationMs?: number; error?: string };
      setResult(payload);
      if (response.ok && payload.rows) dispatch({ type: "attempt.record", payload: { id: crypto.randomUUID(), itemType: "sql", itemId: "hires-by-department", topic: "SQL", correct: payload.matchedExpected === true, difficulty: 0.45, durationMs: payload.durationMs ?? 0, targetDurationMs: 8 * 60_000, scaffoldLevel: 0, timed: false, answer: { query }, createdAt: new Date().toISOString() } });
    } catch { setResult({ error: "SQL sandbox is offline. Start the sqlsandbox container." }); }
    finally { setRunning(false); }
  }

  return (
    <section className="practice-panel sql-panel">
      <div className="sql-prompt">
        <span className="status-pill"><Database size={14} /> Read-only sandbox</span>
        <h3>Count 2026 hires by department.</h3>
        <p>Return <code>department</code> and <code>hires</code>, highest count first.</p>
        <div className="schema-list">
          <strong>employees</strong>
          <span>id <small>integer</small></span>
          <span>name <small>text</small></span>
          <span>department <small>text</small></span>
          <span>hired_at <small>date</small></span>
        </div>
      </div>
      <div className="sql-editor">
        <div className="code-panel__bar"><span><i /> query.sql</span><strong>PostgreSQL 17</strong></div>
        <textarea value={query} onChange={(event) => setQuery(event.target.value)} spellCheck={false} aria-label="SQL query" />
        <div className="sql-actions">
          <span><CircleHelp size={15} /> Result rows are graded, not query text.</span>
          <button type="button" className="button button--primary" disabled={running} onClick={runQuery}><Play size={16} fill="currentColor" /> {running ? "Running" : "Run query"}</button>
        </div>
        {result?.error && <div className="feedback-box feedback-box--warning"><strong>Sandbox unavailable</strong><p>{result.error}</p></div>}
        {result?.rows && (
          <div className="result-table">
            <div>{Object.keys(result.rows[0] ?? {}).map((key) => <strong key={key}>{key}</strong>)}</div>
            {result.rows.map((row, index) => <div key={index}>{Object.values(row).map((value, cell) => <span key={cell}>{String(value)}</span>)}</div>)}
            <footer>{result.matchedExpected ? <Check size={15} /> : <AlertTriangle size={15} />} {result.matchedExpected ? "Expected rows matched" : "Rows differ from target"} · {result.durationMs} ms</footer>
          </div>
        )}
      </div>
    </section>
  );
}
