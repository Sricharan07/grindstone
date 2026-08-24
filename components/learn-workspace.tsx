"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Check,
  ChevronDown,
  CircleHelp,
  Code2,
  Lightbulb,
  Play,
  RotateCcw,
  Send,
  Sparkles,
} from "@/components/icons";
import { useMemo, useState } from "react";
import { launchLesson as learnLesson } from "@/lib/content/launch-lesson";
import { cn } from "@/lib/utils";
import { ProgressBar } from "./ui/progress-bar";
import { LearningMechanisms } from "./learning-mechanisms";
import { useLearnerState } from "./state/learner-state-provider";
import { CoachThread } from "./coach-thread";
import { masteryPercent } from "@/lib/engine";

const phases = [
  { short: "P", name: "Predict" },
  { short: "R", name: "Run" },
  { short: "I", name: "Investigate" },
  { short: "M", name: "Modify" },
  { short: "M", name: "Make" },
];

export function LearnWorkspace() {
  const { state, dispatch } = useLearnerState();
  const [phase, setPhase] = useState(0);
  const [prediction, setPrediction] = useState("");
  const [confidence, setConfidence] = useState(60);
  const [predictionCommitted, setPredictionCommitted] = useState(false);
  const [traceStep, setTraceStep] = useState(0);
  const [investigation, setInvestigation] = useState<number | null>(null);
  const [modifiedLine, setModifiedLine] = useState("backup = scores");
  const [modifyVerifying, setModifyVerifying] = useState(false);
  const [modifyError, setModifyError] = useState<string | null>(null);
  const [teachBack, setTeachBack] = useState("");
  const [teachBackSent, setTeachBackSent] = useState(false);
  const [teachBackGrade, setTeachBackGrade] = useState<{ score: number; feedback: string[] } | null>(null);
  const [teachBackGrading, setTeachBackGrading] = useState(false);
  const [teachBackError, setTeachBackError] = useState<string | null>(null);
  const [depth, setDepth] = useState<"L1" | "L2" | "L3">("L2");
  const [coachOpen, setCoachOpen] = useState(false);
  const [liveTrace, setLiveTrace] = useState<typeof learnLesson.trace | null>(null);
  const [traceNotice, setTraceNotice] = useState<string | null>(null);
  const [traceLoading, setTraceLoading] = useState(false);

  const traceFrames = liveTrace ?? learnLesson.trace;
  const trace = traceFrames[Math.min(traceStep, traceFrames.length - 1)];
  const phaseProgress = useMemo(() => ((phase + 1) / phases.length) * 100, [phase]);

  function advance() {
    setPhase((current) => Math.min(phases.length - 1, current + 1));
  }

  async function finishTeachBack() {
    setTeachBackGrading(true); setTeachBackError(null);
    try {
      const response = await fetch("/api/responses/grade", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "teach_back", response: teachBack }) });
      const grade = await response.json() as { score?: number; feedback?: string[]; error?: string };
      if (!response.ok || grade.score === undefined || !grade.feedback) throw new Error(grade.error ?? "Teach-back could not be graded");
      setTeachBackGrade({ score: grade.score, feedback: grade.feedback });
      setTeachBackSent(true);
      dispatch({ type: "attempt.record", payload: {
        id: crypto.randomUUID(), itemType: "teach-back", itemId: "mutability-references", topic: "Coding foundations",
        correct: grade.score >= 70, difficulty: 0.45, durationMs: 14 * 60_000, targetDurationMs: 15 * 60_000,
        predictedSuccess: confidence / 100, scaffoldLevel: 1, timed: false, communicationScore: grade.score, createdAt: new Date().toISOString(),
      } });
    } catch (caught) { setTeachBackError(caught instanceof Error ? caught.message : "Teach-back could not be graded"); }
    finally { setTeachBackGrading(false); }
  }

  async function runTrace() {
    setTraceLoading(true); setTraceNotice(null); setTraceStep(0);
    try {
      const response = await fetch("/api/trace", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: learnLesson.code.join("\n") }) });
      const payload = await response.json() as { frames?: Array<{ line: number; locals: Record<string, string> }>; result?: { stdout?: string }; error?: string };
      if (!response.ok || !payload.frames?.length) throw new Error(payload.error ?? "No trace frames returned");
      setLiveTrace(payload.frames.map((frame, index) => ({ line: frame.line, output: index === payload.frames!.length - 1 ? payload.result?.stdout ?? "" : "", explanation: `Executed line ${frame.line}; inspect the live locals before advancing.`, variables: Object.entries(frame.locals).map(([name, value]) => ({ name, value, reference: "" })), heap: [] })));
      setTraceNotice("Live sandbox trace");
    } catch { setLiveTrace(null); setTraceNotice("Judge offline; replaying the verified cached trace"); }
    finally { setTraceLoading(false); advance(); }
  }

  async function verifyModification() {
    setModifyVerifying(true); setModifyError(null);
    try {
      const code = [learnLesson.code[0], modifiedLine, ...learnLesson.code.slice(2)].join("\n");
      const response = await fetch("/api/trace", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) });
      const payload = await response.json() as { result?: { outcome?: string; stdout?: string; stderr?: string }; error?: string };
      if (!response.ok || payload.result?.outcome !== "ok") throw new Error(payload.error ?? payload.result?.stderr ?? "Modified program did not run");
      if (payload.result.stdout?.trim() !== "[72, 81]") throw new Error(`Expected [72, 81], received ${payload.result.stdout?.trim() || "no output"}`);
      advance();
    } catch (caught) { setModifyError(caught instanceof Error ? caught.message : "Modification could not be verified"); }
    finally { setModifyVerifying(false); }
  }

  return (
    <div className="learn-workspace">
      <header className="learn-header">
        <div>
          <p className="context-line">{learnLesson.topic} · {learnLesson.duration} min</p>
          <h2>{learnLesson.title}</h2>
        </div>
        <div className="segmented" aria-label="Lesson depth">
          {(["L1", "L2", "L3"] as const).map((level) => (
            <button
              key={level}
              type="button"
              className={cn(depth === level && "segmented__active")}
              onClick={() => setDepth(level)}
            >
              {level}
            </button>
          ))}
        </div>
      </header>

      <section className="depth-copy" aria-live="polite">
        {depth === "L1" && <><span>Intuition · 60 seconds</span><p>Variables can hold directions to objects. Copying the direction does not duplicate the destination, so two names can reach one mutable list.</p></>}
        {depth === "L2" && <><span>Working knowledge</span><p>Assignment copies the reference value. Use <code>.copy()</code>, slicing, or a constructor when independent top-level state is required; nested objects still need an explicit deep-copy decision.</p><small>Trap: <code>backup = scores</code> is aliasing, not cloning.</small></>}
        {depth === "L3" && <><span>Under the hood</span><p>CPython stores object references in local slots. Both slots point to the same heap object, and <code>append</code> mutates that object in place. Reference counting changes when the alias is created, but object identity does not.</p><small>Tradeoff: copying costs O(n) time and space; aliasing is O(1) but shares mutation.</small></>}
      </section>

      <div className="phase-line" aria-label={`PRIMM phase: ${phases[phase].name}`}>
        {phases.map((item, index) => (
          <button
            type="button"
            key={`${item.name}-${index}`}
            disabled={index > phase}
            className={cn(
              "phase-step",
              index === phase && "phase-step--active",
              index < phase && "phase-step--done",
            )}
            onClick={() => index < phase && setPhase(index)}
          >
            <span>{index < phase ? <Check size={14} /> : item.short}</span>
            <strong>{item.name}</strong>
          </button>
        ))}
        <ProgressBar value={phaseProgress} label="Lesson phase progress" />
      </div>

      <div className="lesson-stage">
        {phase === 0 && (
          <section className="prediction-stage">
            <div className="learning-instruction">
              <span className="instruction-icon"><BrainCircuit size={21} /></span>
              <div>
                <h3>Commit before you run</h3>
                <p>Read the code. Predict the exact output and explain what <code>backup</code> points to. The run stays locked until your prediction is recorded.</p>
              </div>
            </div>

            <CodePanel activeLine={0} />

            <div className="prediction-form">
              <label htmlFor="prediction">What prints, and why?</label>
              <textarea
                id="prediction"
                rows={4}
                value={prediction}
                disabled={predictionCommitted}
                onChange={(event) => setPrediction(event.target.value)}
                placeholder="I think it prints… because…"
              />
              <div className="confidence-row">
                <label htmlFor="confidence">Confidence</label>
                <input
                  id="confidence"
                  type="range"
                  min={20}
                  max={100}
                  step={20}
                  value={confidence}
                  disabled={predictionCommitted}
                  onChange={(event) => setConfidence(Number(event.target.value))}
                />
                <output>{confidence}%</output>
              </div>
              <button
                type="button"
                className="button button--primary"
                disabled={prediction.trim().length < 8 || predictionCommitted}
                onClick={() => setPredictionCommitted(true)}
              >
                {predictionCommitted ? <Check size={17} /> : <BrainCircuit size={17} />}
                {predictionCommitted ? "Prediction committed" : "Commit prediction"}
              </button>
              {predictionCommitted && (
                <button type="button" className="button button--secondary" onClick={() => void runTrace()} disabled={traceLoading}>
                  <Play size={17} fill="currentColor" /> {traceLoading ? "Tracing" : "Run code"}
                </button>
              )}
            </div>
          </section>
        )}

        {phase === 1 && (
          <section className="run-stage">
            <div className="visualizer-grid">
              <div>
                <div className="panel-heading">
                  <div>
                    <span>Execution</span>
                    <h3>Step through the notional machine</h3>
                  </div>
                  <span className="mono-readout">{traceStep + 1} / {traceFrames.length}</span>
                </div>
                <CodePanel activeLine={trace.line} />
                <div className="trace-controls">
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Previous execution step"
                    disabled={traceStep === 0}
                    onClick={() => setTraceStep((step) => Math.max(0, step - 1))}
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div>
                    <strong>Line {trace.line}</strong>
                    <p>{trace.explanation}</p>
                  </div>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Next execution step"
                    disabled={traceStep === traceFrames.length - 1}
                    onClick={() => setTraceStep((step) => Math.min(traceFrames.length - 1, step + 1))}
                  >
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>

              <div className="machine-panel">
                <div className="machine-section">
                  <span>Names</span>
                  {trace.variables.map((variable) => (
                    <div className="variable-row" key={variable.name}>
                      <code>{variable.name}</code>
                      <ArrowRight size={15} />
                      <strong>{variable.value}</strong>
                    </div>
                  ))}
                </div>
                <div className="machine-section">
                  <span>Heap</span>
                  {trace.heap.map((item) => (
                    <div className="heap-object" key={item.id}>
                      <small>object @{item.id}</small>
                      <code>{item.value}</code>
                    </div>
                  ))}
                </div>
                <div className="machine-section output-section">
                  <span>Output</span>
                  <code>{trace.output || "No output yet"}</code>
                </div>
              </div>
            </div>
            <footer className="lesson-footer">
              <p>Your prediction: <strong>{prediction}</strong>{traceNotice && <small className="trace-source">{traceNotice}</small>}</p>
              <button type="button" className="button button--primary" onClick={advance} disabled={traceStep < 2}>
                Reconcile the gap <ArrowRight size={17} />
              </button>
            </footer>
          </section>
        )}

        {phase === 2 && (
          <section className="investigate-stage narrow-stage">
            <div className="learning-instruction">
              <span className="instruction-icon"><Lightbulb size={21} /></span>
              <div>
                <h3>What caused the surprise?</h3>
                <p>Choose the explanation that matches the trace, not the output alone.</p>
              </div>
            </div>
            <div className="choice-list">
              {[
                "append creates a new list and assigns it to both names.",
                "assignment copied the list values into backup.",
                "both names held the same reference, so mutation was visible through either name.",
              ].map((choice, index) => (
                <button
                  type="button"
                  key={choice}
                  className={cn(
                    "choice-row",
                    investigation === index && (index === 2 ? "choice-row--correct" : "choice-row--wrong"),
                  )}
                  onClick={() => setInvestigation(index)}
                >
                  <span>{String.fromCharCode(65 + index)}</span>
                  <p>{choice}</p>
                  {investigation === index && (index === 2 ? <Check size={18} /> : <RotateCcw size={18} />)}
                </button>
              ))}
            </div>
            {investigation !== null && (
              <div className={cn("feedback-box", investigation === 2 ? "feedback-box--success" : "feedback-box--warning")}>
                <strong>{investigation === 2 ? "That matches the machine." : "Look at line 2 again."}</strong>
                <p>{investigation === 2 ? "Assignment copies the reference, not the object. Mutating the list changes the one object both names can reach." : "If a new list had been created, the trace would show a second heap address."}</p>
              </div>
            )}
            <button type="button" className="button button--primary align-end" disabled={investigation !== 2} onClick={advance}>
              Modify the program <ArrowRight size={17} />
            </button>
          </section>
        )}

        {phase === 3 && (
          <section className="modify-stage narrow-stage">
            <div className="learning-instruction">
              <span className="instruction-icon"><Code2 size={21} /></span>
              <div>
                <h3>Make the independence explicit</h3>
                <p>Change only line 2 so appending to <code>scores</code> does not change <code>backup</code>.</p>
              </div>
            </div>
            <div className="editable-code">
              <code>scores = [72, 81]</code>
              <label htmlFor="modified-line">2</label>
              <input id="modified-line" value={modifiedLine} onChange={(event) => setModifiedLine(event.target.value)} spellCheck={false} />
              <code>scores.append(94)</code>
              <code>print(backup)</code>
            </div>
            <div className="expected-output">
              <span>Expected after your change</span>
              <code>[72, 81]</code>
            </div>
            <button
              type="button"
              className="button button--primary align-end"
              disabled={modifyVerifying || (!modifiedLine.includes("copy") && !modifiedLine.includes("[:]"))}
              onClick={() => void verifyModification()}
            >
              {modifyVerifying ? "Verifying…" : "Verify and continue"} <Check size={17} />
            </button>
            {modifyError && <p className="warning-text">{modifyError}</p>}
          </section>
        )}

        {phase === 4 && (
          <section className="make-stage narrow-stage">
            <div className="learning-instruction">
              <span className="instruction-icon"><BookOpen size={21} /></span>
              <div>
                <h3>Teach it back</h3>
                <p>A beginner asks: “Why did changing <code>scores</code> also change <code>backup</code>?” Explain without using the word “because” twice.</p>
              </div>
            </div>
            <label className="teach-back-field" htmlFor="teach-back">
              Your explanation
              <textarea
                id="teach-back"
                rows={7}
                value={teachBack}
                disabled={teachBackSent}
                onChange={(event) => setTeachBack(event.target.value)}
                placeholder="Both names…"
              />
            </label>
            {!teachBackSent ? (
              <button
                type="button"
                className="button button--primary align-end"
                onClick={() => void finishTeachBack()}
                disabled={teachBack.trim().length < 30 || teachBackGrading}
              >
                {teachBackGrading ? "Grading…" : "Send teach-back"} <Send size={17} />
              </button>
            ) : (
              <div className="coach-response">
                <span><Sparkles size={18} /> Coach</span>
                <p><strong>{(teachBackGrade?.score ?? 0) >= 70 ? "Mental model supported." : "The explanation needs another retrieval."}</strong> {teachBackGrade?.feedback.length ? `Make these ideas explicit: ${teachBackGrade.feedback.join(", ")}.` : "You connected assignment, references, mutation, and an independent copy."}</p>
                <div><Check size={16} /> {teachBackGrade?.score ?? 0}/100 · next review scheduled by FSRS</div>
              </div>
            )}
            {teachBackError && <p className="warning-text">{teachBackError}</p>}
          </section>
        )}
      </div>

      <LearningMechanisms mastery={state.mastery["Coding foundations"] ? masteryPercent(state.mastery["Coding foundations"]) / 100 : 0} />

      <button type="button" className="why-button" title="Ask the coach why this works" onClick={() => setCoachOpen(true)}>
        <CircleHelp size={17} /> Why does this work? <ChevronDown size={15} />
      </button>
      {coachOpen && <CoachThread title="Why this works" context={`${learnLesson.title}\n${learnLesson.code.join("\n")}\nPrediction: ${prediction}`} onClose={() => setCoachOpen(false)} />}
    </div>
  );
}

function CodePanel({ activeLine }: { activeLine: number }) {
  return (
    <div className="code-panel" aria-label="Python code example">
      <div className="code-panel__bar">
        <span><i /> example.py</span>
        <strong>Python</strong>
      </div>
      <pre>
        {learnLesson.code.map((line, index) => (
          <code key={line} className={cn(activeLine === index + 1 && "code-line--active")}>
            <span>{index + 1}</span>{line}
          </code>
        ))}
      </pre>
    </div>
  );
}
