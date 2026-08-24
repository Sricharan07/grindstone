"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Check,
  CircleHelp,
  Clock3,
  Code2,
  EyeOff,
  Lightbulb,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Target,
  X,
} from "@/components/icons";
import { CodeEditor } from "@/components/code-editor";
import { CoachThread } from "@/components/coach-thread";
import { lessonById, starterFor } from "@/lib/content/lessons";
import { LANGUAGE_LABEL, type Language } from "@/lib/judge/types";
import type { LessonProgress } from "@/lib/product/types";
import { cn } from "@/lib/utils";
import { useLearnerState } from "./state/learner-state-provider";

const phases: LessonProgress["phase"][] = ["concept", "predict", "practice", "explain", "transfer", "complete"];
const phaseLabel: Record<LessonProgress["phase"], string> = {
  concept: "Learn",
  predict: "Predict",
  example: "Example",
  practice: "Code",
  explain: "Explain",
  transfer: "Transfer",
  complete: "Complete",
};
const helpLevels = ["socratic", "concept", "pseudocode", "next-step", "completion"] as const;
const helpLabel = {
  socratic: "Ask me one guiding question",
  concept: "Remind me of the concept",
  pseudocode: "Show pseudocode",
  "next-step": "Show only my next step",
  completion: "Suggest one line",
};

