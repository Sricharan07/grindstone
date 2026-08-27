"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  Code2,
  Flame,
  RotateCcw,
  Target,
  Trophy,
} from "@/components/icons";
import { readinessSummary } from "@/lib/product/evidence";
import { dailyPlanFor } from "@/lib/product/daily-plan";
import { cn } from "@/lib/utils";
import { useLearnerState } from "./state/learner-state-provider";
import { ProgressBar } from "./ui/progress-bar";

const activityIcons: Record<string, typeof Code2> = {
  Recall: RotateCcw,
  Retain: RotateCcw,
  Review: RotateCcw,
  Aptitude: Target,
  Learn: Code2,
  Solve: Code2,
  Build: Code2,
  Explain: Target,
  Interview: Trophy,
  Defend: Trophy,
  Debrief: RotateCcw,
  Repair: RotateCcw,
  "Re-solve": Code2,
  Polish: Code2,
  Plan: Target,
  "Warm up": RotateCcw,
};

export function TodayDashboard() {
  const { state, dispatch } = useLearnerState();
  const plan = dailyPlanFor(state);
  const completed = new Set(state.sprint.completedItems.filter((id) => plan.items.some((item) => item.id === id)));
  const nextItem = plan.items.find((item) => !completed.has(item.id));
  const completedMinutes = plan.items.filter((item) => completed.has(item.id)).reduce((sum, item) => sum + item.minutes, 0);
  const remainingMinutes = plan.scheduledMinutes - completedMinutes;
  const completion = Math.round((completed.size / Math.max(1, plan.items.length)) * 100);
  const readiness = readinessSummary(state);
  const [startHour = 20, startMinute = 0] = state.profile.sessionTime.split(":").map(Number);
  const finishMinutes = (startHour * 60 + startMinute + remainingMinutes) % (24 * 60);
  const finishHour = Math.floor(finishMinutes / 60);
  const finishAt = `${finishHour % 12 || 12}:${String(finishMinutes % 60).padStart(2, "0")} ${finishHour >= 12 ? "PM" : "AM"}`;

  if (!state.profile.onboardingComplete) {
    return (
      <section className="welcome-setup">
        <div className="welcome-setup__copy">
          <p className="section-label">Your interview preparation starts here</p>
          <h1>One 28-day path. One clear task at a time.</h1>
          <p>Choose Python or Java, set your daily time, and Day 1 will teach the first concept inside the editor with Luna beside you.</p>
          <Link href="/onboarding" className="button button--primary">Set up my sprint <ArrowRight size={17} /></Link>
        </div>
        <dl className="welcome-setup__facts">
          <div><dt>Daily</dt><dd>150 min</dd></div>
          <div><dt>Core problems</dt><dd>40</dd></div>
          <div><dt>Capstone</dt><dd>Evidence Desk</dd></div>
          <div><dt>AI tutor</dt><dd>Luna on demand</dd></div>
        </dl>
      </section>
    );
  }

  if (state.sprint.status === "complete") {
    return (
      <section className="sprint-complete">
        <span><Trophy size={24} /></span>
        <p className="section-label">Sprint {state.sprint.number} complete</p>
        <h1>Your evidence is preserved.</h1>
        <p>Review the final readiness confidence and continuation plan before opening another 28-day block.</p>
        <div><Link href="/progress" className="button button--primary">Review evidence <ArrowRight size={17} /></Link><button type="button" className="button button--secondary" onClick={() => dispatch({ type: "sprint.restart", payload: { startedAt: new Date().toISOString() } })}>Start another sprint</button></div>
      </section>
    );
  }

  return (
    <div className="today-page">
      <header className="today-intro">
        <div>
          <p className="section-label">Day {plan.day.day} · Week {plan.day.week} · {plan.day.kind === "learn" ? "Learning day" : plan.day.kind === "gate" ? "Evidence gate" : "Consolidation day"}</p>
          <h1>{plan.day.title}</h1>
          <p>{plan.day.outcome}</p>
        </div>
        <p className="today-why"><Target size={18} /><span><strong>Why this matters</strong>{plan.day.why}</span></p>
      </header>

      <section className="resume-panel" aria-labelledby="resume-title">
        <div className="resume-panel__number">{nextItem ? plan.items.indexOf(nextItem) + 1 : <Check size={22} />}</div>
        <div>
          <p className="section-label">{nextItem ? "Your next task" : `Day ${plan.day.day} evidence is complete`}</p>
          <h2 id="resume-title">{nextItem?.title ?? (plan.day.day < 28 ? `Move to Day ${plan.day.day + 1} when you are ready.` : "Close the sprint while the evidence is fresh.")}</h2>
          <p>{nextItem ? `${nextItem.minutes} minutes · Proof: ${nextItem.proof}` : plan.day.day < 28 ? "There is no calendar deadline. This completed day stays saved until you choose the next one." : plan.day.evidence}</p>
        </div>
        {nextItem ? <Link href={nextItem.href} className="button button--primary">{state.lessons[plan.day.lessonSlug ?? ""] ? "Resume" : "Start"} <ArrowRight size={17} /></Link> : plan.day.day < 28 ? <Link href={`/curriculum?day=${plan.day.day + 1}`} className="button button--primary">Choose next day <ArrowRight size={17} /></Link> : <Link href="/progress" className="button button--primary">Review evidence <ArrowRight size={17} /></Link>}
      </section>

      <section className="today-status" aria-label="Sprint status">
        <div><span>Current day</span><strong>{completedMinutes} / {plan.scheduledMinutes} min</strong><small>{remainingMinutes ? `Finish near ${finishAt}` : "Complete"}</small></div>
        <div><span>Week</span><strong>{state.sprint.week} of 4</strong><small>{state.sprint.daysRemaining} training days in path</small></div>
        <div><span>Streak</span><strong><Flame size={16} /> {state.streak.days} days</strong><small>{state.streak.protectedToday ? "Protected today" : "A timed pass protects today"}</small></div>
        <div><span>Readiness</span><strong>{readiness.enoughEvidence ? readiness.score : "--"}</strong><small>{readiness.confidence}</small></div>
      </section>

      <section className="session-plan" aria-labelledby="session-plan-title">
        <header>
          <div><h2 id="session-plan-title">Day {plan.day.day} session</h2><p>{plan.message}</p></div>
          <span>{completed.size} of {plan.items.length} activities</span>
        </header>
        <ProgressBar value={completion} label={`Day ${plan.day.day} session ${completion}% complete`} />

        <ol className="activity-list">
          {plan.items.map((item, index) => {
            const done = completed.has(item.id);
            const Icon = activityIcons[item.label] ?? Code2;
            const evidenceControlled = /-(aptitude|concept|problems|lab|explain|interview)$/.test(item.id);
            return (
              <li key={item.id} className={cn(done && "is-complete")}>
                {evidenceControlled
                  ? <span className="activity-check" title={done ? "Completed from saved evidence" : "Complete this inside the activity"}>{done ? <Check size={16} /> : index + 1}</span>
                  : <button type="button" className="activity-check" onClick={() => dispatch({ type: "plan.toggle", payload: { itemId: item.id, completedAt: new Date().toISOString() } })} aria-label={`${done ? "Mark incomplete" : "Mark complete"}: ${item.title}`}>{done ? <Check size={16} /> : index + 1}</button>}
                <span className="activity-icon"><Icon size={18} /></span>
                <div className="activity-copy"><span>{item.label} · {item.minutes} min</span><h3>{item.title}</h3><p>{item.proof}</p></div>
                <Link href={item.href} className="icon-button" aria-label={`Open ${item.title}`} title={`Open ${item.title}`}><ArrowRight size={18} /></Link>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
