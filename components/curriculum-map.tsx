"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowRight, Check, Clock3, Code2, Lock, Target, Trophy } from "@/components/icons";
import { activitiesFor, SPRINT_DAYS, WEEK_OUTCOMES, type SprintDay } from "@/lib/curriculum/catalog";
import type { LearnerState } from "@/lib/product/types";
import { cn } from "@/lib/utils";
import { useLearnerState } from "./state/learner-state-provider";

function hasDayProgress(day: SprintDay, state: LearnerState) {
  return state.sprint.completedItems.some((item) => item.startsWith(`d${day.day}-`))
    || Boolean(day.lessonSlug && state.lessons[day.lessonSlug])
    || Boolean(state.aptitude[String(day.day)])
    || Boolean(state.labs[String(day.day)]);
}

function entryActivityFor(day: SprintDay, state: LearnerState) {
  const activities = activitiesFor(day);
  if (day.lessonSlug && !hasDayProgress(day, state)) {
    return activities.find((activity) => activity.id.endsWith("-concept")) ?? activities[0];
  }
  const next = activities.find((activity) => !state.sprint.completedItems.includes(activity.id));
  if (next) return next;
  return activities.find((activity) => activity.id.endsWith("-concept")) ?? activities[0];
}

function actionLabel(day: SprintDay, state: LearnerState) {
  const complete = activitiesFor(day).every((activity) => state.sprint.completedItems.includes(activity.id));
  if (complete) return `Review Day ${day.day}`;
  if (day.day === state.sprint.day) return `Continue Day ${day.day}`;
  if (hasDayProgress(day, state)) return `Continue from Day ${day.day}`;
  return `Start from Day ${day.day}`;
}

function isEvidenceControlled(activityId: string) {
  return /-(aptitude|concept|problems|lab|explain|interview)$/.test(activityId);
}

