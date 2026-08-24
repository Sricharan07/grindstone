"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, Clock3, Code2, Lock, Target, Trophy } from "@/components/icons";
import { activitiesFor, SPRINT_DAYS, WEEK_OUTCOMES } from "@/lib/curriculum/catalog";
import { cn } from "@/lib/utils";
import { useLearnerState } from "./state/learner-state-provider";

export function CurriculumMap({ initialDay }: { initialDay?: number }) {
  const { state } = useLearnerState();
  const [selectedDay, setSelectedDay] = useState(initialDay ?? state.sprint.day);
  const selected = SPRINT_DAYS[selectedDay - 1];
  const activities = activitiesFor(selected);
  const selectedComplete = activities.every((activity) => state.sprint.completedItems.includes(activity.id));
  const selectedLocked = selected.kind === "gate" && selected.day > state.sprint.day;
  const selectedHref = selected.lessonSlug ? `/learn/${selected.lessonSlug}` : selected.kind === "gate" ? `/session/${selected.day}/gate` : `/session/${selected.day}/lab`;

  return (
    <div className="curriculum-page">
      <header className="page-intro">
        <div><p className="section-label">Your complete 28-day path</p><h1>Know what you are learning, building, and proving.</h1><p>The order is fixed so each concept supports the next engineering task. Future days are visible; assessment content stays hidden until its evidence window opens.</p></div>
        <div className="curriculum-total"><strong>{state.sprint.day}</strong><span>of 28 days reached</span></div>
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
                    const current = day.day === state.sprint.day;
                    const locked = day.kind === "gate" && day.day > state.sprint.day;
                    return (
                      <li key={day.day}>
                        <button type="button" onClick={() => setSelectedDay(day.day)} className={cn(selectedDay === day.day && "is-selected", complete && "is-complete", current && "is-current")}>
                          <span className="day-index">{complete ? <Check size={15} /> : day.day}</span>
                          <span className="day-copy"><small>{day.kind === "learn" ? "Learn and apply" : day.kind === "gate" ? "Evidence gate" : day.kind === "final" ? "Debrief and continue" : "Consolidate and recover"}</small><strong>{day.title}</strong><em>{day.patterns.join(" · ")}</em></span>
                          <span className="day-status">{locked ? <Lock size={15} /> : current ? "Today" : complete ? "Done" : day.day < state.sprint.day ? "Needs review" : "Upcoming"}</span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>

        <aside className="day-detail" aria-label={`Day ${selected.day} details`}>
          <header><span className={cn("day-kind", `day-kind--${selected.kind}`)}>{selected.kind === "learn" ? <Code2 size={16} /> : selected.kind === "gate" ? <Trophy size={16} /> : <Target size={16} />}{selected.kind === "learn" ? "Learning day" : selected.kind === "gate" ? "Evidence gate" : selected.kind === "final" ? "Final consolidation" : "Consolidation"}</span><h2>Day {selected.day}: {selected.title}</h2><p>{selected.outcome}</p></header>
          <dl>
            <div><dt>Interview focus</dt><dd>{selected.patterns.join(", ")}</dd></div>
            <div><dt>Problems</dt><dd>{selected.problems.length ? selected.problems.join(" and ") : "No new core problem"}</dd></div>
            <div><dt>Build</dt><dd>{selected.lab}</dd></div>
            <div><dt>Aptitude</dt><dd>{selected.aptitude}</dd></div>
            <div><dt>Proof</dt><dd>{selected.evidence}</dd></div>
          </dl>
          <div className="day-detail__time"><Clock3 size={16} /><span><strong>150 minutes</strong><small>{activities.length} ordered activities</small></span></div>
          {selectedLocked ? <p className="locked-note"><Lock size={16} /> Assessment content opens on Day {selected.day} so the result remains valid.</p> : <Link href={selectedHref} className="button button--primary">{selectedComplete ? "Review day" : selected.day === state.sprint.day ? "Resume today" : "Open day"} <ArrowRight size={17} /></Link>}
        </aside>
      </div>
    </div>
  );
}
