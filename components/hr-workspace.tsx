"use client";

import { useEffect, useMemo, useState } from "react";
import { BrainCircuit, Check, Clock3, MessageSquareText, Send, ShieldCheck, Target } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useLearnerState } from "./state/learner-state-provider";
import { ProgressBar } from "./ui/progress-bar";

const principles = ["Customer obsession", "Ownership", "Invent and simplify", "Are right, a lot", "Learn and be curious", "Hire and develop", "Insist on high standards", "Think big", "Bias for action", "Frugality", "Earn trust", "Dive deep", "Have backbone", "Deliver results", "Strive to be Earth's best employer", "Success and scale bring responsibility"];

type HrMode = "stories" | "answers" | "resume" | "discussion";

export function HrWorkspace() {
  const { state, dispatch } = useLearnerState();
  const [mode, setMode] = useState<HrMode>("stories");

  return <div className="hr-workspace">
    <header className="workspace-heading"><div><p className="context-line">Behavioral and communication</p><h2>Make the evidence specific.</h2><p>Stories are reusable only when the action, tradeoff, and measured result survive follow-up questions.</p></div><span className="hr-story-count"><Target size={17} /> {state.starStories.length}/8 core stories</span></header>
    <div className="mode-tabs" role="tablist" aria-label="HR practice mode">{([['stories','STAR bank'],['answers','Answer builder'],['resume','Resume / ATS'],['discussion','Group discussion']] as const).map(([id,label]) => <button key={id} type="button" role="tab" aria-selected={mode === id} className={cn(mode === id && "mode-tab--active")} onClick={() => setMode(id)}>{label}</button>)}</div>
    {mode === "stories" && <StarBank stories={state.starStories} onSave={(story) => dispatch({ type: "star.save", payload: story })} />}
    {mode === "answers" && <AnswerBuilder />}
    {mode === "resume" && <ResumeLab />}
    {mode === "discussion" && <DiscussionLab />}
  </div>;
}

function StarBank({ stories, onSave }: { stories: ReturnType<typeof useLearnerState>["state"]["starStories"]; onSave: (story: ReturnType<typeof useLearnerState>["state"]["starStories"][number]) => void }) {
  const [draft, setDraft] = useState({ id: crypto.randomUUID(), title: "", situation: "", task: "", action: "", result: "", metrics: "", principles: [] as string[] });
  const covered = new Set(stories.flatMap((story) => story.principles));
  const valid = draft.title.trim() && draft.situation.trim() && draft.task.trim() && draft.action.trim().length >= 30 && draft.result.trim() && draft.metrics.trim();
  return <div className="star-layout"><section className="star-editor"><h3>Build one defensible story</h3><label>Story title<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Launch failure recovered in 48 hours" /></label><div className="star-grid"><label>Situation<textarea value={draft.situation} onChange={(event) => setDraft({ ...draft, situation: event.target.value })} /></label><label>Task<textarea value={draft.task} onChange={(event) => setDraft({ ...draft, task: event.target.value })} /></label><label>Action<textarea value={draft.action} onChange={(event) => setDraft({ ...draft, action: event.target.value })} /></label><label>Result<textarea value={draft.result} onChange={(event) => setDraft({ ...draft, result: event.target.value })} /></label></div><label>Metrics<input value={draft.metrics} onChange={(event) => setDraft({ ...draft, metrics: event.target.value })} placeholder="Reduced retries 41%; shipped two days early" /></label><fieldset><legend>Principles this story proves</legend><div className="principle-picker">{principles.map((principle) => <label key={principle}><input type="checkbox" checked={draft.principles.includes(principle)} onChange={(event) => setDraft({ ...draft, principles: event.target.checked ? [...draft.principles, principle] : draft.principles.filter((item) => item !== principle) })} />{principle}</label>)}</div></fieldset><button type="button" className="button button--primary" disabled={!valid || draft.principles.length === 0} onClick={() => { onSave(draft); setDraft({ id: crypto.randomUUID(), title: "", situation: "", task: "", action: "", result: "", metrics: "", principles: [] }); }}><Check size={17} /> Save evidence</button></section><aside className="principle-coverage"><h3>Leadership-principle coverage</h3><p>Missing evidence is visible before the bar raiser finds it.</p>{principles.map((principle) => <div key={principle}><span>{covered.has(principle) ? <Check size={14} /> : null}{principle}</span><em>{covered.has(principle) ? "Covered" : "Gap"}</em></div>)}</aside></div>;
}

function AnswerBuilder() {
  const { dispatch } = useLearnerState();
  const [answer, setAnswer] = useState("");
  const [grade, setGrade] = useState<{ score: number; dimensions: Array<{ label: string; met: boolean }>; feedback: string[] } | null>(null);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function gradeAnswer() {
    setGrading(true); setError(null);
    try { const response = await fetch("/api/responses/grade", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "behavioral", response: answer }) }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error ?? "Answer could not be graded"); setGrade(payload); dispatch({ type: "attempt.record", payload: { id: crypto.randomUUID(), itemType: "behavioral", itemId: "failure-and-recovery", topic: "Behavioral", correct: payload.score >= 75, difficulty: 0.6, durationMs: 0, targetDurationMs: 5 * 60_000, scaffoldLevel: 0, timed: false, communicationScore: payload.score, answer: { response: answer }, createdAt: new Date().toISOString() } }); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Answer could not be graded"); }
    finally { setGrading(false); }
  }
  return <section className="answer-builder"><span className="context-line">Failure and recovery</span><h3>Tell me about a time you missed an important target.</h3><p>Answer aloud first, then capture the version you want to pressure-test.</p><textarea rows={12} value={answer} onChange={(event) => { setAnswer(event.target.value); setGrade(null); }} placeholder="Situation, task, the actions you personally took, measured result, and what changed..."/><button type="button" className="button button--primary" disabled={answer.trim().length < 80 || grading} onClick={() => void gradeAnswer()}><Send size={17} /> {grading ? "Grading…" : "Grade answer"}</button>{error && <p className="warning-text">{error}</p>}{grade && <div className="rubric-lines">{grade.dimensions.map((item) => <RubricLine key={item.label} label={item.label} pass={item.met} />)}<p><strong>{grade.score}/100.</strong> {grade.feedback.length ? `Missing evidence: ${grade.feedback.join(", ")}.` : "Every rubric dimension has explicit evidence."}</p></div>}</section>;
}