export function CurriculumMap({ initialDay }: { initialDay?: number }) {
  const router = useRouter();
  const { state, dispatch } = useLearnerState();
  const [selectedDay, setSelectedDay] = useState(initialDay ?? state.sprint.day);
  const detailRef = useRef<HTMLElement>(null);
  const selected = SPRINT_DAYS[selectedDay - 1];
  const activities = activitiesFor(selected);
  const selectedCompletedCount = activities.filter((activity) => state.sprint.completedItems.includes(activity.id)).length;
  const selectedComplete = selectedCompletedCount === activities.length;
  const selectedLocked = selected.kind === "gate" && selected.day !== state.sprint.day && !state.sprint.gates[String(selected.week)];
  const selectedStarted = hasDayProgress(selected, state);
  const selectedEntry = entryActivityFor(selected, state);

  function selectDay(day: number) {
    setSelectedDay(day);
    router.replace(`/curriculum?day=${day}`, { scroll: false });
    if (window.matchMedia("(max-width: 1024px)").matches) {
      window.requestAnimationFrame(() => {
        detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        detailRef.current?.focus({ preventScroll: true });
      });
    }
  }

  function makeCurrent(day: SprintDay, complete: boolean) {
    if (!complete && day.day !== state.sprint.day) {
      dispatch({ type: "sprint.day.select", payload: { day: day.day } });
    }
  }

  return (
    <div className="curriculum-page">
      <header className="page-intro">
        <div><p className="section-label">Your complete 28-day path</p><h1>Choose where you continue.</h1><p>Your current training day never advances just because time passed. Start another day when you are ready, or review completed work without changing your place.</p></div>
        <div className="curriculum-total"><strong>{state.sprint.day}</strong><span>current training day</span></div>
      </header>

      <div className="curriculum-layout">
        <div className="week-bands">
          {WEEK_OUTCOMES.map((week) => {
            const days = SPRINT_DAYS.filter((day) => day.week === week.week);
            return (
              <section key={week.week} className="week-band" aria-labelledby={`week-${week.week}-title`}>
                <header><div><span>Week {week.week}</span><h2 id={`week-${week.week}-title`}>{week.shortTitle}</h2><p>{week.outcome}</p></div><small>{days.filter((day) => activitiesFor(day).every((activity) => state.sprint.completedItems.includes(activity.id))).length}/7 complete</small></header>
                <ol>
                  {days.map((day) => {
                    const dayActivities = activitiesFor(day);
                    const complete = dayActivities.every((activity) => state.sprint.completedItems.includes(activity.id));
                    const started = hasDayProgress(day, state);
                    const current = day.day === state.sprint.day;
                    const locked = day.kind === "gate" && day.day !== state.sprint.day && !state.sprint.gates[String(day.week)];
                    const entry = entryActivityFor(day, state);
                    const label = actionLabel(day, state);
                    return (
                      <li key={day.day} className={cn(selectedDay === day.day && "is-selected")}>
                        <button type="button" onClick={() => selectDay(day.day)} aria-controls="selected-day-detail" aria-pressed={selectedDay === day.day} className={cn("day-select", selectedDay === day.day && "is-selected", complete && "is-complete", current && "is-current")}>
                          <span className="day-index">{complete ? <Check size={15} /> : day.day}</span>
                          <span className="day-copy"><small>{day.kind === "learn" ? "Learn and apply" : day.kind === "gate" ? "Evidence gate" : day.kind === "final" ? "Debrief and continue" : "Consolidate and recover"}</small><strong>{day.title}</strong><em>{day.patterns.join(" · ")}</em></span>
                          <span className="day-status">{current ? "Current" : complete ? "Completed" : locked ? <>Choose first <Lock size={14} /></> : started ? "Paused" : "Ready"}</span>
                        </button>
                        {locked
                          ? <span className="day-open is-locked" aria-label={`Day ${day.day} gate is locked`}><Lock size={16} /></span>
                          : <Link href={entry.href} prefetch={false} onClick={() => makeCurrent(day, complete)} className="day-open" aria-label={`${label}: ${day.title}`} title={`${label}: ${day.title}`}><ArrowRight size={18} /></Link>}
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>

        <aside ref={detailRef} id="selected-day-detail" tabIndex={-1} className="day-detail" aria-label={`Day ${selected.day} details`}>
          <header><span className={cn("day-kind", `day-kind--${selected.kind}`)}>{selected.kind === "learn" ? <Code2 size={16} /> : selected.kind === "gate" ? <Trophy size={16} /> : <Target size={16} />}{selected.kind === "learn" ? "Learning day" : selected.kind === "gate" ? "Evidence gate" : selected.kind === "final" ? "Final consolidation" : "Consolidation"}</span><h2>Day {selected.day}: {selected.title}</h2><p>{selected.outcome}</p></header>
          <p className={cn("day-availability", selectedLocked && "is-locked")}>
            {selectedLocked
              ? `This gate stays hidden until you explicitly choose Day ${selected.day} as your current day. Starting it will move your plan here.`
              : selectedComplete
                ? "Completed. Reopen any activity below without losing your saved evidence."
                : selected.day === state.sprint.day
                  ? "This is your current day. It stays here until you choose another day, however much calendar time passes."
                  : selectedStarted
                    ? "Saved and paused. Continue from the first unfinished activity and make this your current day."
                    : "Ready whenever you are. Starting this day makes it current; your other saved work remains untouched."}
          </p>
          <Link href={selectedEntry.href} onClick={() => makeCurrent(selected, selectedComplete)} className="button button--primary">{actionLabel(selected, state)} <ArrowRight size={17} /></Link>
          <div className="day-detail__time"><Clock3 size={16} /><span><strong>150 minutes</strong><small>{activities.length} ordered activities</small></span></div>
          <section className="day-activity-list" aria-labelledby="day-plan-title">
            <header><strong id="day-plan-title">Day plan</strong><span>{selectedCompletedCount} of {activities.length} done</span></header>
            <ol>
              {activities.map((activity, index) => {
                const done = state.sprint.completedItems.includes(activity.id);
                const controlled = isEvidenceControlled(activity.id);
                return (
                  <li key={activity.id} className={cn(done && "is-complete")}>
                    {controlled || selectedLocked
                      ? <span className="day-activity-status" title={selectedLocked ? "Locked until the scheduled day" : done ? "Completed from saved evidence" : "Complete this inside the activity"}>{done ? <Check size={14} /> : selectedLocked ? <Lock size={13} /> : index + 1}</span>
                      : <button type="button" className="day-activity-status" aria-pressed={done} aria-label={`${done ? "Mark incomplete" : "Mark complete"}: ${activity.title}`} title={`${done ? "Mark incomplete" : "Mark complete"}: ${activity.title}`} onClick={() => dispatch({ type: "plan.toggle", payload: { itemId: activity.id, completedAt: new Date().toISOString() } })}>{done ? <Check size={14} /> : index + 1}</button>}
                    <span className="day-activity-copy"><small>{activity.label} · {activity.minutes} min</small><strong>{activity.title}</strong></span>
                    {selectedLocked
                      ? <span className="day-activity-open is-locked"><Lock size={14} /></span>
                      : <Link href={activity.href} onClick={() => makeCurrent(selected, selectedComplete)} className="day-activity-open" aria-label={`Open ${activity.title}`} title={`Open ${activity.title}`}><ArrowRight size={16} /></Link>}
                  </li>
                );
              })}
            </ol>
          </section>
          <details className="day-coverage">
            <summary>What this day covers</summary>
            <dl>
              <div><dt>Interview focus</dt><dd>{selected.patterns.join(", ")}</dd></div>
              <div><dt>Problems</dt><dd>{selected.problems.length ? selected.problems.join(" and ") : "No new core problem"}</dd></div>
              <div><dt>Build</dt><dd>{selected.lab}</dd></div>
              <div><dt>Aptitude</dt><dd>{selected.aptitude}</dd></div>
              <div><dt>Proof</dt><dd>{selected.evidence}</dd></div>
            </dl>
          </details>
        </aside>
      </div>
    </div>
  );
}
