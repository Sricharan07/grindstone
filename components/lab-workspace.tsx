"use client";

import { useState } from "react";
import { BrainCircuit, Bug, Check, Code2, Database, Play, Send, ShieldAlert, Target } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { RunResult } from "@/lib/judge/types";
import { pythonCodebaseFixtures } from "@/lib/content/codebase-fixtures";
import { CodeEditor } from "./code-editor";
import { useLearnerState } from "./state/learner-state-provider";

type LabMode = "sql" | "codebase" | "ai";

const aiCode = `def merge_ranges(ranges):
    ranges.sort()
    merged = []
    for start, end in ranges:
        if not merged or start > merged[-1][1]:
            merged.append([start, end])
        else:
            merged[-1][1] = end
    return merged`;

export function LabWorkspace() {
  const [mode, setMode] = useState<LabMode>("sql");
  return <div className="lab-workspace"><header className="workspace-heading"><div><p className="context-line">Unfamiliar systems</p><h2>Inspect first. Change one thing.</h2><p>SQL, codebase, and AI-assisted rounds reward verification discipline rather than fast typing.</p></div></header><div className="mode-tabs" role="tablist" aria-label="Lab mode"><button type="button" role="tab" aria-selected={mode === "sql"} className={cn(mode === "sql" && "mode-tab--active")} onClick={() => setMode("sql")}><Database size={17} /> SQL sandbox</button><button type="button" role="tab" aria-selected={mode === "codebase"} className={cn(mode === "codebase" && "mode-tab--active")} onClick={() => setMode("codebase")}><Bug size={17} /> Codebase round</button><button type="button" role="tab" aria-selected={mode === "ai"} className={cn(mode === "ai" && "mode-tab--active")} onClick={() => setMode("ai")}><BrainCircuit size={17} /> AI fluency</button></div>{mode === "sql" && <SqlSandbox />}{mode === "codebase" && <CodebaseRound />}{mode === "ai" && <AiFluencyRound />}</div>;
}

function SqlSandbox() {
  const { dispatch } = useLearnerState();
  const [query, setQuery] = useState("SELECT department, COUNT(*) AS hires\nFROM employees\nWHERE hired_at >= DATE '2026-01-01'\nGROUP BY department\nORDER BY hires DESC, department ASC;");
  const [result, setResult] = useState<{ rows?: Array<Record<string, unknown>>; matchedExpected?: boolean; durationMs?: number; error?: string } | null>(null);
  const [running, setRunning] = useState(false);
  async function run() { setRunning(true); setResult(null); try { const response = await fetch("/api/sql", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query, task: "hires-by-department" }) }); const payload = await response.json() as { rows?: Array<Record<string, unknown>>; matchedExpected?: boolean; durationMs?: number; error?: string }; setResult(payload); if (response.ok && payload.rows) dispatch({ type: "attempt.record", payload: { id: crypto.randomUUID(), itemType: "sql", itemId: "lab-hires-by-department", topic: "SQL", correct: payload.matchedExpected === true, difficulty: 0.5, durationMs: payload.durationMs ?? 0, targetDurationMs: 8 * 60_000, scaffoldLevel: 0, timed: false, answer: { query }, createdAt: new Date().toISOString() } }); } catch { setResult({ error: "SQL sandbox is offline. Start the sqlsandbox container." }); } finally { setRunning(false); } }
  return <section className="lab-panel sql-lab"><aside><span><Database size={17} /> Read-only Postgres 17</span><h3>Count 2026 hires by department.</h3><p>The result rows are graded. Equivalent queries pass.</p><div className="schema-list"><strong>employees</strong><span>id <small>integer</small></span><span>name <small>text</small></span><span>department <small>text</small></span><span>hired_at <small>date</small></span></div><div className="sandbox-guard"><ShieldAlert size={16} /><p>AST validation permits one SELECT. The database role and transaction are read-only, with a five-second timeout.</p></div></aside><main><textarea aria-label="SQL sandbox query" value={query} onChange={(event) => setQuery(event.target.value)} rows={14} spellCheck={false}/><button type="button" className="button button--primary" disabled={running} onClick={run}><Play size={17} /> {running ? "Running" : "Run against sandbox"}</button>{result?.error && <div className="feedback-box feedback-box--warning"><strong>Sandbox unavailable</strong><p>{result.error}</p></div>}{result?.rows && <div className="sql-live-result"><div>{Object.keys(result.rows[0] ?? {}).map((key) => <strong key={key}>{key}</strong>)}</div>{result.rows.map((row, index) => <div key={index}>{Object.values(row).map((value, cell) => <span key={cell}>{String(value)}</span>)}</div>)}<footer className={result.matchedExpected ? "success-text" : "warning-text"}>{result.matchedExpected ? <Check size={15} /> : <Target size={15} />}{result.matchedExpected ? "Expected rows matched" : "Rows differ from the target"} · {result.durationMs} ms</footer></div>}</main></section>;
}