function RubricLine({ label, pass }: { label: string; pass: boolean }) { return <div><span>{pass ? <Check size={15} /> : <Target size={15} />}{label}</span><strong>{pass ? "Evidence found" : "Needs work"}</strong></div>; }

function ResumeLab() {
  const [resume, setResume] = useState(""); const [jd, setJd] = useState("");
  const score = useMemo(() => { const words = new Set(jd.toLowerCase().match(/[a-z][a-z+.#-]{3,}/g) ?? []); const haystack = resume.toLowerCase(); const hits = [...words].filter((word) => haystack.includes(word)).length; return words.size ? Math.min(100, Math.round((hits / words.size) * 100)) : 0; }, [resume, jd]);
  return <div className="resume-lab"><section><label>Resume text<textarea rows={14} value={resume} onChange={(event) => setResume(event.target.value)} placeholder="Paste resume text..." /></label></section><section><label>Job description<textarea rows={14} value={jd} onChange={(event) => setJd(event.target.value)} placeholder="Paste target job description..." /></label></section><aside><strong>{score}</strong><span>Evidence match</span><ProgressBar value={score} label="Resume evidence match" /><p>{score >= 70 ? "Strong overlap. Check that every claimed skill has a result attached." : "Mirror the role's vocabulary only where your experience genuinely proves it."}</p></aside></div>;
}

function DiscussionLab() {
  const { dispatch } = useLearnerState();
  const [started, setStarted] = useState(false); const [hasStarted, setHasStarted] = useState(false); const [notes, setNotes] = useState(""); const [remaining, setRemaining] = useState(120); const [grade, setGrade] = useState<{ score: number; feedback: string[] } | null>(null); const [grading, setGrading] = useState(false); const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (!started) return; const timer = window.setInterval(() => setRemaining((value) => { if (value <= 1) { window.clearInterval(timer); setStarted(false); return 0; } return value - 1; }), 1000); return () => window.clearInterval(timer); }, [started]);
  async function finish() {
    setStarted(false); setGrading(true); setError(null);
    try {
      const response = await fetch("/api/responses/grade", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "communication", response: notes }) });
      const payload = await response.json() as { score?: number; feedback?: string[]; error?: string };
      if (!response.ok || payload.score === undefined || !payload.feedback) throw new Error(payload.error ?? "Discussion could not be graded");
      setGrade({ score: payload.score, feedback: payload.feedback });
      dispatch({ type: "attempt.record", payload: { id: crypto.randomUUID(), itemType: "communication", itemId: "remote-work-discussion", topic: "Communication", correct: payload.score >= 70, difficulty: 0.55, durationMs: (120 - remaining) * 1000, targetDurationMs: 120_000, scaffoldLevel: 1, timed: remaining < 120, communicationScore: payload.score, answer: { response: notes }, createdAt: new Date().toISOString() } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Discussion could not be graded");
    } finally {
      setGrading(false);
    }
  }
  const clock = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
  const stoppedWithResponse = !started && hasStarted && !grade;
  return <div className="discussion-lab"><header><span><MessageSquareText size={18} /> Group discussion</span><strong><Clock3 size={17} /> {started ? clock : remaining === 0 ? "Time" : "Ready"}</strong></header><h3>Remote work improves productivity more than office work.</h3><p>Open with a frame, acknowledge a counterpoint, add evidence, and invite another speaker. Do not merely occupy airtime.</p><div className="discussion-structure">{["Frame the question", "State a qualified position", "Add one concrete example", "Build on or challenge respectfully", "Synthesize"].map((step, index) => <span key={step}><i>{index + 1}</i>{step}</span>)}</div><textarea rows={8} value={notes} onChange={(event) => { setNotes(event.target.value); setGrade(null); setError(null); }} placeholder="Capture your opening and synthesis..."/><button type="button" className="button button--primary" disabled={grading || (!started && notes.trim().length < 20)} onClick={() => { if (started || stoppedWithResponse) void finish(); else { setRemaining(120); setStarted(true); setHasStarted(true); setGrade(null); setError(null); } }}>{started || stoppedWithResponse ? <ShieldCheck size={17} /> : <BrainCircuit size={17} />}{grading ? "Grading…" : started ? "Finish and grade" : stoppedWithResponse ? error ? "Retry grading" : "Grade timed response" : "Start two-minute rehearsal"}</button>{error && <p className="warning-text">{error}</p>}{grade && <p className={grade.score >= 70 ? "success-text" : "warning-text"}>{grade.score}/100. {grade.feedback.length ? `Missing: ${grade.feedback.join(", ")}.` : "Every discussion dimension was evidenced."}</p>}</div>;
}