export function LearnWorkspace({ lessonId }: { lessonId?: string }) {
  const { state, dispatch } = useLearnerState();
  const lesson = lessonById(lessonId);
  const language = state.profile.preferredLanguage as Language;
  const saved = state.lessons[lesson.id];
  const [phase, setPhase] = useState<LessonProgress["phase"]>(saved?.phase ?? "concept");
  const [code, setCode] = useState(saved?.code || starterFor(language, lesson.id));
  const [prediction, setPrediction] = useState(saved?.prediction ?? "");
  const [explanation, setExplanation] = useState(saved?.explanation ?? "");
  const [conceptVisible, setConceptVisible] = useState(true);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [transferCode, setTransferCode] = useState(saved?.transferCode || starterFor(language, lesson.id));
  const [grade, setGrade] = useState<{ score: number; feedback: string[] } | null>(null);
  const hintController = useRef<AbortController | null>(null);

  const phaseIndex = phases.indexOf(phase);
  const usedHints = (saved?.hintsUsed ?? []).filter((value): value is (typeof helpLevels)[number] => value !== "none");
  const nextHelp = helpLevels[Math.min(usedHints.length, helpLevels.length - 1)];
  const workedExample = lesson.workedExample[language];
  const context = useMemo(() => [
    `Lesson: ${lesson.title}`,
    `Purpose: ${lesson.purpose}`,
    `Concept: ${lesson.concept}`,
    `Input contract: ${lesson.inputFormat}`,
    `Language: ${LANGUAGE_LABEL[language]}`,
    `Learner code:\n${phase === "transfer" ? transferCode : code}`,
    `Learner prediction: ${prediction || "not recorded"}`,
  ].join("\n"), [code, language, lesson, phase, prediction, transferCode]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      dispatch({ type: "lesson.save", payload: { lessonId: lesson.id, progress: { phase, language, code, transferCode, prediction, explanation } } });
    }, 650);
    return () => window.clearTimeout(timer);
  }, [code, dispatch, explanation, language, lesson.id, phase, prediction, transferCode]);

  function move(next: LessonProgress["phase"]) {
    setPhase(next);
    setRunResult(null);
    if (next === "practice") setConceptVisible(false);
    dispatch({ type: "lesson.save", payload: { lessonId: lesson.id, progress: { phase: next, language, code, prediction, explanation } } });
  }

  async function runTests(isTransfer: boolean) {
    setRunning(true);
    setRunResult(null);
    try {
      const source = isTransfer ? transferCode : code;
      const response = await fetch("/api/judge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ language, code: source, lessonId: lesson.id }),
      });
      const payload = await response.json() as { result?: { outcome: string; stdout: string; stderr: string }; error?: string };
      if (!response.ok || !payload.result) throw new Error(payload.error ?? "The code runner is unavailable.");
      const passed = payload.result.outcome === "ok";
      const message = passed ? payload.result.stdout.trim() : payload.result.stderr.trim() || `Run ended with ${payload.result.outcome.replaceAll("_", " ")}.`;
      setRunResult({ ok: passed, message });
      if (passed) {
        const assistance = isTransfer ? "none" : usedHints.at(-1) ?? "none";
        dispatch({ type: "attempt.record", payload: {
          id: crypto.randomUUID(),
          itemType: isTransfer ? "lesson-transfer" : "lesson-practice",
          itemId: lesson.id,
          topic: lesson.topic,
          correct: true,
          difficulty: isTransfer ? 0.7 : 0.5,
          durationMs: lesson.minutes * 60_000,
          targetDurationMs: lesson.minutes * 60_000,
          scaffoldLevel: isTransfer ? 0 : usedHints.length,
          assistance,
          transfer: isTransfer,
          timed: false,
          answer: source,
          createdAt: new Date().toISOString(),
        } });
        dispatch({ type: "lesson.save", payload: { lessonId: lesson.id, progress: isTransfer
          ? { phase: "complete", transferPassed: true, testsPassed: true }
          : { testsPassed: true } } });
        if (isTransfer) setPhase("complete");
      }
    } catch (error) {
      setRunResult({ ok: false, message: error instanceof Error ? error.message : "The code runner is unavailable." });
    } finally {
      setRunning(false);
    }
  }

  async function requestHint() {
    setHintLoading(true);
    setHint(null);
    try {
      const controller = new AbortController(); hintController.current = controller;
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ purpose: nextHelp, prompt: helpLabel[nextHelp], context, lessonId: lesson.id }),
        signal: controller.signal,
      });
      const payload = await response.json() as { answer?: string; error?: string };
      if (!response.ok || !payload.answer) throw new Error(payload.error ?? "AI help is unavailable.");
      setHint(payload.answer);
      const hintsUsed = [...usedHints, nextHelp].filter((value, index, all) => all.indexOf(value) === index);
      dispatch({ type: "lesson.save", payload: { lessonId: lesson.id, progress: { hintsUsed } } });
    } catch (error) {
      const cancelled = error instanceof DOMException && error.name === "AbortError";
      setHint(cancelled ? "Help request cancelled. Your draft is still saved." : error instanceof Error ? error.message : "AI help is unavailable. Your draft is still saved.");
    } finally {
      hintController.current = null;
      setHintLoading(false);
    }
  }

  async function submitExplanation() {
    try {
      const response = await fetch("/api/responses/grade", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "coding_communication", response: explanation }),
      });
      const payload = await response.json() as { score?: number; feedback?: string[] };
      setGrade({ score: payload.score ?? 0, feedback: payload.feedback ?? [] });
    } catch {
      setGrade({ score: 0, feedback: ["Your explanation is saved; automated feedback is temporarily unavailable."] });
    }
    move("transfer");
  }

  return (
    <div className="integrated-lesson">
      <header className="lesson-overview">
        <div>
          <Link href="/curriculum" className="back-link"><ArrowRight size={15} /> Four-week curriculum</Link>
          <p className="context-line">{lesson.topic} · {LANGUAGE_LABEL[language]} · {lesson.minutes} min</p>
          <h1>{lesson.title}</h1>
          <p>{lesson.purpose}</p>
        </div>
        <div className="lesson-outcome">
          <span><Target size={16} /> Why interviewers care</span>
          <p>{lesson.interviewUse}</p>
        </div>
      </header>

      <nav className="lesson-steps" aria-label="Lesson progress">
        {phases.slice(0, -1).map((item, index) => (
          <button
            type="button"
            key={item}
            disabled={index > phaseIndex}
            className={cn(index === phaseIndex && "lesson-step--active", index < phaseIndex && "lesson-step--done")}
            onClick={() => index < phaseIndex && move(item)}
          >
            <span>{index < phaseIndex ? <Check size={14} /> : index + 1}</span>
            {phaseLabel[item]}
          </button>
        ))}
      </nav>

      {phase === "concept" && (
        <section className="lesson-band concept-band">
          <div className="lesson-band__heading">
            <span><BookOpen size={18} /> Concept</span>
            <h2>Build the mental model before memorizing code.</h2>
          </div>
          <div className="concept-grid">
            <div>
              <p className="concept-lead">{lesson.concept}</p>
              <ul>{lesson.mentalModel.map((item) => <li key={item}>{item}</li>)}</ul>
              <div className="complexity-note"><Clock3 size={16} /><span><strong>Cost:</strong> {lesson.complexity}</span></div>
            </div>
            <div className="worked-example">
              <span>Worked example in {LANGUAGE_LABEL[language]}</span>
              <pre><code>{workedExample}</code></pre>
              <small>{lesson.inputFormat}</small>
            </div>
          </div>
          <button type="button" className="button button--primary align-end" onClick={() => move("predict")}>
            Check my understanding <ArrowRight size={17} />
          </button>
        </section>
      )}

      {phase === "predict" && (
        <section className="lesson-band narrow-stage">
          <div className="lesson-band__heading">
            <span><BrainCircuit size={18} /> Predict</span>
            <h2>{lesson.prediction}</h2>
            <p>Commit an answer before the editor opens. Retrieval makes the next step stick.</p>
          </div>
          <label className="teach-back-field" htmlFor="lesson-prediction">
            Your prediction and reasoning
            <textarea id="lesson-prediction" rows={6} value={prediction} onChange={(event) => setPrediction(event.target.value)} placeholder="I expect... because..." />
          </label>
          <button type="button" className="button button--primary align-end" disabled={prediction.trim().length < 20} onClick={() => move("practice")}>
            Commit and open editor <Code2 size={17} />
          </button>
        </section>
      )}

      {(phase === "practice" || phase === "explain") && (
        <section className="lesson-band coding-band">
          <div className={cn("concept-recall", !conceptVisible && "concept-recall--blurred")}>
            <div>
              <span><EyeOff size={16} /> Recall from memory</span>
              <p>{lesson.concept}</p>
            </div>
            <button type="button" className="icon-button" aria-label={conceptVisible ? "Hide concept" : "Reveal concept"} onClick={() => setConceptVisible((value) => !value)}>
              {conceptVisible ? <EyeOff size={17} /> : <BookOpen size={17} />}
            </button>
          </div>
          <div className="editor-workspace">
            <div className="editor-main">
              <header>
                <div><span>Practice editor</span><h2>Implement the contract in {LANGUAGE_LABEL[language]}.</h2></div>
                <code>{lesson.id}</code>
              </header>
              <p className="editor-contract">{lesson.inputFormat}</p>
              <CodeEditor value={code} language={language} onChange={setCode} ghostText={usedHints.includes("completion") ? hint ?? undefined : undefined} />
              <div className="visible-tests">
                <span>Examples</span>
                {lesson.visibleCases.map((test) => <code key={test.input}>{test.input || '""'} <ArrowRight size={13} /> {test.output}</code>)}
              </div>
              <div className="editor-actions">
                <button type="button" className="button button--primary" disabled={running} onClick={() => void runTests(false)}>
                  <Play size={17} fill="currentColor" /> {running ? "Running tests" : "Run hidden tests"}
                </button>
                {runResult && <p className={cn("run-result", runResult.ok ? "run-result--pass" : "run-result--fail")} role="status">{runResult.ok ? <Check size={16} /> : <RotateCcw size={16} />}{runResult.message}</p>}
              </div>
            </div>
            <aside className="help-rail" aria-label="On-demand learning help">
              <span><Lightbulb size={17} /> Help, only when you ask</span>
              <p>Help becomes more specific one step at a time. Using it is fine, but independent transfer is required for full mastery.</p>
              <button type="button" className="button button--secondary" onClick={() => hintLoading ? hintController.current?.abort() : void requestHint()} disabled={usedHints.includes("completion")}>
                {hintLoading ? <X size={16} /> : <Sparkles size={16} />} {hintLoading ? "Cancel help request" : helpLabel[nextHelp]}
              </button>
              {hint && <div className="hint-response"><strong>{helpLabel[usedHints.at(-1) ?? nextHelp]}</strong><p>{hint}</p></div>}
              <button type="button" className="ask-coach-link" onClick={() => setCoachOpen(true)}><CircleHelp size={16} /> Ask a question</button>
              {usedHints.length > 0 && <small>{usedHints.length} help level{usedHints.length === 1 ? "" : "s"} used in this attempt</small>}
            </aside>
          </div>
          {phase === "practice" && runResult?.ok && (
            <button type="button" className="button button--primary align-end" onClick={() => move("explain")}>Explain your approach <ArrowRight size={17} /></button>
          )}
          {phase === "explain" && (
            <div className="explain-panel">
              <div className="lesson-band__heading"><span><Send size={17} /> Explain</span><h2>Explain the invariant, complexity, and one edge case.</h2></div>
              <textarea rows={6} value={explanation} onChange={(event) => setExplanation(event.target.value)} placeholder="My approach uses... The invariant is... This costs... An edge case is..." />
              <button type="button" className="button button--primary" disabled={explanation.trim().split(/\s+/).length < 30} onClick={() => void submitExplanation()}>Continue to fresh transfer <ArrowRight size={17} /></button>
            </div>
          )}
        </section>
      )}

      {phase === "transfer" && (
        <section className="lesson-band transfer-band">
          <div className="lesson-band__heading">
            <span><Target size={18} /> Independent transfer</span>
            <h2>Start fresh. AI help and the worked example are now off.</h2>
            <p>{lesson.transferPrompt}</p>
          </div>
          {grade && <div className="explanation-grade"><strong>Explanation evidence: {grade.score}/100</strong><span>{grade.feedback.length ? `Strengthen: ${grade.feedback.join(", ")}` : "Approach, structure, complexity, and edge cases were all present."}</span></div>}
          <CodeEditor value={transferCode} language={language} onChange={setTransferCode} />
          <div className="editor-actions">
            <button type="button" className="button button--primary" disabled={running} onClick={() => void runTests(true)}><Play size={17} fill="currentColor" /> {running ? "Running transfer" : "Run fresh transfer"}</button>
            {runResult && <p className={cn("run-result", runResult.ok ? "run-result--pass" : "run-result--fail")} role="status">{runResult.ok ? <Check size={16} /> : <RotateCcw size={16} />}{runResult.message}</p>}
          </div>
        </section>
      )}

      {phase === "complete" && (
        <section className="lesson-band completion-band">
          <span className="result-mark"><Check size={24} /></span>
          <p className="context-line">Independent transfer passed</p>
          <h2>{lesson.title} is ready for scheduled recall.</h2>
          <p>Your code, explanation, help history, and fresh transfer are saved. The next practice queue will bring this pattern back before it fades.</p>
          <div><Link href="/curriculum" className="button button--primary">Continue curriculum <ArrowRight size={17} /></Link><Link href="/practice" className="button button--secondary">Open retrieval practice</Link></div>
        </section>
      )}

      {coachOpen && <CoachThread title={`${lesson.title} coach`} context={context} lessonId={lesson.id} onClose={() => setCoachOpen(false)} />}
    </div>
  );
}
