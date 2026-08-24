"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Clock3, Lock, ShieldCheck, Target, Timer, Trophy } from "@/components/icons";
import { drivePacks, type DrivePack, type DriveSectionKind } from "@/lib/content/drives";
import type { RunResult } from "@/lib/judge/types";
import { cn } from "@/lib/utils";
import { CodeEditor } from "./code-editor";
import { useLearnerState } from "./state/learner-state-provider";
import { ProgressBar } from "./ui/progress-bar";

const codingTasks = [
  { problem: "first-unique", prompt: "Return the first integer that occurs exactly once, or None when none exists.", starter: `def first_unique(values: list[int]) -> int | None:
    # Write your solution here.
    return None` },
  { problem: "balanced-brackets", prompt: "Return whether every bracket is closed in the correct order.", starter: `def is_balanced(text: str) -> bool:
    # Handle (), [], and {}.
    return False` },
] as const;

const writtenPrompts: Partial<Record<DriveSectionKind, string>> = {
  system_design: "Design a rate limiter for a public API. Cover requirements, estimates, API, data, failures, and tradeoffs.",
  codebase: "Explain how you would reproduce, localize, fix, and verify a regression in an unfamiliar service.",
  behavioral: "Tell me about a failure that changed how you work. Include your actions, a measured result, and reflection.",
  hr_interview: "Tell me about a failure that changed how you work. Include your actions, a measured result, and reflection.",
  communication: "Frame a position, address a counterpoint, add evidence, invite another view, and synthesize.",
};

type BankQuestion = { id: string; topic: string; prompt: string; difficulty: number; options: string[]; targetSeconds: number };

