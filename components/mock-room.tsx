"use client";

import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock3,
  Code2,
  EyeOff,
  Gauge,
  Lock,
  Mic,
  Play,
  ShieldAlert,
  Target,
  Trophy,
  X,
} from "@/components/icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { RunResult } from "@/lib/judge/types";
import { meetsComplexityBar } from "@/lib/judge/complexity";
import { CodeEditor } from "./code-editor";
import { ProgressBar } from "./ui/progress-bar";
import { useLearnerState } from "./state/learner-state-provider";

const mockStarter = `class Solution:
    def longestConsecutive(self, nums: list[int]) -> int:
        # Write your O(n) solution here.
        return 0`;

const mockPack = {
  id: "product-coding-screen",
  company: "Product screening",
  title: "Timed coding screen",
  duration: 35,
  sections: "One medium problem · full six-phase method",
  policy: "No AI permitted",
};

export function MockRoom() {
  const { state, dispatch } = useLearnerState();
  const [active, setActive] = useState(false);
  const [finished, setFinished] = useState(false);
  const [remaining, setRemaining] = useState(mockPack.duration * 60);
  const [code, setCode] = useState(mockStarter);
  const [phase, setPhase] = useState(1);
  const [notes, setNotes] = useState("");
  const [judging, setJudging] = useState(false);
  const [judgeError, setJudgeError] = useState<string | null>(null);
  const [judgeResult, setJudgeResult] = useState<{ result: RunResult; complexity?: { complexity: string; confidence: number }; communicationScore?: number } | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const submitMockRef = useRef<() => void>(() => undefined);
  const submittingRef = useRef(false);
  const complexityBarPassed = meetsComplexityBar(judgeResult?.complexity, "O(n)");

  useEffect(() => {
    if (!active || finished) return;
    const timer = window.setInterval(() => {
      setRemaining((seconds) => {
        if (seconds <= 1) {
          window.clearInterval(timer);
          window.queueMicrotask(() => submitMockRef.current());
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [active, finished]);

  const clock = useMemo(
    () => `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`,
    [remaining],
  );

  function startMock() {
    setRemaining(mockPack.duration * 60);
    setFinished(false);
    setActive(true);
    setPhase(1);
    setJudgeError(null);
    setJudgeResult(null);
    setConfidence(null);
  }

  async function submitMock() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setJudging(true); setJudgeError(null);
    try {
      const response = await fetch("/api/judge", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ language: "python", code, problem: "longest-consecutive", measureComplexity: true, timeoutMs: 12_000 }) });
      const payload = await response.json() as { result?: RunResult; complexity?: { complexity: string; confidence: number }; error?: string };
      if (!response.ok || !payload.result) throw new Error(payload.error ?? "Judge unavailable");
      let communicationScore: number | undefined;
      if (notes.trim().length >= 20) {
        const communicationResponse = await fetch("/api/responses/grade", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "coding_communication", response: notes }) }).catch(() => null);
        if (communicationResponse?.ok) communicationScore = ((await communicationResponse.json()) as { score?: number }).score;
      }
      setJudgeResult({ result: payload.result, complexity: payload.complexity, communicationScore });
      setPhase(6); setFinished(true);
    } catch (error) { setJudgeError(error instanceof Error ? error.message : "Judge unavailable"); }
    finally { submittingRef.current = false; setJudging(false); }
  }

  useEffect(() => {
    submitMockRef.current = () => { void submitMock(); };
  });

  function saveDebrief() {
    dispatch({ type: "attempt.record", payload: {
      id: crypto.randomUUID(), itemType: "mock", itemId: mockPack.id, topic: "Communication",
      correct: judgeResult?.result.outcome === "ok" && complexityBarPassed, difficulty: 0.72, durationMs: (mockPack.duration * 60 - remaining) * 1000,
      targetDurationMs: mockPack.duration * 60_000, predictedSuccess: confidence === null ? undefined : confidence / 100, scaffoldLevel: 0, timed: true,
      communicationScore: judgeResult?.communicationScore, measuredComplexity: judgeResult?.complexity?.complexity, createdAt: new Date().toISOString(),
    } });
    setActive(false); setFinished(false);
  }

  if (active) {
    return (
      <div className="mock-session">
        <header className="mock-session__header">
          <div className="mock-session__identity"><span className="brand-mark">G</span><strong>{mockPack.title}</strong></div>
          <div className={cn("mock-timer", remaining < 300 && "mock-timer--urgent")}><Clock3 size={18} /> {clock}</div>
          <div className="mock-policy"><ShieldAlert size={16} /> {mockPack.policy}</div>
          <button type="button" className="button button--danger" aria-label="End and grade round" disabled={judging || confidence === null || notes.trim().length < 20} onClick={() => void submitMock()}><X size={16} /><span>End & grade</span></button>
        </header>

        <div className="mock-method">
          {["Clarify", "Brute force", "Optimize", "Code", "Hand-test", "Complexity"].map((label, index) => (
            <button key={label} type="button" className={cn(index + 1 === phase && "mock-method--active", index + 1 < phase && "mock-method--done")} onClick={() => index + 1 <= phase && setPhase(index + 1)}>
              <span>{index + 1 < phase ? <Check size={13} /> : index + 1}</span>{label}
            </button>
          ))}
        </div>

        <main className="mock-grid">
          <section className="mock-prompt">
            <div className="mock-prompt__meta"><span>Problem 1 of 1</span><span className="difficulty difficulty--medium">Medium</span></div>
            <h1>Longest Consecutive Sequence</h1>
            <p>Given an unsorted array of integers <code>nums</code>, return the length of the longest consecutive elements sequence.</p>
            <p>Your algorithm must run in <strong>O(n)</strong> time.</p>
            <div className="example-block"><strong>Example</strong><code>Input: [100, 4, 200, 1, 3, 2]</code><code>Output: 4</code><p>The longest sequence is [1, 2, 3, 4].</p></div>
            <div className="constraints-block"><strong>Constraints</strong><ul><li>0 ≤ nums.length ≤ 10⁵</li><li>−10⁹ ≤ nums[i] ≤ 10⁹</li></ul></div>
            <div className="mock-room-rules"><EyeOff size={17} /><p><strong>The safety net is off.</strong> No hints, autocomplete, scaffolding, or sample-run feedback until you submit.</p></div>
          </section>

          <section className="mock-editor-pane">
            <div className="mock-editor-toolbar"><span><Code2 size={16} /> Python 3</span><span><Mic size={16} /> Speak aloud; capture the approach below</span></div>
            <label className="mock-notes" htmlFor="mock-notes"><span>Capture approach, invariant, complexity, and one edge case</span><input id="mock-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Use a hash set; start only at sequence heads; O(n); test duplicates…" /></label>
            <div className="mock-confidence"><span>Predicted chance of passing</span>{[30, 50, 70, 90].map((value) => <button type="button" key={value} className={cn(confidence === value && "mock-confidence--active")} onClick={() => setConfidence(value)}>{value}%</button>)}</div>
            <CodeEditor language="python" value={code} onChange={setCode} />
            <div className="mock-actions">
              <span><Lock size={15} /> Results stay hidden until submission</span>
              <button type="button" className="button button--primary" disabled={judging || confidence === null || notes.trim().length < 20} onClick={() => void submitMock()}>{judging ? "Judging…" : "Submit solution"} <ArrowRight size={17} /></button>
            </div>
            {judgeError && <div className="feedback-box feedback-box--warning"><strong>Submission was not graded</strong><p>{judgeError}</p></div>}
          </section>
        </main>

        {finished && (
          <div className="debrief-backdrop">
            <section className="mock-debrief" role="dialog" aria-modal="true" aria-labelledby="debrief-title">
              <button type="button" className="icon-button debrief-close" aria-label="Close mock" onClick={() => { setActive(false); setFinished(false); }}><X size={19} /></button>
              <div className="debrief-score"><span><Trophy size={22} /></span><div><p>Round debrief</p><h2 id="debrief-title">{judgeResult?.result.outcome !== "ok" ? "The hidden tests found a gap." : complexityBarPassed ? "Correctness proved at the interview bar." : "Correctness passed; the optimality bar did not."}</h2></div><strong>{Math.round(((judgeResult?.result.outcome === "ok" ? 100 : 0) + (judgeResult?.complexity?.complexity === "O(n)" ? 100 : 50) + Math.min(100, remaining / (mockPack.duration * 60) * 100) + (judgeResult?.communicationScore ?? 0)) / 4)}</strong></div>
              <div className="debrief-axes">
                {[{ label: "Correctness", value: judgeResult?.result.outcome === "ok" ? 100 : 0 }, { label: "Complexity", value: judgeResult?.complexity?.complexity === "O(n)" ? 100 : judgeResult?.complexity ? 50 : 0 }, { label: "Time remaining", value: Math.round(remaining / (mockPack.duration * 60) * 100) }, { label: "Communication", value: judgeResult?.communicationScore ?? 0 }].map((axis) => (
                  <div key={axis.label}><span>{axis.label}<strong>{axis.value}</strong></span><ProgressBar value={axis.value} label={`${axis.label} ${axis.value}%`} tone={axis.value > 80 ? "success" : axis.value > 60 ? "primary" : "warning"} /></div>
                ))}
              </div>
              <div className="debrief-feedback">
                <div>{judgeResult?.result.outcome === "ok" ? <Check size={17} /> : <AlertTriangle size={17} />}<p><strong>{judgeResult?.result.outcome === "ok" ? "Every hidden correctness case passed." : "At least one hidden case failed."}</strong>{judgeResult?.result.stdout || judgeResult?.result.stderr}</p></div>
                <div>{judgeResult?.complexity?.complexity === "O(n)" ? <Check size={17} /> : <AlertTriangle size={17} />}<p><strong>Measured complexity: {judgeResult?.complexity?.complexity ?? "unavailable"}.</strong>Target: O(n), inferred from scaling runs at {Math.round((judgeResult?.complexity?.confidence ?? 0) * 100)}% confidence.</p></div>
                <div><Target size={17} /><p><strong>Communication evidence: {judgeResult?.communicationScore ?? "not graded"}</strong>{judgeResult?.communicationScore === undefined ? "The rubric service did not return a score." : "The score comes from approach, invariant, complexity, edge-case, and correctness language."}</p></div>
              </div>
              <button type="button" className="button button--primary" onClick={saveDebrief}>Save debrief and return</button>
            </section>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mock-room-page">
      <header className="workspace-heading">
        <div><p className="context-line">Simulation, not practice</p><h2>Make the room feel familiar.</h2><p>The clock, policy, and rubric match the round you selected. Nothing rescues you mid-attempt.</p></div>
        <div className="mock-readiness"><Gauge size={18} /><span><small>Timed attempts</small><strong>{state.attempts.filter((attempt) => attempt.timed).length}</strong></span></div>
      </header>

      <div className="mock-layout">
        <section className="mock-pack-list">
          <div className="section-heading-row"><div><h3>Choose a room</h3><p>Policies are stored per round and date-stamped.</p></div></div>
          <div className="mock-pack-row mock-pack-row--active"><span className="mock-pack-icon"><Code2 size={19} /></span><div><small>{mockPack.company}</small><strong>{mockPack.title}</strong><p>{mockPack.sections}</p></div><span className="mock-pack-duration"><Clock3 size={14} /> {mockPack.duration}m</span></div>
        </section>

        <aside className="mock-brief">
          <div className="mock-brief__top"><span>{mockPack.company}</span><h3>{mockPack.title}</h3><p>{mockPack.sections}</p></div>
          <dl><div><dt>Duration</dt><dd>{mockPack.duration} minutes</dd></div><div><dt>Navigation</dt><dd>No going back</dd></div><div><dt>AI policy</dt><dd>{mockPack.policy}</dd></div><div><dt>Pass line</dt><dd>75 / 100</dd></div></dl>
          <div className="mock-checklist"><strong>Before you enter</strong><span><Check size={15} /> Quiet room and stable connection</span><span><Check size={15} /> Speak every tradeoff aloud</span><span><Check size={15} /> Do not pause the clock</span></div>
          <button type="button" className="button button--primary mock-start" onClick={startMock}><Play size={18} fill="currentColor" /> Enter room</button>
        </aside>
      </div>
    </div>
  );
}
