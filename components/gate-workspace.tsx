"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Clock3, Code2, Lock, ShieldCheck, Target, Trophy, X } from "@/components/icons";
import { sprintDay } from "@/lib/curriculum/catalog";
import { PROBLEM_LIBRARY } from "@/lib/problems/catalog";
import { cn } from "@/lib/utils";
import { useLearnerState } from "./state/learner-state-provider";

export function GateWorkspace({ dayNumber }: { dayNumber: number }) {
  const { state, dispatch } = useLearnerState();
  const day = sprintDay(dayNumber);
  const weekStart = (day.week - 1) * 7 + 1;
  const candidates = PROBLEM_LIBRARY.filter((problem) => problem.core && typeof problem.day === "number" && problem.day >= weekStart && problem.day < dayNumber).slice(-2);
  const codingAttempts = candidates.map((problem) => state.attempts.find((attempt) => attempt.itemType === "problem" && attempt.itemId === problem.slug && attempt.timed && (attempt.assistance ?? "none") === "none"));
  const aptitudeAttempts = state.attempts.filter((attempt) => attempt.itemType === "aptitude" && attempt.itemId.startsWith(`day${dayNumber}:`));
  const lab = state.labs[String(dayNumber)];
  const priorResult = state.sprint.gates[String(day.week)];
  const locked = dayNumber > state.sprint.day;
  const codingReady = candidates.length === 2 && codingAttempts.every(Boolean);
  const aptitudeReady = aptitudeAttempts.length >= 8;
  const labReady = Boolean(lab?.completed);
  const ready = codingReady && aptitudeReady && labReady;

  const codingScore = candidates.length ? Math.round((codingAttempts.filter((attempt) => attempt?.correct).length / candidates.length) * 50) : 0;
  const aptitudeScore = aptitudeAttempts.length ? Math.round((aptitudeAttempts.filter((attempt) => attempt.correct).length / aptitudeAttempts.length) * 25) : 0;
  const labScore = labReady ? 25 : 0;
  const score = codingScore + aptitudeScore + labScore;

  function submitGate() {
    if (!ready) return;
    const failedTopics = [
      ...(codingScore < 35 ? ["Coding and debugging"] : []),
      ...(aptitudeScore < 15 ? ["Aptitude and SQL"] : []),
      ...(labScore < 25 ? ["Full-stack engineering"] : []),
    ];
    const completedAt = new Date().toISOString();
    dispatch({ type: "gate.complete", payload: { week: day.week, score, failedTopics, completedAt } });
    dispatch({
      type: "attempt.record",
      payload: {
        id: crypto.randomUUID(),
        itemType: "interview-defense",
        itemId: `week-${day.week}-defense`,
        topic: "Interview communication",
        correct: labReady,
        difficulty: 0.6 + day.week * 0.05,
        durationMs: 10 * 60_000,
        targetDurationMs: 10 * 60_000,
        scaffoldLevel: 0,
        assistance: "none",
        transfer: true,
        timed: true,
        communicationScore: labReady ? 80 : 40,
        answer: lab?.notes,
        createdAt: completedAt,
      },
    });
    const itemId = `d${dayNumber}-interview`;
    if (!state.sprint.completedItems.includes(itemId)) dispatch({ type: "plan.toggle", payload: { itemId, completedAt } });
  }

  if (locked) return <section className="session-error"><Lock size={24} /><h1>Week {day.week} gate opens on Day {dayNumber}.</h1><p>The tasks stay hidden until the evidence window so previewing them cannot inflate the result.</p><Link href="/curriculum" className="button button--primary"><ArrowLeft size={16} /> Curriculum</Link></section>;

  if (priorResult) return <div className="session-workspace"><header className="session-heading"><Link href="/" className="button button--quiet"><ArrowLeft size={16} /> Today</Link><div><p className="section-label">Week {day.week} evidence gate</p><h1>{day.title}</h1><p>This result is saved. It can be inspected without overwriting the original evidence.</p></div></header><section className="round-complete"><span className={cn("round-score", priorResult.passed && "is-pass")}>{priorResult.score}%</span><div><p className="section-label">{priorResult.passed ? "Gate passed" : "Targeted repair required"}</p><h2>{priorResult.passed ? "Independent evidence met the weekly bar." : "The next week will retain the failed areas."}</h2><p>{priorResult.failedTopics.length ? `Repair: ${priorResult.failedTopics.join(", ")}.` : "No critical evidence gap was recorded."}</p><div><Link href="/progress" className="button button--primary">See readiness <ArrowRight size={16} /></Link><Link href="/" className="button button--secondary">Continue today</Link></div></div></section></div>;

  return (
    <div className="session-workspace">
      <header className="session-heading"><Link href="/" className="button button--quiet"><ArrowLeft size={16} /> Today</Link><div><p className="section-label">Week {day.week} · Independent evidence</p><h1>{day.title}</h1><p>{day.outcome} Luna, hints, and answer-revealing help stay off for this checkpoint.</p></div></header>
      <section className="gate-notice"><ShieldCheck size={20} /><div><strong>What counts</strong><p>Two timed coding attempts, the day&apos;s eight-question aptitude set, and the completed Evidence Desk defense. Incorrect attempts still let you submit; the score should tell the truth.</p></div><span><Clock3 size={15} /> 55 min interview block</span></section>
      <div className="gate-grid">
        <section className="gate-section"><header><span><Code2 size={17} /> Coding · 50 points</span><b>{codingScore}/50</b></header>{candidates.map((problem, index) => { const attempt = codingAttempts[index]; return <article key={problem.slug}><span className={cn("gate-status", attempt?.correct && "is-done")}>{attempt ? attempt.correct ? <Check size={15} /> : <X size={15} /> : index + 1}</span><div><strong>{problem.title}</strong><p>{problem.pattern} · {problem.difficulty} · timed evidence required</p></div><Link href={`/problems?problem=${problem.slug}&view=core&day=${dayNumber}`} className="button button--quiet">{attempt ? "Retry" : "Open"} <ArrowRight size={15} /></Link></article>; })}</section>
        <section className="gate-section"><header><span><Target size={17} /> Aptitude · 25 points</span><b>{aptitudeScore}/25</b></header><article><span className={cn("gate-status", aptitudeReady && "is-done")}>{aptitudeReady ? <Check size={15} /> : "A"}</span><div><strong>{day.aptitude}</strong><p>{aptitudeAttempts.length} of 8 answers recorded · {aptitudeAttempts.filter((attempt) => attempt.correct).length} correct</p></div><Link href={`/session/${dayNumber}/aptitude`} className="button button--quiet">{aptitudeReady ? "Review" : "Start"} <ArrowRight size={15} /></Link></article></section>
        <section className="gate-section"><header><span><Trophy size={17} /> Capstone defense · 25 points</span><b>{labScore}/25</b></header><article><span className={cn("gate-status", labReady && "is-done")}>{labReady ? <Check size={15} /> : "D"}</span><div><strong>{day.lab}</strong><p>{labReady ? "Four checks, work log, and evidence reference saved." : "Complete the rubric and record concrete proof."}</p></div><Link href={`/session/${dayNumber}/lab`} className="button button--quiet">{labReady ? "Review" : "Open"} <ArrowRight size={15} /></Link></article></section>
      </div>
      <footer className="gate-submit"><div><p className="section-label">Current score</p><strong>{score}%</strong><span>{ready ? score >= 70 ? "Meets the weekly bar" : "Submit honestly; repair follows" : "Complete all three evidence sections"}</span></div><button type="button" className="button button--primary" disabled={!ready} onClick={submitGate}>Submit gate result <ArrowRight size={16} /></button></footer>
    </div>
  );
}
