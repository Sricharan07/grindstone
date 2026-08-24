"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleDot,
  Clock3,
  Code2,
  Flame,
  Gauge,
  MessageSquareText,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  Timer,
  Trophy,
} from "@/components/icons";
import { useEffect, useState } from "react";
import { dailyPlanFor } from "@/lib/product/daily-plan";
import { routeReadiness } from "@/lib/product/evidence";
import { cn, formatMinutes } from "@/lib/utils";
import { Avatar } from "./ui/avatar";
import { ProgressBar } from "./ui/progress-bar";
import { useLearnerState } from "./state/learner-state-provider";
import { relativeTime, useCohort } from "./state/use-cohort";

const itemIcon = {
  review: RotateCcw,
  recognition: CircleDot,
  concept: Sparkles,
  coding: Code2,
  aptitude: Target,
  debugging: Gauge,
  mock: Timer,
  "review-sheet": MessageSquareText,
};

export function TodayDashboard() {
  const { state, dispatch } = useLearnerState();
  const { activity } = useCohort();
  const [sessionRunning, setSessionRunning] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [now] = useState(() => new Date());
  const todayKey = now.toISOString().slice(0, 10);
  const [standupOpen, setStandupOpen] = useState(true);
  const [standup, setStandup] = useState(() => state.sprint.standupDate === todayKey ? state.sprint.standup ?? "" : "");
  const standupSaved = state.sprint.standupDate === todayKey;
  const todayPlan = dailyPlanFor(state, now);
  const completed = state.sprint.completedItems.filter((id) => todayPlan.items.some((item) => item.id === id));
  const readiness = routeReadiness(state);
  const weekday = new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(now);
  const mondayIndex = (now.getDay() + 6) % 7;
  const daysToGate = (5 - now.getDay() + 7) % 7;
  const sprintDays = ["M", "T", "W", "T", "F", "S", "S"].map((label, index) => ({
    label,
    status: index < mondayIndex ? "done" : index === mondayIndex ? "current" : index === 4 ? "gate" : index === 6 ? "rest" : "future",
  }));

  useEffect(() => {
    if (!sessionRunning) return;
    const timer = window.setInterval(() => setSessionSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [sessionRunning]);

  const progress = Math.round((completed.length / Math.max(todayPlan.items.length, 1)) * 100);

  function toggleItem(id: string) {
    dispatch({ type: "plan.toggle", payload: { itemId: id } });
  }

  if (state.sprint.status === "draft") {
    return <div className="diagnostic-runner diagnostic-result">
      <span className="result-mark"><Target size={24} /></span>
      <p className="context-line">New four-week sprint</p>
      <h1>Set the target before the clock starts.</h1>
      <p>Your route, commitment, and diagnostic create the first real plan. No progress is pre-filled.</p>
      <Link href="/onboarding" className="button button--primary">Start onboarding <ArrowRight size={17} /></Link>
    </div>;
  }

  if (state.sprint.status === "complete") {
    return <div className="diagnostic-runner diagnostic-result">
      <span className="result-mark"><Trophy size={24} /></span>
      <p className="context-line">Sprint {state.sprint.number} complete</p>
      <h1>The four-week evidence is closed.</h1>
      <p>Review the measured gains before starting another clean four-week block toward the same route.</p>
      <div className="diagnostic-result__goal"><span>Completed goal</span><strong>{state.sprint.goal}</strong><small>{state.attempts.length} attempts · {state.xp} XP</small></div>
      <button type="button" className="button button--primary" onClick={() => dispatch({ type: "sprint.next", payload: { goal: state.sprint.goal, route: state.profile.route, startedAt: new Date().toISOString() } })}>Start sprint {state.sprint.number + 1} <ArrowRight size={17} /></button>
      <Link href="/progress" className="button button--secondary">Review evidence</Link>
    </div>;
  }

  return (
    <div className="today-layout">
      <div className="today-content">
        <section className="today-heading">
          <div>
            <p className="context-line">{weekday} · Sprint {state.sprint.number}, week {state.sprint.week}</p>
            <h2>Keep the pressure useful.</h2>
            <p>{todayPlan.message}</p>
          </div>
          <div className="today-heading__meta">
            <span><Clock3 size={15} /> {formatMinutes(todayPlan.scheduledMinutes)}</span>
            <span><Target size={15} /> {todayPlan.items.length} reps</span>
          </div>
        </section>

        <section className="burndown" aria-labelledby="burndown-title">
          <div className="section-heading-row">
            <div>
              <h3 id="burndown-title">Four-week line</h3>
              <p>{Math.max(0, state.sprint.day - 1)} training days banked. Friday&apos;s mixed gate is next.</p>
            </div>
              <strong>{Math.round(((28 - state.sprint.daysRemaining) / 28) * 100)}%</strong>
          </div>
          <div className="burndown-weeks">
            {[1, 2, 3, 4].map((week) => (
              <div key={week} className={cn("burndown-week", week === state.sprint.week && "burndown-week--current")}>
                <span>Week {week}</span>
                <div className="burndown-days" aria-label={`Week ${week}`}>
                  {Array.from({ length: 7 }, (_, day) => {
                    const globalDay = (week - 1) * 7 + day + 1;
                    const status = globalDay < state.sprint.day ? "done" : globalDay === state.sprint.day ? "current" : globalDay % 7 === 5 ? "gate" : "future";
                    return <i key={day} className={`burndown-day burndown-day--${status}`} title={`Day ${globalDay}: ${status}`} />;
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="week-cadence">
            {sprintDays.map((day, index) => (
              <span key={`${day.label}-${index}`} className={`cadence-day cadence-day--${day.status}`}>
                <i>{day.label}</i>
                <small>{index === mondayIndex ? "Today" : index === 4 ? "Gate" : ""}</small>
              </span>
            ))}
          </div>
        </section>

        <section className="standup-strip">
          <button
            type="button"
            className="standup-strip__prompt"
            onClick={() => setStandupOpen((open) => !open)}
            aria-expanded={standupOpen}
          >
            <span className={cn("check-disc", standupSaved && "check-disc--done")}>
              {standupSaved ? <Check size={16} /> : <MessageSquareText size={16} />}
            </span>
            <span>
              <strong>{standupSaved ? "Intent locked" : "60-second standup"}</strong>
              <small>{standupSaved ? state.sprint.standup : "Name the win that makes today count."}</small>
            </span>
            <ChevronRight size={17} className={cn(standupOpen && "rotate-90")} />
          </button>
          {standupOpen && !standupSaved && (
            <form
              className="standup-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (!standup.trim()) return;
                dispatch({ type: "checkin.standup", payload: { body: standup.trim(), completedAt: new Date().toISOString() } });
                setStandupOpen(false);
              }}
            >
              <label htmlFor="standup">Today counts if I…</label>
              <div>
                <input
                  id="standup"
                  value={standup}
                  onChange={(event) => setStandup(event.target.value)}
                  placeholder="finish the timed solve without a hint"
                />
                <button type="submit" className="button button--secondary" disabled={!standup.trim()}>
                  Commit
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="daily-plan" aria-labelledby="daily-plan-title">
          <div className="section-heading-row">
            <div>
              <h3 id="daily-plan-title">Today’s plan</h3>
              <p>Ordered by retrieval value, not convenience.</p>
            </div>
            <span className="plan-progress-label">{completed.length}/{todayPlan.items.length} complete</span>
          </div>
          <ProgressBar value={progress} label="Today's plan completion" />

          <div className="plan-list">
            {todayPlan.items.map((item, index) => {
              const Icon = itemIcon[item.kind];
              const done = completed.includes(item.id);
              const href = item.kind === "coding" ? "/solve" : item.kind === "concept" ? "/learn" : "/practice";
              return (
                <article key={item.id} className={cn("plan-item", done && "plan-item--done")}>
                  <button
                    type="button"
                    className="plan-check"
                    onClick={() => toggleItem(item.id)}
                    aria-label={`${done ? "Mark incomplete" : "Mark complete"}: ${item.title}`}
                  >
                    {done ? <Check size={16} /> : <span>{index + 1}</span>}
                  </button>
                  <span className="plan-icon"><Icon size={18} /></span>
                  <div className="plan-item__body">
                    <div>
                      <h4>{item.title}</h4>
                      <span>{item.minutes} min · {item.topic}</span>
                    </div>
                    <p>{item.why}</p>
                  </div>
                  <Link href={href} className="icon-button icon-button--quiet" aria-label={`Open ${item.title}`} title={`Open ${item.title}`}>
                    <ArrowRight size={18} />
                  </Link>
                </article>
              );
            })}
          </div>

          <button
            type="button"
            className={cn("button button--primary session-button", sessionRunning && "button--active")}
            onClick={() => setSessionRunning((running) => !running)}
          >
            {sessionRunning ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            {sessionRunning ? "Pause session" : `Start ${todayPlan.scheduledMinutes}-minute plan`}
            {sessionRunning && <span className="session-button__time">{String(Math.floor(sessionSeconds / 60)).padStart(2, "0")}:{String(sessionSeconds % 60).padStart(2, "0")}</span>}
          </button>
          <p className="intention-line">{state.commitment.implementationIntention}</p>
        </section>
      </div>

      <aside className="today-rail" aria-label="Sprint context">
        <section className="rail-section readiness-rail">
          <div className="section-heading-row">
            <h3>Readiness</h3>
            <Link href="/progress">Evidence <ArrowRight size={14} /></Link>
          </div>
          {readiness.map((item) => (
            <div className="readiness-row" key={item.company}>
              <div>
                <span>{item.company}</span>
                <strong>{item.score}</strong>
              </div>
              <ProgressBar
                value={item.score}
                label={`${item.company} readiness ${item.score}%`}
                tone={item.score >= 80 ? "success" : item.score >= 60 ? "primary" : "warning"}
              />
              <small>{item.label} · observed attempts only</small>
            </div>
          ))}
        </section>

        <section className="rail-section gate-callout">
          <div className="gate-callout__icon"><Trophy size={19} /></div>
          <div>
            <span>Friday gate</span>
            <h3>Mixed set under clock</h3>
            <p>Pass line 75% · 42 minutes · no scaffolding</p>
          </div>
          <strong>{daysToGate === 0 ? "Today" : `${daysToGate}d`}</strong>
        </section>

        <section className="rail-section">
          <div className="section-heading-row">
            <h3>Your circle</h3>
            <Link href="/league">League <ArrowRight size={14} /></Link>
          </div>
          <div className="activity-list">
            {activity.slice(0, 3).map((item) => (
              <div className="activity-item" key={item.id}>
                <Avatar initials={item.initials} size="sm" />
                <p><strong>{item.name}</strong> {item.action}<span>{item.detail}</span></p>
                <time>{relativeTime(item.createdAt)}</time>
              </div>
            ))}
            {!activity.length && <p>Cohort activity will appear after the first timed attempts.</p>}
          </div>
        </section>

        <section className="daily-floor">
          <span><Flame size={17} /> {state.streak.days} day identity streak</span>
          <p>You’re someone who trains daily. {state.streak.freezes} freezes are still available this month.</p>
        </section>
      </aside>
    </div>
  );
}
