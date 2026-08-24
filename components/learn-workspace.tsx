"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, BrainCircuit, Check, CircleHelp, Clock3, Code2, EyeOff, Lightbulb, Play, RotateCcw, Sparkles, Target, X } from "@/components/icons";
import { CodeEditor } from "@/components/code-editor";
import { CoachThread } from "@/components/coach-thread";
import { ConceptVisualizer } from "@/components/concept-visualizer";
import { SPRINT_DAYS } from "@/lib/curriculum/catalog";
import { LEARNING_LESSONS, learningLesson, starterFor, type LessonSlug } from "@/lib/learning/catalog";
import type { AssistanceLevel, LessonStage } from "@/lib/product/types";
import { cn } from "@/lib/utils";
import { useLearnerState } from "./state/learner-state-provider";

const stages: Array<{ id: Exclude<LessonStage, "complete">; label: string }> = [
  { id: "understand", label: "Understand" }, { id: "predict", label: "Predict" }, { id: "code", label: "Code" },
  { id: "explain", label: "Explain" }, { id: "transfer", label: "Solve alone" },
];
const assistanceOrder: AssistanceLevel[] = ["socratic", "concept", "pseudocode", "next-step"];
const assistancePrompt: Record<AssistanceLevel, string> = {
  none: "", socratic: "Ask one question that helps me find the next idea without giving it away.",
  concept: "Explain the exact concept I am missing without writing code.", pseudocode: "Show concise pseudocode but no runnable code.",
  "next-step": "Tell me only the next concrete step in my current solution.", completion: "Suggest exactly one line that could come next.",
};

function runnerMessage(payload: { result?: { outcome: string; stdout: string; stderr: string }; error?: string }) {
  if (!payload.result) return payload.error ?? "The code runner did not respond.";
  return payload.result.outcome === "ok" ? payload.result.stdout.trim() : payload.result.stderr.trim() || `Run ended with ${payload.result.outcome.replaceAll("_", " ")}.`;
}

function LessonImage({ slug, week, panel, alt }: { slug: string; week: number; panel: number; alt: string }) {
  return <div className="lesson-image" role="img" aria-label={alt} data-lesson={slug} style={{ backgroundImage: `url(/concepts/week-${week}.png)`, backgroundPosition: `center ${panel * 25}%` }} />;
}

function VideoLesson({ youtubeId, title, creator, duration, reason }: { youtubeId: string; title: string; creator: string; duration: string; reason: string }) {
  const [loaded, setLoaded] = useState(false);
  return <section className="lesson-video" aria-labelledby="video-title"><div className="video-frame">{loaded
    ? <iframe src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`} title={`${title} by ${creator}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
    : <button type="button" onClick={() => setLoaded(true)} aria-label={`Load ${title} video`}><span><Play size={22} /></span><strong>Load video</strong><small>YouTube privacy-enhanced player</small></button>}</div>
    <div><p className="section-label">Selected explanation · {duration}</p><h3 id="video-title">{title}</h3><p>{creator} · {reason}</p><a href={`https://www.youtube.com/watch?v=${youtubeId}`} target="_blank" rel="noreferrer">Open on YouTube <ArrowRight size={14} /></a></div></section>;
}

