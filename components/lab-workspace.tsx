"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Bot, Check, Clock3, ListChecks, MessageSquareText, Terminal } from "@/components/icons";
import { CoachThread } from "@/components/coach-thread";
import { labGuide } from "@/lib/curriculum/lab-guides";
import { cn } from "@/lib/utils";
import { useLearnerState } from "./state/learner-state-provider";

export function LabWorkspace({ dayNumber }: { dayNumber: number }) {
  const { state, dispatch } = useLearnerState();
  const guide = labGuide(dayNumber);
  const saved = state.labs[String(dayNumber)];
  const [notes, setNotes] = useState(saved?.notes ?? "");
  const [evidence, setEvidence] = useState(saved?.evidence ?? "");
  const [checks, setChecks] = useState<boolean[]>(guide.criteria.map((_, index) => saved?.checks[index] ?? false));
  const [coachOpen, setCoachOpen] = useState(false);
  const [usedLuna, setUsedLuna] = useState(false);
  const startedAt = useRef(0);
  const complete = checks.every(Boolean) && notes.trim().length >= 80 && evidence.trim().length >= 8;
  const aiAllowed = guide.day.kind !== "gate";

  const context = `Day ${dayNumber} Evidence Desk lab\nGoal: ${guide.deliverable}\nAcceptance checks:\n${guide.criteria.map((item, index) => `${index + 1}. ${item}`).join("\n")}\nLearner notes:\n${notes}`;

  useEffect(() => { startedAt.current = Date.now(); }, []);

  function persist(next: { notes?: string; evidence?: string; checks?: boolean[]; completed?: boolean }) {
    dispatch({ type: "lab.save", payload: { day: dayNumber, progress: { notes, evidence, checks, ...next } } });
  }

  function toggleCheck(index: number) {
    const nextChecks = checks.map((value, itemIndex) => itemIndex === index ? !value : value);
    setChecks(nextChecks);
    persist({ checks: nextChecks });
  }

  function completeLab() {
    if (!complete) return;
    const now = new Date().toISOString();
    persist({ completed: true });
    dispatch({
      type: "attempt.record",
      payload: {
        id: crypto.randomUUID(),
        itemType: "lab",
        itemId: `evidence-desk-day-${dayNumber}`,
        topic: guide.day.week >= 3 ? "Applied AI full-stack lab" : "Full-stack engineering lab",
        correct: true,
        difficulty: 0.45 + guide.day.week * 0.1,
        durationMs: Math.max(1, Date.now() - (startedAt.current || Date.now())),
        targetDurationMs: 40 * 60_000,
        scaffoldLevel: usedLuna ? 1 : 0,
        assistance: usedLuna ? "socratic" : "none",
        transfer: true,
        timed: true,
        answer: { evidence, notes, checks },
        createdAt: now,
      },
    });
    const itemId = `d${dayNumber}-lab`;
    if (!state.sprint.completedItems.includes(itemId)) dispatch({ type: "plan.toggle", payload: { itemId, completedAt: now } });
  }

  return (
    <div className="session-workspace">
      <header className="session-heading">
        <Link href="/" className="button button--quiet"><ArrowLeft size={16} /> Today</Link>
        <div><p className="section-label">Day {dayNumber} · Evidence Desk build</p><h1>{guide.deliverable}</h1><p>This is the same capstone for all 28 days. Today adds one interview-sized, testable slice.</p></div>
      </header>

      <div className="lab-session-layout">
        <main className="lab-task">
          <section className="lab-brief">
            <p className="section-label"><ListChecks size={15} /> Definition of done</p>
            <h2>Prove the behavior, not the time spent.</h2>
            <div className="lab-checklist">
              {guide.criteria.map((criterion, index) => <label key={criterion} className={cn(checks[index] && "is-checked")}><input type="checkbox" checked={checks[index]} onChange={() => toggleCheck(index)} /><span>{checks[index] ? <Check size={15} /> : index + 1}</span><strong>{criterion}</strong></label>)}
            </div>
          </section>

          <section className="verification-panel">
            <p className="section-label"><Terminal size={15} /> Verification sequence</p>
            <ol>{guide.verification.map((step) => <li key={step}>{step}</li>)}</ol>
            <p>Use the commands that match your Evidence Desk stack. Record the exact command and observed result in the work log rather than writing “tests passed.”</p>
          </section>
        </main>

        <aside className="lab-evidence">
          <header><div><MessageSquareText size={17} /><span>Work log and proof</span></div><span><Clock3 size={15} /> 40 min block</span></header>
          <label><span>What changed, what failed, and why?</span><textarea rows={11} value={notes} onChange={(event) => setNotes(event.target.value)} onBlur={() => persist({ notes })} placeholder="Example: The unauthorized request returned 500 because... I changed... The regression command now reports..." /></label>
          <label><span>Evidence reference</span><input value={evidence} onChange={(event) => setEvidence(event.target.value)} onBlur={() => persist({ evidence })} placeholder="Commit hash, test output location, or deployed URL" /></label>
          <div className="lab-help">{aiAllowed ? <button type="button" className="button button--secondary" onClick={() => { setCoachOpen(true); setUsedLuna(true); }}><Bot size={16} /> Ask Luna</button> : <span className="lab-ai-locked"><Bot size={16} /> Luna is off for this gate</span>}<small>{usedLuna ? "This artifact will be recorded as assisted." : aiAllowed ? "No AI assistance recorded." : "Independent defense evidence only."}</small></div>
          <button type="button" className="button button--primary" disabled={!complete || saved?.completed} onClick={completeLab}>{saved?.completed ? <><Check size={16} /> Evidence saved</> : <>Complete build evidence <ArrowRight size={16} /></>}</button>
          {!complete && <p className="completion-requirement">Complete all four checks, write at least 80 characters of concrete notes, and add an evidence reference.</p>}
        </aside>
      </div>
      {aiAllowed && coachOpen && <CoachThread title="Luna lab coach" context={context} lessonId={`lab:day-${dayNumber}`} onClose={() => setCoachOpen(false)} />}
    </div>
  );
}