export function DriveSimulator() {
  const { dispatch } = useLearnerState();
  const [selected, setSelected] = useState<DrivePack>(drivePacks[0]);
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const [rehearsal, setRehearsal] = useState(false);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [itemIndex, setItemIndex] = useState(0);
  const [questionCursor, setQuestionCursor] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [code, setCode] = useState<string>(codingTasks[0].starter);
  const [written, setWritten] = useState("");
  const [scores, setScores] = useState<Record<string, { earned: number; total: number }>>({});
  const [finished, setFinished] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [grading, setGrading] = useState(false);
  const expiredRef = useRef(false);
  const submittingRef = useRef(false);
  const submitItemRef = useRef<(timedOut?: boolean) => Promise<void>>(async () => undefined);
  const section = selected.sections[sectionIndex];
  const itemCount = rehearsal ? 1 : section?.count ?? 1;
  const sectionLimit = rehearsal ? (process.env.NEXT_PUBLIC_E2E_CLOCK === "true" ? 3 : 90) : (section?.minutes ?? 1) * 60;
  const remaining = Math.max(0, sectionLimit - seconds);
  const question = questions[questionCursor % Math.max(questions.length, 1)];
  const codingTask = codingTasks[itemIndex % codingTasks.length];

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/questions?limit=100", { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json() as { questions?: BankQuestion[]; error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Question bank unavailable");
        setQuestions(payload.questions ?? []);
      })
      .catch((error) => { if (!controller.signal.aborted) setServiceError(error instanceof Error ? error.message : "Question bank unavailable"); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!active || finished) return;
    const timer = window.setInterval(() => setSeconds((value) => {
      const next = value + 1;
      if (next >= sectionLimit && !expiredRef.current) {
        expiredRef.current = true;
        window.queueMicrotask(() => { void submitItemRef.current(true); });
      }
      return next;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [active, finished, sectionIndex, sectionLimit]);

  function start(isRehearsal: boolean) {
    if (selected.sections.some((item) => item.kind === "mcq") && !questions.length) {
      setServiceError("Published questions are required for this drive. Migrate and seed Postgres first.");
      return;
    }
    expiredRef.current = false;
    setRehearsal(isRehearsal); setActive(true); setFinished(false); setFinalScore(0); setSectionIndex(0); setItemIndex(0); setQuestionCursor(0); setSeconds(0); setScores({}); setAnswer(null); setWritten(""); setCode(codingTasks[0].starter); setServiceError(null);
  }

  function completeItem(earned: number, timedOut: boolean) {
    const key = `${sectionIndex}-${section.topic ?? section.kind}`;
    const previous = scores[key] ?? { earned: 0, total: 0 };
    const nextScores = { ...scores, [key]: { earned: previous.earned + earned, total: previous.total + (timedOut ? itemCount - itemIndex : 1) } };
    setScores(nextScores);
    if (!timedOut && itemIndex + 1 < itemCount) {
      setItemIndex((value) => value + 1);
      if (section.kind === "mcq") setQuestionCursor((value) => value + 1);
      setAnswer(null); setWritten(""); setCode(codingTasks[(itemIndex + 1) % codingTasks.length].starter);
      return;
    }
    if (sectionIndex + 1 < selected.sections.length) {
      expiredRef.current = false;
      setSectionIndex((value) => value + 1); setItemIndex(0); setSeconds(0); setAnswer(null); setWritten(""); setCode(codingTasks[0].starter);
      if (section.kind === "mcq") setQuestionCursor((value) => value + 1);
      return;
    }
    const sectionScores = Object.fromEntries(Object.entries(nextScores).map(([scoreKey, value]) => [scoreKey, Math.round((value.earned / Math.max(value.total, 1)) * 100)]));
    const earnedTotal = Object.values(nextScores).reduce((sum, value) => sum + value.earned, 0);
    const itemTotal = Object.values(nextScores).reduce((sum, value) => sum + value.total, 0);
    const completedScore = Math.round((earnedTotal / Math.max(itemTotal, 1)) * 100);
    setFinalScore(completedScore); setFinished(true);
    dispatch({ type: "drive.complete", payload: { pack: selected.slug, score: completedScore, sections: sectionScores, completedAt: new Date().toISOString() } });
  }

  async function submitItem(timedOut = false) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    if (timedOut) {
      completeItem(0, true);
      submittingRef.current = false;
      return;
    }
    setGrading(true); setServiceError(null);
    try {
      let earned = 0;
      if (section.kind === "mcq") {
        if (!question || answer === null) throw new Error("Question or answer missing");
        const response = await fetch("/api/questions/grade", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ questionId: question.id, selectedIndex: answer }) });
        const payload = await response.json() as { correct?: boolean; error?: string };
        if (!response.ok || payload.correct === undefined) throw new Error(payload.error ?? "Answer grading failed");
        earned = payload.correct ? 1 : 0;
      } else if (section.kind === "coding") {
        const response = await fetch("/api/judge", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ language: "python", code, problem: codingTask.problem, measureComplexity: true, timeoutMs: 12_000 }) });
        const payload = await response.json() as { result?: RunResult; complexity?: { complexity: string }; error?: string };
        if (!response.ok || !payload.result) throw new Error(payload.error ?? "Judge unavailable");
        earned = payload.result.outcome === "ok" ? (payload.complexity?.complexity === "O(n)" ? 1 : 0.7) : 0;
      } else {
        const kind = section.kind === "system_design" ? "system_design" : section.kind === "codebase" ? "codebase" : section.kind === "communication" ? "communication" : "behavioral";
        const response = await fetch("/api/responses/grade", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, response: written }) });
        const payload = await response.json() as { score?: number; error?: string };
        if (!response.ok || payload.score === undefined) throw new Error(payload.error ?? "Response grading failed");
        earned = payload.score / 100;
      }
      completeItem(earned, false);
    } catch (error) {
      setServiceError(error instanceof Error ? error.message : "This item could not be graded");
    } finally {
      submittingRef.current = false;
      setGrading(false);
    }
  }
  useEffect(() => { submitItemRef.current = submitItem; });

  if (!active) return <div className="drive-page">
    <header className="workspace-heading"><div><p className="context-line">Full drive simulations</p><h2>Practice the whole hiring funnel.</h2><p>Section order, cutoffs, timing, and no-back navigation come from versioned drive packs.</p></div><span className="drive-security"><ShieldCheck size={17} /> Every section is graded by its real engine</span></header>
    <div className="drive-picker"><section><h3>Choose a drive</h3>{drivePacks.map((pack) => <button type="button" key={pack.slug} className={cn("drive-pack", selected.slug === pack.slug && "drive-pack--active")} onClick={() => { setSelected(pack); setServiceError(null); }}><span><strong>{pack.company}</strong><small>{pack.sections.length} sections · {pack.sections.reduce((sum, item) => sum + item.minutes, 0)} minutes</small></span><em>{pack.cutoff}% cutoff</em><ArrowRight size={17} /></button>)}</section><aside className="drive-brief"><span>{selected.company}</span><h3>Simulation contract</h3><dl>{selected.sections.map((item, index) => <div key={`${item.kind}-${index}`}><dt>{item.topic ?? item.kind.replaceAll("_", " ")}</dt><dd>{item.count} · {item.minutes}m</dd></div>)}</dl><p><Lock size={15} /> No going back. The timer continues between questions. Weak sections write back into readiness evidence.</p>{serviceError && <div className="feedback-box feedback-box--warning"><strong>Drive cannot start</strong><p>{serviceError}</p></div>}<button type="button" className="button button--primary" onClick={() => start(false)}><Timer size={17} /> Start full simulation</button><button type="button" className="button button--secondary" onClick={() => start(true)}>Run one-item rehearsal</button></aside></div>
  </div>;

  if (finished) return <div className="drive-page drive-result"><Trophy size={28} /><p className="context-line">{selected.company} complete</p><h2>{finalScore}%</h2><strong>{finalScore >= selected.cutoff ? "Cutoff cleared" : "Recalibration required"}</strong><p>Section evidence has been written to your sprint record.</p><button type="button" className="button button--primary" onClick={() => setActive(false)}>Return to drive packs</button></div>;

  const canSubmit = section.kind === "mcq" ? answer !== null : section.kind === "coding" ? code.trim().length > 30 : written.trim().length >= 20;
  return <div className="drive-session">
    <header><span className="brand-mark">G</span><strong>{selected.company}</strong><div data-testid="drive-timer"><Clock3 size={17} /> {String(Math.floor(remaining / 60)).padStart(2, "0")}:{String(remaining % 60).padStart(2, "0")}</div><span>Section {sectionIndex + 1}/{selected.sections.length}</span></header>
    <ProgressBar value={((sectionIndex + (itemIndex + 1) / itemCount) / selected.sections.length) * 100} label="Drive progress" />
    <main>
      <div className="drive-question-meta"><span>{section.topic ?? section.kind.replaceAll("_", " ")}</span><strong>Item {itemIndex + 1} of {itemCount}</strong></div>
      {section.kind === "mcq" && question && <><h1>{question.prompt}</h1><div className="drive-options">{question.options.map((option, index) => <button type="button" key={`${option}-${index}`} className={cn(answer === index && "drive-option--active")} onClick={() => setAnswer(index)}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div></>}
      {section.kind === "coding" && <><h1>{codingTask.prompt}</h1><p>State complexity before submitting. Hidden tests remain hidden.</p><div className="drive-code"><CodeEditor language="python" value={code} onChange={setCode} /></div></>}
      {section.kind !== "mcq" && section.kind !== "coding" && <><h1>{writtenPrompts[section.kind]}</h1><textarea rows={10} value={written} onChange={(event) => setWritten(event.target.value)} placeholder="Capture the answer you would say aloud..." /></>}
      {serviceError && <div className="feedback-box feedback-box--warning"><strong>Item not graded</strong><p>{serviceError}</p></div>}
    </main>
    <footer><span><Target size={16} /> Pass line {selected.cutoff}% · answers cannot be revisited</span><button type="button" className="button button--primary" disabled={!canSubmit || grading} onClick={() => void submitItem()}>{grading ? "Grading…" : sectionIndex === selected.sections.length - 1 && itemIndex === itemCount - 1 ? "Finish drive" : "Lock answer"} <ArrowRight size={17} /></button></footer>
  </div>;
}
