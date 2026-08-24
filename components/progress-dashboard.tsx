"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BrainCircuit, CalendarDays, Check, Flame, Gauge, History, Target, Trophy } from "@/components/icons";
import { calibrationPoints, readinessSummary } from "@/lib/product/evidence";
import { cn } from "@/lib/utils";
import { ProgressBar } from "./ui/progress-bar";
import { useCohort } from "./state/use-cohort";
import { useLearnerState } from "./state/learner-state-provider";

type View = "readiness" | "evidence" | "scoreboard";

export function ProgressDashboard() {
  const { state } = useLearnerState();
  const cohort = useCohort();
  const [view, setView] = useState<View>("readiness");
  const [scoreboardEnabled, setScoreboardEnabled] = useState(false);
  const summary = readinessSummary(state);
  const independent = state.attempts.filter((attempt) => attempt.transfer && attempt.timed && (attempt.assistance ?? "none") === "none");
  const calibrations = calibrationPoints(state);
  const lessonCount = Object.values(state.lessons).filter((lesson) => lesson.stage === "complete").length;
  const problemCount = new Set(state.attempts.filter((attempt) => attempt.itemType === "problem" && attempt.correct).map((attempt) => attempt.itemId)).size;

  return <div className="progress-page">
    <header className="page-intro"><div><p className="section-label">Observed performance, not a motivational guess</p><h1>Know what you can reproduce alone.</h1><p>Readiness only rises from timed, no-help transfer evidence. Guided work still builds mastery, but it cannot certify interview performance.</p></div><div className="readiness-number"><strong>{summary.enoughEvidence ? summary.score : "--"}</strong><span>{summary.band}<small>{summary.confidence}</small></span></div></header>
    <nav className="segmented-control progress-nav" aria-label="Progress view">{(["readiness", "evidence", "scoreboard"] as View[]).map((item) => <button type="button" key={item} className={cn(view === item && "is-active")} onClick={() => setView(item)}>{item === "readiness" ? <Gauge size={16} /> : item === "evidence" ? <History size={16} /> : <Trophy size={16} />}{item[0].toUpperCase() + item.slice(1)}</button>)}</nav>

    {view === "readiness" && <div className="readiness-layout">
      <section className="readiness-breakdown"><header><div><p className="section-label">Weighted evidence</p><h2>Five parts of the interview</h2></div><span>{independent.length} eligible attempts</span></header><div className="dimension-list">{summary.dimensions.map((dimension) => <div key={dimension.name}><div><strong>{dimension.name}</strong><span>{Math.round(dimension.weight * 100)}% weight · {dimension.observations} observations</span></div><ProgressBar value={dimension.value} label={`${dimension.name} ${dimension.value}%`} tone={dimension.value >= 70 ? "success" : dimension.value >= 45 ? "primary" : "warning"} /><b>{dimension.observations >= 2 ? `${dimension.value}%` : "Need 2"}</b></div>)}</div></section>
      <aside className="readiness-proof"><p className="section-label"><Target size={15} /> Evidence requirements</p><h2>{summary.enoughEvidence ? "The score is supported." : "The product is still collecting proof."}</h2><ul><li className={cn(independent.length >= 10 && "is-met")}><Check size={15} /> 10+ independent timed attempts</li><li className={cn(Boolean(state.sprint.gate) && "is-met")}><Check size={15} /> One mixed evidence gate</li><li className={cn(summary.dimensions.every((item) => item.observations >= 2) && "is-met")}><Check size={15} /> Two observations in every dimension</li></ul><Link href="/" className="button button--primary">Resume today <ArrowRight size={16} /></Link></aside>
      <section className="progress-stats"><div><Flame size={18} /><span><strong>{state.streak.days} days</strong><small>Current protected streak</small></span></div><div><BrainCircuit size={18} /><span><strong>{lessonCount} / 20</strong><small>Concepts transferred</small></span></div><div><Check size={18} /><span><strong>{problemCount} / 150</strong><small>Problems passed</small></span></div><div><CalendarDays size={18} /><span><strong>Day {state.sprint.day} / 28</strong><small>Current sprint position</small></span></div></section>
    </div>}

    {view === "evidence" && <div className="evidence-layout"><section className="evidence-list"><header><div><p className="section-label">Most recent first</p><h2>Attempt log</h2></div><span>{state.attempts.length} total</span></header>{state.attempts.length ? state.attempts.slice(0, 40).map((attempt) => <article key={attempt.id}><span className={cn("evidence-outcome", attempt.correct && "is-correct")}>{attempt.correct ? <Check size={15} /> : "×"}</span><div><strong>{attempt.topic}</strong><span>{attempt.itemType.replaceAll("-", " ")} · {attempt.timed ? "timed" : "untimed"} · {(attempt.assistance ?? "none").replaceAll("-", " ")}</span></div><time>{new Date(attempt.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}</time></article>) : <div className="empty-state"><History size={22} /><h3>No attempts yet</h3><p>Your first lesson run will appear here.</p></div>}</section><aside className="calibration-summary"><p className="section-label">Confidence calibration</p><h2>{calibrations.length ? `${calibrations.length} predictions compared` : "Commit confidence before timed work"}</h2><p>Accurate confidence helps you choose the right interview pace and know when to ask clarifying questions.</p>{calibrations.slice(0, 6).map((point) => <div key={`${point.topic}-${point.predicted}`}><span>{point.topic}</span><strong>{point.predicted}% → {point.actual}%</strong></div>)}</aside></div>}

    {view === "scoreboard" && <section className="scoreboard-panel"><header><div><p className="section-label">Optional friend cohort</p><h2>Weekly consistency, not public pressure.</h2><p>The board ranks earned XP for the current week. Readiness scores and solution content stay private.</p></div><label className="toggle"><input type="checkbox" checked={scoreboardEnabled} onChange={(event) => setScoreboardEnabled(event.target.checked)} /><span /> Show board</label></header>{scoreboardEnabled ? <div className="scoreboard-table">{cohort.members.map((member, index) => <div key={member.id} className={cn(member.self && "is-self")}><span>{index + 1}</span><i>{member.initials}</i><strong>{member.name}{member.self ? " (you)" : ""}</strong><span><Flame size={14} /> {member.streak}</span><b>{member.xp} XP</b></div>)}</div> : <div className="scoreboard-closed"><Trophy size={24} /><h3>The board is hidden.</h3><p>Turn it on only when comparison helps you return to the work.</p></div>}</section>}
  </div>;
}
