"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Clock3, Code2, Lightbulb, Play, Search, Target, X } from "@/components/icons";
import { CodeEditor } from "@/components/code-editor";
import { CoachThread } from "@/components/coach-thread";
import { learningLesson, starterFor } from "@/lib/learning/catalog";
import { PROBLEM_LIBRARY, problemBySlug, scheduledProblems, type InterviewProblem } from "@/lib/problems/catalog";
import { cn } from "@/lib/utils";
import { useLearnerState } from "./state/learner-state-provider";

type ProblemView = "scheduled" | "core" | "all" | "reviews";

function resultMessage(payload: { result?: { outcome: string; stdout: string; stderr: string }; error?: string }) {
  if (!payload.result) return payload.error ?? "The code runner is unavailable.";
  if (payload.result.outcome === "ok") return payload.result.stdout.trim();
  return payload.result.stderr.trim() || `Run ended with ${payload.result.outcome.replaceAll("_", " ")}.`;
}

function ProblemSolver({ problem, onBack }: { problem: InterviewProblem; onBack: string }) {
  const { state, dispatch } = useLearnerState();
  const lesson = learningLesson(problem.lessonSlug);
  const saved = state.lessons[`problem:${problem.slug}`];
  const [code, setCode] = useState(saved?.code || starterFor(state.profile.language, problem.lessonSlug));
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [timed, setTimed] = useState(problem.core);
  const [confidence, setConfidence] = useState(70);
  const [hintIndex, setHintIndex] = useState(-1);
  const [coachOpen, setCoachOpen] = useState(false);
  const startedAt = useRef(0);

  useEffect(() => { startedAt.current = Date.now(); }, [problem.slug]);

  const context = `Problem: ${problem.title}\nPattern: ${problem.pattern}\nPrompt: ${problem.prompt}\nInput: ${problem.inputFormat}\nLanguage: ${state.profile.language}\nLearner code:\n${code}`;

  async function run() {
    setRunning(true);
    setResult(null);
    dispatch({ type: "lesson.save", payload: { lessonId: `problem:${problem.slug}`, progress: { stage: "code", language: state.profile.language, code } } });
    try {
      const response = await fetch("/api/judge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ language: state.profile.language, code, lessonId: problem.lessonSlug }),
      });
      const payload = await response.json() as { result?: { outcome: string; stdout: string; stderr: string }; error?: string };
      const ok = response.ok && payload.result?.outcome === "ok";
      setResult({ ok, message: resultMessage(payload) });
      dispatch({
        type: "attempt.record",
        payload: {
          id: crypto.randomUUID(), itemType: "problem", itemId: problem.slug, topic: problem.pattern, correct: ok,
          difficulty: problem.difficulty === "Easy" ? 0.35 : problem.difficulty === "Medium" ? 0.62 : 0.82,
          durationMs: Math.max(1, Date.now() - startedAt.current), targetDurationMs: problem.difficulty === "Easy" ? 20 * 60_000 : 35 * 60_000,
          predictedSuccess: confidence / 100, scaffoldLevel: hintIndex + 1, assistance: hintIndex < 0 ? "none" : hintIndex < 2 ? "concept" : "next-step",
          transfer: true, timed, answer: code, createdAt: new Date().toISOString(),
        },
      });
      if (ok) {
        dispatch({ type: "lesson.save", payload: { lessonId: `problem:${problem.slug}`, progress: { testsPassed: true, transferPassed: hintIndex < 0, stage: "complete" } } });
        if (problem.core && problem.day) {
          const alreadySolved = new Set(state.attempts.filter((attempt) => attempt.itemType === "problem" && attempt.correct).map((attempt) => attempt.itemId));
          alreadySolved.add(problem.slug);
          const itemId = `d${problem.day}-problems`;
          if (scheduledProblems(problem.day).every((item) => alreadySolved.has(item.slug)) && !state.sprint.completedItems.includes(itemId)) {
            dispatch({ type: "plan.toggle", payload: { itemId, completedAt: new Date().toISOString() } });
          }
        }
      }
    } catch (error) {
      setResult({ ok: false, message: error instanceof Error ? error.message : "The code runner is unavailable." });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="problem-solver">
      <header className="problem-solver__topbar">
        <Link href={onBack} className="button button--quiet"><ArrowLeft size={16} /> Problem library</Link>
        <div><span className={cn("difficulty", `difficulty--${problem.difficulty.toLowerCase()}`)}>{problem.difficulty}</span><span>{problem.core ? `Core 40 · Day ${problem.day}` : "Practice library"}</span></div>
      </header>
      <div className="problem-solver__layout">
        <article className="problem-brief">
          <p className="section-label">{problem.pattern}</p>
          <h1>{problem.title}</h1>
          <p className="problem-prompt">{problem.prompt}</p>
          <section><h2>Input and output</h2><p>{problem.inputFormat}</p></section>
          <section><h2>Examples</h2>{problem.examples.map((example) => <div className="example-row" key={example.input}><code>{example.input || "(empty)"}</code><ArrowRight size={14} /><code>{example.output}</code></div>)}</section>
          <section><h2>Constraints and proof</h2><ul>{problem.constraints.map((constraint) => <li key={constraint}>{constraint}</li>)}</ul></section>
          <button type="button" className="button button--secondary" onClick={() => setHintIndex((value) => Math.min(3, value + 1))}><Lightbulb size={16} /> {hintIndex < 0 ? "Use a hint" : "Next hint"}</button>
          {hintIndex >= 0 && <p className="hint-callout"><strong>Hint {hintIndex + 1}</strong>{lesson.hints[hintIndex]}</p>}
          <button type="button" className="ask-luna" onClick={() => setCoachOpen(true)}>Ask Luna about this problem <ArrowRight size={15} /></button>
        </article>
        <section className="problem-editor" aria-label="Problem editor">
          <header><div><Code2 size={17} /><span>{state.profile.language === "python" ? "Python" : "Java"}</span></div><label className="toggle"><input type="checkbox" checked={timed} onChange={(event) => setTimed(event.target.checked)} /><span /> Timed evidence</label></header>
          <CodeEditor value={code} language={state.profile.language} onChange={setCode} />
          <footer>
            <label className="confidence-control"><span>Expected chance of passing</span><select value={confidence} onChange={(event) => setConfidence(Number(event.target.value))}><option value={30}>30%</option><option value={50}>50%</option><option value={70}>70%</option><option value={90}>90%</option></select></label>
            <button type="button" className="button button--primary" disabled={running} onClick={() => void run()}><Play size={16} /> {running ? "Running..." : "Run hidden tests"}</button>
          </footer>
          {result && <div className={cn("run-result", result.ok ? "run-result--ok" : "run-result--error")} role="status">{result.ok ? <Check size={17} /> : <X size={17} />}<span>{result.message}</span></div>}
        </section>
      </div>
      {coachOpen && <CoachThread title="Luna problem coach" context={context} lessonId={`problem:${problem.slug}`} onClose={() => setCoachOpen(false)} />}
    </div>
  );
}