export function LearnWorkspace({ lessonSlug, initialStep }: { lessonSlug: LessonSlug; initialStep?: string }) {
  const lesson = learningLesson(lessonSlug);
  const { state, dispatch } = useLearnerState();
  const saved = state.lessons[lesson.slug];
  const requestedStage = stages.find((item) => item.id === initialStep)?.id;
  const savedStageIndex = saved?.stage === "complete" ? stages.length : stages.findIndex((item) => item.id === saved?.stage);
  const requestedStageIndex = stages.findIndex((item) => item.id === requestedStage);
  const allowedRequestedStage = requestedStage && requestedStageIndex <= savedStageIndex ? requestedStage : undefined;
  const [stage, setStage] = useState<LessonStage>(allowedRequestedStage ?? saved?.stage ?? "understand");
  const [code, setCode] = useState(saved?.code || starterFor(state.profile.language, lesson.slug));
  const [transferCode, setTransferCode] = useState(saved?.transferCode || starterFor(state.profile.language, lesson.slug));
  const [prediction, setPrediction] = useState(saved?.prediction ?? "");
  const [explanation, setExplanation] = useState(saved?.explanation ?? "");
  const [conceptVisible, setConceptVisible] = useState(stage !== "code");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [ghostText, setGhostText] = useState<string>();
  const [grade, setGrade] = useState<{ score: number; feedback: string[] }>();
  const abortRef = useRef<AbortController | null>(null);
  const stageIndex = stage === "complete" ? stages.length : Math.max(0, stages.findIndex((item) => item.id === stage));
  const hintsUsed = saved?.hintsUsed ?? [];
  const nextAssistance = assistanceOrder[Math.min(hintsUsed.length, assistanceOrder.length - 1)] ?? "next-step";
  const curriculumDay = SPRINT_DAYS.find((day) => day.lessonSlug === lesson.slug);
  const context = useMemo(() => [
    `Lesson: ${lesson.title}`, `Outcome: ${lesson.outcome}`, `Why: ${lesson.why}`, `Definition: ${lesson.definition}`,
    `Input contract: ${lesson.inputFormat}`, `Language: ${state.profile.language}`, `Current stage: ${stage}`,
    `Learner prediction: ${prediction || "not recorded"}`, `Learner code:\n${stage === "transfer" ? transferCode : code}`,
  ].join("\n"), [code, lesson, prediction, stage, state.profile.language, transferCode]);

  useEffect(() => {
    const timer = window.setTimeout(() => dispatch({ type: "lesson.save", payload: { lessonId: lesson.slug, progress: { stage, language: state.profile.language, code, transferCode, prediction, explanation } } }), 600);
    return () => window.clearTimeout(timer);
  }, [code, dispatch, explanation, lesson.slug, prediction, stage, state.profile.language, transferCode]);

  function move(next: LessonStage) {
    setStage(next); setResult(null); setHint(null); setGhostText(undefined);
    if (next === "code") setConceptVisible(false);
    dispatch({ type: "lesson.save", payload: { lessonId: lesson.slug, progress: { stage: next, language: state.profile.language, code, transferCode, prediction, explanation } } });
    const completedItem = next === "code" ? `d${curriculumDay?.day}-concept` : next === "transfer" ? `d${curriculumDay?.day}-explain` : undefined;
    if (curriculumDay && completedItem && !state.sprint.completedItems.includes(completedItem)) {
      dispatch({ type: "plan.toggle", payload: { itemId: completedItem, completedAt: new Date().toISOString() } });
    }
  }

  async function requestTutor(purpose: AssistanceLevel, inlineCompletion = false) {
    setHintLoading(true); setHint(null);
    try {
      const controller = new AbortController(); abortRef.current = controller;
      const response = await fetch("/api/coach", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ purpose, prompt: assistancePrompt[purpose], context, lessonId: lesson.slug }), signal: controller.signal });
      const payload = await response.json() as { answer?: string; error?: string };
      if (!response.ok || !payload.answer) throw new Error(payload.error ?? "Luna is unavailable.");
      if (inlineCompletion) setGhostText(payload.answer); else setHint(payload.answer);
      const used = [...hintsUsed, purpose].filter((item, index, all) => all.indexOf(item) === index);
      dispatch({ type: "lesson.save", payload: { lessonId: lesson.slug, progress: { hintsUsed: used } } });
    } catch (error) {
      const fallbackIndex = Math.min(lesson.hints.length - 1, hintsUsed.length);
      setHint(`${error instanceof Error ? error.message : "Luna is unavailable."} Built-in fallback: ${lesson.hints[fallbackIndex]}`);
    } finally { abortRef.current = null; setHintLoading(false); }
  }

  async function runTests(transfer: boolean) {
    setRunning(true); setResult(null);
    const source = transfer ? transferCode : code;
    const startedAt = Date.now();
    try {
      const response = await fetch("/api/judge", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ language: state.profile.language, code: source, lessonId: lesson.slug }) });
      const payload = await response.json() as { result?: { outcome: string; stdout: string; stderr: string }; error?: string };
      const ok = response.ok && payload.result?.outcome === "ok";
      setResult({ ok, message: runnerMessage(payload) });
      dispatch({ type: "lesson.save", payload: { lessonId: lesson.slug, progress: transfer ? { transferPassed: ok, testsPassed: ok, stage: ok ? "complete" : "transfer" } : { testsPassed: ok } } });
      dispatch({ type: "attempt.record", payload: { id: crypto.randomUUID(), itemType: transfer ? "lesson-transfer" : "lesson-code", itemId: lesson.slug, topic: lesson.area, correct: ok, difficulty: transfer ? 0.7 : 0.5, durationMs: Date.now() - startedAt, targetDurationMs: lesson.minutes * 60_000, scaffoldLevel: transfer ? 0 : hintsUsed.length, assistance: transfer ? "none" : hintsUsed.at(-1) ?? "none", transfer, timed: transfer, answer: source, createdAt: new Date().toISOString() } });
      if (ok && transfer) {
        setStage("complete");
        if (curriculumDay) {
          for (const suffix of ["concept", "explain"] as const) {
            const itemId = `d${curriculumDay.day}-${suffix}`;
            if (!state.sprint.completedItems.includes(itemId)) dispatch({ type: "plan.toggle", payload: { itemId, completedAt: new Date().toISOString() } });
          }
        }
      }
    } catch (error) { setResult({ ok: false, message: error instanceof Error ? error.message : "The code runner is unavailable." }); }
    finally { setRunning(false); }
  }

  async function gradeExplanation() {
    try {
      const response = await fetch("/api/responses/grade", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "teach_back", response: explanation }) });
      const payload = await response.json() as { score?: number; feedback?: string[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Feedback is unavailable.");
      setGrade({ score: payload.score ?? 0, feedback: payload.feedback ?? [] });
    } catch (error) { setGrade({ score: 0, feedback: [error instanceof Error ? error.message : "Your explanation is saved."] }); }
  }

  const currentIndex = LEARNING_LESSONS.findIndex((item) => item.slug === lesson.slug);
  const nextLesson = LEARNING_LESSONS[currentIndex + 1];

  return <main className="lesson-workspace">
    <header className="lesson-topbar"><Link href="/curriculum" className="button button--quiet"><ArrowLeft size={16} /> Curriculum</Link><div><span className="brand-mark" aria-hidden="true">G</span><strong>Lesson workspace</strong></div><span><Clock3 size={15} /> {lesson.minutes} min · {state.profile.language === "python" ? "Python" : "Java"}</span></header>
    <section className="lesson-header"><div><p className="section-label">Week {lesson.week} · {lesson.area}</p><h1>{lesson.title}</h1><p>{lesson.outcome}</p></div><aside><Target size={19} /><span><strong>Why interviewers care</strong>{lesson.why}</span></aside></section>
    <nav className="lesson-stage-nav" aria-label="Lesson stages">{stages.map((item, index) => <button type="button" key={item.id} disabled={index > stageIndex} className={cn(index === stageIndex && "is-active", index < stageIndex && "is-done")} onClick={() => index < stageIndex && move(item.id)}><span>{index < stageIndex ? <Check size={14} /> : index + 1}</span>{item.label}</button>)}</nav>

    {stage === "understand" && <div className="lesson-learning-layout"><div className="lesson-content-flow">
      <section className="concept-opening"><div><p className="section-label"><BookOpen size={15} /> Start with the idea</p><h2>{lesson.intuition}</h2><p className="concept-analogy"><strong>Think of it like this:</strong> {lesson.analogy}</p><p>{lesson.definition}</p></div><LessonImage slug={lesson.slug} week={lesson.week} panel={lesson.panel} alt={lesson.visualAlt} /></section>
      <section className="concept-steps"><header><p className="section-label">The repeatable method</p><h2>Four moves to remember</h2></header><ol>{lesson.steps.map((step, index) => <li key={step}><span>{index + 1}</span><strong>{step}</strong></li>)}</ol><p className="complexity-line"><Clock3 size={16} /> {lesson.complexity}</p></section>
      <ConceptVisualizer slug={lesson.slug} />
      <section className="worked-code"><header><div><p className="section-label">One line worth recognizing</p><h2>Worked example in {state.profile.language === "python" ? "Python" : "Java"}</h2></div><Code2 size={20} /></header><pre><code>{lesson.workedExample[state.profile.language]}</code></pre><p>{lesson.inputFormat}</p></section>
      <VideoLesson {...lesson.video} />
      <button type="button" className="button button--primary lesson-next" onClick={() => move("predict")}>I understand the idea <ArrowRight size={17} /></button>
    </div><div className="lesson-ai-column"><div className="ai-column-intro"><BrainCircuit size={18} /><div><strong>Ask while you learn</strong><p>Luna knows this concept, your language, and your current code. Ask for a simpler explanation or a concrete example.</p></div></div><CoachThread title="Luna concept tutor" context={context} lessonId={lesson.slug} /></div></div>}

    {stage === "predict" && <section className="lesson-focus-stage"><div className="focus-stage__intro"><p className="section-label"><BrainCircuit size={16} /> Retrieval before code</p><h2>{lesson.prediction}</h2><p>Write what you believe will happen and why. A committed prediction makes the correction memorable.</p></div><label className="field"><span>Your prediction and reasoning</span><textarea autoFocus rows={7} value={prediction} onChange={(event) => setPrediction(event.target.value)} placeholder="I expect... because..." /><small>At least 20 characters. The answer does not need to be perfect.</small></label><div className="visible-cases"><strong>Visible examples</strong>{lesson.visibleCases.map((item) => <span key={item.input}><code>{item.input || "(empty)"}</code><ArrowRight size={14} /><code>{item.output}</code></span>)}</div><button type="button" className="button button--primary" disabled={prediction.trim().length < 20} onClick={() => move("code")}>Commit and open editor <Code2 size={17} /></button></section>}

    {stage === "code" && <section className="coding-workspace"><header className={cn("concept-recall", !conceptVisible && "is-hidden")}><div><EyeOff size={16} /><span><strong>Recall from memory</strong><p>{lesson.intuition}</p></span></div><button type="button" className="button button--quiet" onClick={() => setConceptVisible((value) => !value)}>{conceptVisible ? "Hide concept" : "Reveal concept"}</button></header><div className="coding-layout">
      <div className="editor-pane"><header><span><Code2 size={16} /> {state.profile.language === "python" ? "Python" : "Java"}</span><small>Implement solve(raw)</small></header><CodeEditor value={code} language={state.profile.language} onChange={(value) => { setCode(value); setGhostText(undefined); }} ghostText={ghostText} /><footer><button type="button" className="button button--secondary" disabled={hintLoading} onClick={() => void requestTutor("completion", true)}><Sparkles size={16} /> Inline suggestion</button><button type="button" className="button button--primary" disabled={running} onClick={() => void runTests(false)}><Play size={16} /> {running ? "Running..." : "Run hidden tests"}</button></footer>{result && <div className={cn("run-result", result.ok ? "run-result--ok" : "run-result--error")} role="status">{result.ok ? <Check size={17} /> : <X size={17} />}<span>{result.message}</span></div>}</div>
      <aside className="help-pane"><p className="section-label"><CircleHelp size={15} /> Help ladder</p><h2>Take only the help you need.</h2><p>Help is recorded so readiness reflects what you can reproduce alone.</p><button type="button" className="button button--secondary" disabled={hintLoading} onClick={() => void requestTutor(nextAssistance)}><Lightbulb size={16} /> {hintLoading ? "Luna is thinking..." : assistancePrompt[nextAssistance]}</button>{hint && <div className="hint-callout"><strong>Luna</strong><p>{hint}</p></div>}<CoachThread title="Ask Luna" context={context} lessonId={lesson.slug} /></aside>
    </div><button type="button" className="button button--primary lesson-next" disabled={!result?.ok} onClick={() => move("explain")}>Explain my solution <ArrowRight size={17} /></button></section>}

    {stage === "explain" && <section className="lesson-focus-stage"><div className="focus-stage__intro"><p className="section-label"><Target size={16} /> Interview answer</p><h2>Explain the approach without narrating every line.</h2><p>State the structure, invariant, complexity, and one edge case as if the interviewer asked why this works.</p></div><label className="field"><span>Your explanation</span><textarea autoFocus rows={9} value={explanation} onChange={(event) => setExplanation(event.target.value)} placeholder="I use... The invariant is... This is O(...) because... One edge case is..." /></label>{grade && <div className="explanation-grade"><strong>{grade.score ? `${grade.score}/100` : "Saved"}</strong><span>{grade.feedback[0] ?? "Ready for the no-help solve."}</span></div>}<div className="stage-actions"><button type="button" className="button button--secondary" disabled={explanation.trim().length < 20} onClick={() => void gradeExplanation()}>Get feedback</button><button type="button" className="button button--primary" disabled={explanation.trim().length < 40} onClick={() => move("transfer")}>Solve a fresh case alone <ArrowRight size={17} /></button></div></section>}

    {stage === "transfer" && <section className="coding-workspace transfer-workspace"><header className="transfer-header"><div><p className="section-label"><RotateCcw size={15} /> Independent transfer</p><h2>{lesson.transferPrompt}</h2><p>The concept and AI help are closed for this pass. This result can raise readiness.</p></div><span>No help · Timed evidence</span></header><div className="editor-pane"><header><span><Code2 size={16} /> Fresh {state.profile.language === "python" ? "Python" : "Java"} attempt</span><small>{lesson.inputFormat}</small></header><CodeEditor value={transferCode} language={state.profile.language} onChange={setTransferCode} /><footer><span /><button type="button" className="button button--primary" disabled={running} onClick={() => void runTests(true)}><Play size={16} /> {running ? "Running..." : "Submit independent solve"}</button></footer>{result && <div className={cn("run-result", result.ok ? "run-result--ok" : "run-result--error")} role="status">{result.ok ? <Check size={17} /> : <X size={17} />}<span>{result.message}</span></div>}</div></section>}

    {stage === "complete" && <section className="lesson-complete"><span><Check size={24} /></span><p className="section-label">Independent evidence recorded</p><h1>{lesson.title} is complete.</h1><p>Your transfer result counts toward readiness. Grindstone will schedule a retrieval based on this attempt.</p><div><Link href="/" className="button button--primary">Return to Today <ArrowRight size={17} /></Link>{nextLesson && <Link href={`/learn/${nextLesson.slug}`} className="button button--secondary">Preview next concept</Link>}</div></section>}
  </main>;
}
