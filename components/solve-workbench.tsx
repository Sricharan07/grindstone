"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  Clock3,
  Code2,
  Expand,
  FlaskConical,
  Lightbulb,
  ListChecks,
  LoaderCircle,
  Play,
  RotateCcw,
  Send,
  Terminal,
  X,
} from "@/components/icons";
import { useEffect, useMemo, useState } from "react";
import type { Language, RunResult } from "@/lib/judge/types";
import { meetsComplexityBar } from "@/lib/judge/complexity";
import { cn } from "@/lib/utils";
import { CodeEditor } from "./code-editor";
import { useLearnerState } from "./state/learner-state-provider";

const starter: Record<Language, string> = {
  python: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        # Write your solution here.
        return []`,
  java: `import java.util.*;

class Main {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        // Write your solution here.
        return new int[] {};
    }
}`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your solution here.
        return {};
    }
};`,
};

const followUpStarter: Record<Language, string> = {
  python: `class Solution:
    def __init__(self, target: int):
        self.target = target

    def add(self, value: int) -> list[int] | None:
        # Return the first matching index pair, otherwise None.
        return None`,
  java: `import java.util.*;

class Main {
    private final int target;

    Main(int target) { this.target = target; }

    public int[] add(int value) {
        // Return the first matching index pair, otherwise null.
        return null;
    }
}`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
    int target;
public:
    Solution(int target): target(target) {}

    vector<int> add(int value) {
        // Return the first matching index pair, otherwise {}.
        return {};
    }
};`,
};

type JudgePayload = { result: RunResult; complexity?: { complexity: string; confidence: number } };

export function SolveWorkbench() {
  const { state, dispatch } = useLearnerState();
  const [language, setLanguage] = useState<Language>(state.profile.preferredLanguage);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [codeByLanguage, setCodeByLanguage] = useState(starter);
  const [activeProblemTab, setActiveProblemTab] = useState<"description" | "subgoals" | "notes">("description");
  const [bottomPanel, setBottomPanel] = useState<"tests" | "output">("tests");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<JudgePayload | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [approach, setApproach] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [communicationScore, setCommunicationScore] = useState<number | null>(null);
  const [followUpActive, setFollowUpActive] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [notes, setNotes] = useState("");
  const complexityBarPassed = meetsComplexityBar(result?.complexity, "O(n)");

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const clock = useMemo(
    () => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`,
    [seconds],
  );

  async function runCode(submit = false) {
    setRunning(true);
    setBottomPanel("output");
    setResult(null);
    try {
      const response = await fetch("/api/judge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          language,
          code: codeByLanguage[language],
          timeoutMs: 8000,
          problem: followUpActive ? "two-sum-stream" : "two-sum",
          measureComplexity: submit,
        }),
      });
      const payload = (await response.json()) as JudgePayload & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Judge unavailable");
      setResult(payload);
      if (submit) {
        let gradedCommunication: number | undefined;
        const communicationResponse = await fetch("/api/responses/grade", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "coding_communication", response: approach }) }).catch(() => null);
        if (communicationResponse?.ok) {
          const communication = await communicationResponse.json() as { score?: number };
          gradedCommunication = communication.score;
          setCommunicationScore(communication.score ?? null);
        } else setCommunicationScore(null);
        if (payload.result.outcome === "ok") setSubmitted(true);
        dispatch({ type: "attempt.record", payload: {
          id: crypto.randomUUID(), itemType: followUpActive ? "follow-up" : "coding", itemId: followUpActive ? "two-sum-stream" : "two-sum", topic: "Arrays & hashing",
          correct: payload.result.outcome === "ok" && meetsComplexityBar(payload.complexity, "O(n)"), difficulty: followUpActive ? 0.62 : 0.38, durationMs: seconds * 1000, targetDurationMs: 20 * 60_000,
          predictedSuccess: confidence === null ? undefined : confidence / 100, scaffoldLevel: activeProblemTab === "subgoals" ? 1 : 0, timed: true,
          communicationScore: gradedCommunication, measuredComplexity: payload.complexity?.complexity, createdAt: new Date().toISOString(),
        } });
      }
    } catch (error) {
      setResult({
        result: {
          outcome: "internal_error",
          stdout: "",
          stderr: error instanceof Error ? error.message : "Judge unavailable",
          exitCode: null,
          signal: null,
          durationMs: 0,
        },
      });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className={cn("solve-workbench", focusMode && "solve-workbench--focus")}>
      <header className="solve-topbar">
        <Link href="/practice" className="icon-button" aria-label="Back to practice" title="Back to practice"><ArrowLeft size={19} /></Link>
        <div className="solve-title"><span>1</span><strong>Two Sum</strong><em>Easy</em></div>
        <div className="solve-topbar__actions">
          <button type="button" className="icon-button" aria-label={focusMode ? "Exit focus mode" : "Focus mode"} title={focusMode ? "Exit focus mode" : "Focus mode"} onClick={() => setFocusMode((value) => !value)}><Expand size={18} /></button>
          <span className="solve-clock"><Clock3 size={16} /> {clock}</span>
          <button type="button" className="button button--secondary" onClick={() => void runCode(false)} disabled={running}>
            {running ? <LoaderCircle className="spin" size={17} /> : <Play size={17} fill="currentColor" />} Run
          </button>
          <button type="button" className="button button--primary" onClick={() => void runCode(true)} disabled={running || approach.trim().length < 20 || confidence === null}>
            <Send size={16} /> Submit
          </button>
        </div>
      </header>

      <main className="solve-grid">
        <section className="problem-pane">
          <div className="pane-tabs">
            {(["description", "subgoals", "notes"] as const).map((tab) => (
              <button key={tab} type="button" className={cn(activeProblemTab === tab && "pane-tab--active")} onClick={() => {
                if (tab === "notes") setNotes(window.localStorage.getItem(followUpActive ? "grindstone-notes:two-sum-stream" : "grindstone-notes:two-sum") ?? "");
                setActiveProblemTab(tab);
              }}>
                {tab === "description" ? <ListChecks size={16} /> : tab === "subgoals" ? <Lightbulb size={16} /> : <Code2 size={16} />}
                {tab[0].toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <div className="problem-copy">
            {activeProblemTab === "description" && (
              <>
                <h1>{followUpActive ? "Two Sum: streaming follow-up" : "Two Sum"}</h1>
                <div className="problem-tags"><span className="difficulty difficulty--easy">Easy</span><span>Arrays</span><span>Hashing</span></div>
                <p>{followUpActive ? <>Values arrive one at a time. Report the first matching index pair as soon as it becomes available without storing the complete stream.</> : <>Given an array of integers <code>nums</code> and an integer <code>target</code>, return the indices of the two numbers whose sum is <code>target</code>.</>}</p>
                <p>You may assume exactly one answer exists, and you may not use the same element twice. Return the answer in any order.</p>
                <div className="example-block">
                  <strong>Example 1</strong>
                  <code>Input: nums = [2,7,11,15], target = 9</code>
                  <code>Output: [0,1]</code>
                  <p>nums[0] + nums[1] = 2 + 7 = 9.</p>
                </div>
                <div className="constraints-block">
                  <strong>Constraints</strong>
                  <ul><li>2 ≤ nums.length ≤ 10⁴</li><li>−10⁹ ≤ nums[i], target ≤ 10⁹</li><li>Exactly one valid answer exists.</li></ul>
                </div>
                <div className="complexity-bar"><span>Interview bar</span><strong>{followUpActive ? "O(1) work per value · O(unique values) state" : "O(n) time · O(n) space"}</strong></div>
              </>
            )}
            {activeProblemTab === "subgoals" && (
              <div className="subgoal-list">
                <h2>Shape the solution</h2>
                {["Store each value after checking it", "Compute the needed complement", "Return when the complement is already stored", "State why one pass is sufficient"].map((step, index) => (
                  <div key={step}><span>{index + 1}</span><p><strong>{step}</strong><small>{index === 0 ? "Do not match the same index with itself." : "Use the invariant to guide the code."}</small></p></div>
                ))}
              </div>
            )}
            {activeProblemTab === "notes" && (
              <label className="notes-field" htmlFor="solve-notes">Your private notes<textarea id="solve-notes" rows={16} value={notes} onChange={(event) => { const value = event.target.value; setNotes(value); window.localStorage.setItem(followUpActive ? "grindstone-notes:two-sum-stream" : "grindstone-notes:two-sum", value); }} placeholder="Capture the mistake, not the whole solution." /></label>
            )}
          </div>
        </section>

        <section className="editor-pane">
          <div className="editor-toolbar">
            <div className="language-select" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setLanguageMenuOpen(false); }}>
              <button type="button" aria-haspopup="menu" aria-expanded={languageMenuOpen} onClick={() => setLanguageMenuOpen((open) => !open)}><Code2 size={16} /> {language === "cpp" ? "C++" : language[0].toUpperCase() + language.slice(1)} <ChevronDown size={15} /></button>
              <div className={cn("language-menu", languageMenuOpen && "language-menu--open")} role="menu">
                {(["python", "java", "cpp"] as Language[]).map((item) => (
                  <button key={item} type="button" role="menuitem" onClick={() => { setLanguage(item); setLanguageMenuOpen(false); }}>{item === "cpp" ? "C++" : item[0].toUpperCase() + item.slice(1)}</button>
                ))}
              </div>
            </div>
            <div>
              <button type="button" className="icon-button" aria-label="Reset code" title="Reset code" onClick={() => setCodeByLanguage((current) => ({ ...current, [language]: (followUpActive ? followUpStarter : starter)[language] }))}><RotateCcw size={16} /></button>
            </div>
          </div>
          <div className="approach-strip">
            <label htmlFor="approach">Approach before code</label>
            <input id="approach" value={approach} onChange={(event) => setApproach(event.target.value)} placeholder="One pass; map value → index; check complement first" />
            <div className="solve-confidence" aria-label="Predicted chance of passing"><span>Confidence</span>{[30, 50, 70, 90].map((value) => <button type="button" key={value} className={cn(confidence === value && "solve-confidence--active")} onClick={() => setConfidence(value)}>{value}%</button>)}</div>
          </div>
          <CodeEditor
            language={language}
            value={codeByLanguage[language]}
            onChange={(value) => setCodeByLanguage((current) => ({ ...current, [language]: value }))}
          />

          <div className="console-pane">
            <div className="pane-tabs console-tabs">
              <button type="button" className={cn(bottomPanel === "tests" && "pane-tab--active")} onClick={() => setBottomPanel("tests")}><FlaskConical size={16} /> Test cases</button>
              <button type="button" className={cn(bottomPanel === "output" && "pane-tab--active")} onClick={() => setBottomPanel("output")}><Terminal size={16} /> Output</button>
              <span className="console-spacer" />
            </div>
            {bottomPanel === "tests" ? (
              <div className="test-cases">
                <span className="test-case--active">Visible case</span>
                <label>nums <code>[2, 7, 11, 15]</code></label>
                <label>target <code>9</code></label>
              </div>
            ) : (
              <div className="run-output">
                {running && <span><LoaderCircle className="spin" size={17} /> Running in sandbox…</span>}
                {!running && !result && <span><Terminal size={17} /> Run your code to see output.</span>}
                {result && (
                  <>
                    <div className={cn("run-status", result.result.outcome === "ok" ? "run-status--success" : "run-status--error")}>
                      {result.result.outcome === "ok" ? <Check size={17} /> : <X size={17} />}
                      <strong>{result.result.outcome === "ok" ? "Tests passed" : result.result.outcome.replaceAll("_", " ")}</strong>
                      <small>{result.result.durationMs} ms</small>
                    </div>
                    <pre>{result.result.stdout || result.result.stderr}</pre>
                  </>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {submitted && (
        <aside className="submission-drawer" aria-label="Submission feedback">
          <div className="submission-drawer__top"><span><Check size={20} /></span><div><strong>{complexityBarPassed ? result?.complexity ? "Accepted at the interview bar" : "Correctness passed; complexity was not measured" : "Correct, but below the complexity bar"}</strong><p>{`3 hidden tests · ${result?.complexity?.complexity ?? "complexity unavailable"} · ${Math.round((result?.complexity?.confidence ?? 0) * 100)}% confidence`}</p></div><button type="button" className="icon-button" aria-label="Close feedback" onClick={() => setSubmitted(false)}><X size={18} /></button></div>
          <div className="score-axes"><span>Correctness <strong>100</strong></span><span>Complexity <strong>{result?.complexity?.complexity === "O(n)" ? 100 : result?.complexity ? 60 : 0}</strong></span><span>Communication <strong>{communicationScore ?? "Not graded"}</strong></span></div>
          <div className="follow-up"><Bot size={19} /><div><span>Automatic follow-up</span><strong>What changes if the input arrives as a stream?</strong></div></div>
          {complexityBarPassed ? <button type="button" className="button button--primary" onClick={() => { setFollowUpActive(true); setCodeByLanguage(followUpStarter); setSubmitted(false); setResult(null); setApproach(""); setConfidence(null); setCommunicationScore(null); setNotes(window.localStorage.getItem("grindstone-notes:two-sum-stream") ?? ""); setActiveProblemTab("description"); }}>Start follow-up <ArrowRight size={17} /></button> : <button type="button" className="button button--primary" onClick={() => setSubmitted(false)}>Return to optimize <ArrowRight size={17} /></button>}
        </aside>
      )}
    </div>
  );
}