export function ProblemsWorkspace({ selectedSlug, initialView = "scheduled", initialDay }: { selectedSlug?: string; initialView?: ProblemView; initialDay?: number }) {
  const { state } = useLearnerState();
  const [view, setView] = useState<ProblemView>(initialView);
  const [query, setQuery] = useState("");
  const day = initialDay ?? state.sprint.day;
  const selected = problemBySlug(selectedSlug);
  if (selected) return <ProblemSolver problem={selected} onBack={`/problems?view=${view}&day=${day}`} />;

  const reviewedIds = new Set(state.reviews.map((review) => review.itemId));
  const filtered = PROBLEM_LIBRARY.filter((problem) => {
    if (view === "scheduled" && problem.day !== day) return false;
    if (view === "core" && !problem.core) return false;
    if (view === "reviews" && !reviewedIds.has(problem.slug)) return false;
    const haystack = `${problem.title} ${problem.pattern}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });
  const solved = new Set(state.attempts.filter((attempt) => attempt.itemType === "problem" && attempt.correct).map((attempt) => attempt.itemId));

  return (
    <div className="problems-page">
      <header className="page-intro"><div><p className="section-label">150 interview problems · 40 scheduled</p><h1>Practice the pattern you just learned.</h1><p>Every problem opens in the same Python or Java editor, runs against hidden tests, and records assistance honestly.</p></div><div className="problem-total"><strong>{solved.size}</strong><span>solved independently or with help</span></div></header>
      <div className="problems-toolbar">
        <nav className="segmented-control" aria-label="Problem view">{(["scheduled", "core", "all", "reviews"] as ProblemView[]).map((item) => <button key={item} type="button" className={cn(view === item && "is-active")} onClick={() => setView(item)}>{item === "scheduled" ? "Today" : item === "core" ? "Core 40" : item === "all" ? "All 150" : "Reviews"}</button>)}</nav>
        <label className="search-control"><Search size={16} /><span className="sr-only">Search problems</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title or pattern" /></label>
      </div>
      {filtered.length ? <div className="problem-table" role="table" aria-label="Interview problems">
        <div className="problem-table__head" role="row"><span>Problem</span><span>Pattern</span><span>Level</span><span>Status</span><span /></div>
        {filtered.map((problem) => <Link role="row" href={`/problems?problem=${problem.slug}&view=${view}&day=${day}`} key={problem.slug} className="problem-row"><span><i>{problem.core ? problem.day : "L"}</i><strong>{problem.title}</strong></span><span>{problem.pattern}</span><span className={cn("difficulty", `difficulty--${problem.difficulty.toLowerCase()}`)}>{problem.difficulty}</span><span>{solved.has(problem.slug) ? <><Check size={14} /> Solved</> : <><Clock3 size={14} /> Not attempted</>}</span><ArrowRight size={16} /></Link>)}
      </div> : <section className="empty-state"><Target size={22} /><h2>{view === "reviews" ? "No reviews are due yet" : "No problems match"}</h2><p>{view === "reviews" ? "A failed or completed attempt will schedule the next retrieval automatically." : "Clear the search or choose another view."}</p></section>}
    </div>
  );
}