function CodebaseRound() {
  const { dispatch } = useLearnerState();
  const [taskIndex, setTaskIndex] = useState(0); const task = pythonCodebaseFixtures[taskIndex];
  const [hypothesis, setHypothesis] = useState(""); const [code, setCode] = useState<string>(task.initialCode); const [result, setResult] = useState<RunResult | null>(null); const [running, setRunning] = useState(false);
  function chooseTask(index: number) { const next = pythonCodebaseFixtures[index]; setTaskIndex(index); setCode(next.initialCode); setHypothesis(""); setResult(null); }
  async function runTests() { setRunning(true); setResult(null); try { const response = await fetch("/api/judge", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ language: "python", code, problem: task.problem, timeoutMs: 8000 }) }); const payload = await response.json() as { result?: RunResult; error?: string }; if (!response.ok || !payload.result) throw new Error(payload.error ?? "Judge unavailable"); setResult(payload.result); dispatch({ type: "attempt.record", payload: { id: crypto.randomUUID(), itemType: "codebase", itemId: task.id, topic: "Codebase debugging", correct: payload.result.outcome === "ok", difficulty: 0.65, durationMs: payload.result.durationMs, targetDurationMs: 35 * 60_000, scaffoldLevel: 0, timed: false, answer: { hypothesis }, measuredComplexity: undefined, createdAt: new Date().toISOString() } }); } catch (error) { setResult({ outcome: "internal_error", stdout: "", stderr: error instanceof Error ? error.message : "Judge unavailable", exitCode: null, signal: null, durationMs: 0 }); } finally { setRunning(false); } }
  return <section className="lab-panel codebase-round"><aside><span><Bug size={17} /> Executable repository fixture</span><label className="codebase-fixture-select">Repository<select aria-label="Repository fixture" value={taskIndex} onChange={(event) => chooseTask(Number(event.target.value))}>{pythonCodebaseFixtures.map((item, index) => <option value={index} key={item.id}>{item.title}</option>)}</select></label><h3>{task.brief}</h3><p>Read the contract and failing test, then make the smallest justified patch.</p><pre><code>{task.failingCase}</code><code>{task.expected}</code></pre><label>Committed hypothesis<textarea rows={5} value={hypothesis} onChange={(event) => setHypothesis(event.target.value)} placeholder="Name the defect and the evidence that localizes it..." /></label></aside><main><div className="lab-code-editor"><CodeEditor language="python" value={code} onChange={(value) => { setCode(value); setResult(null); }} /></div><footer><span><Code2 size={16} /> {task.testCount} hidden regression cases · no autocomplete</span><button type="button" className="button button--primary" disabled={hypothesis.trim().length < 20 || running} onClick={() => void runTests()}><Play size={17} /> {running ? "Running…" : "Run repository tests"}</button></footer>{result && <div className={cn("feedback-box", result.outcome === "ok" ? "feedback-box--success" : "feedback-box--warning")}><strong>{result.outcome === "ok" ? "Every repository test passes." : "The regression suite still fails."}</strong><p>{result.stdout || result.stderr}</p></div>}</main></section>;
}

function AiFluencyRound() {
  const { dispatch } = useLearnerState();
  const [prompt, setPrompt] = useState(""); const [flaw, setFlaw] = useState(""); const [test, setTest] = useState(""); const [grade, setGrade] = useState<{ score: number; feedback: string[] } | null>(null); const [grading, setGrading] = useState(false); const [error, setError] = useState<string | null>(null);
  async function submit() {
    setGrading(true); setError(null);
    try {
      const response = await fetch("/api/responses/grade", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "ai_fluency", response: `PROMPT:\n${prompt}\nDEFECT:\n${flaw}\nADVERSARIAL TEST:\n${test}` }) });
      const payload = await response.json() as { score?: number; feedback?: string[]; error?: string };
      if (!response.ok || payload.score === undefined || !payload.feedback) throw new Error(payload.error ?? "Verification could not be graded");
      setGrade({ score: payload.score, feedback: payload.feedback });
      dispatch({ type: "attempt.record", payload: { id: crypto.randomUUID(), itemType: "ai-fluency", itemId: "nested-range-verification", topic: "AI fluency", correct: payload.score >= 80, difficulty: 0.7, durationMs: 0, targetDurationMs: 30 * 60_000, scaffoldLevel: 0, timed: false, communicationScore: payload.score, answer: { prompt, flaw, test }, createdAt: new Date().toISOString() } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Verification could not be graded");
    } finally {
      setGrading(false);
    }
  }
  return <section className="lab-panel ai-round"><aside><span><BrainCircuit size={17} /> AI permitted in this round</span><h3>The assistant returned code that passes the visible case.</h3><p>Your score comes from the prompt, the defect you catch, and the adversarial test you create.</p><label>Your original prompt<textarea rows={7} value={prompt} onChange={(event) => { setPrompt(event.target.value); setGrade(null); setError(null); }} placeholder="Implement merge ranges. Preserve... Include complexity and tests for..." /></label></aside><main><div className="ai-response"><span>Assistant response · intentionally untrusted</span><pre>{aiCode}</pre></div><label>What is wrong?<textarea rows={5} value={flaw} onChange={(event) => { setFlaw(event.target.value); setGrade(null); setError(null); }} placeholder="When one interval contains another..." /></label><label>Adversarial test<input value={test} onChange={(event) => { setTest(event.target.value); setGrade(null); setError(null); }} placeholder="[(1, 10), (2, 3)] should..." /></label><button type="button" className="button button--primary" disabled={prompt.trim().length < 25 || flaw.trim().length < 20 || test.trim().length < 8 || grading} onClick={() => void submit()}><Send size={17} /> {grading ? "Grading…" : "Submit verification"}</button>{error && <p className="warning-text">{error}</p>}{grade && <div className={cn("feedback-box", grade.score >= 80 ? "feedback-box--success" : "feedback-box--warning")}><strong>{grade.score >= 80 ? "The defect and verification plan are explicit." : "The validation still has gaps."}</strong><p>{grade.feedback.length ? `Missing: ${grade.feedback.join(", ")}.` : "All five AI-fluency rubric dimensions passed."}</p></div>}</main></section>;
}
