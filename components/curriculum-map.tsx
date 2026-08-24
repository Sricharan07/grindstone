"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BookOpen, Check, Clock3, Code2, Target, Timer } from "@/components/icons";
import { CURRICULUM } from "@/lib/content/lessons";
import { cn } from "@/lib/utils";
import { useLearnerState } from "./state/learner-state-provider";

const weekPurpose = [
  "Build the language and data-structure foundations used in almost every coding round.",
  "Learn the four most common ways to remove repeated work from linear-data problems.",
  "Move from flat data into nested structure, traversal, and priority-based selection.",
  "Integrate the patterns, recover from mistakes, and rehearse the real interview conditions.",
];

const kindLabel = { learn: "Learn and code", practice: "Recall and apply", checkpoint: "Evidence check", mock: "Interview rehearsal" };
const kindIcon = { learn: BookOpen, practice: Code2, checkpoint: Target, mock: Timer };

export function CurriculumMap() {
  const { state } = useLearnerState();
  const [week, setWeek] = useState<1 | 2 | 3 | 4>(state.sprint.status === "active" ? state.sprint.week : 1);
  const sessions = CURRICULUM.filter((session) => session.week === week);
  const completedCount = CURRICULUM.filter((session) => session.lessonId && state.lessons[session.lessonId]?.transferPassed).length;

  return (
    <div className="curriculum-map curriculum-path">
      <header className="workspace-heading curriculum-heading">
        <div>
          <p className="context-line">Your four-week interview path</p>
          <h1>Know what you are learning and why it matters.</h1>
          <p>Each week teaches a small group of patterns, then asks you to recall and transfer them without the worked example.</p>
        </div>
        <div className="curriculum-progress" aria-label={`${completedCount} of 12 coding lessons independently completed`}>
          <strong>{completedCount}/12</strong>
          <span>coding lessons proven without help</span>
        </div>
      </header>

      <div className="week-tabs" role="tablist" aria-label="Curriculum week">
        {([1, 2, 3, 4] as const).map((value) => (
          <button
            type="button"
            role="tab"
            aria-selected={week === value}
            className={cn(week === value && "week-tab--active")}
            key={value}
            onClick={() => setWeek(value)}
          >
            <span>Week {value}</span>
            <small>{value === 1 ? "Foundations" : value === 2 ? "Linear patterns" : value === 3 ? "Traversal" : "Interview mode"}</small>
          </button>
        ))}
      </div>

      <section className="week-intro" aria-labelledby="week-title">
        <span className="week-number">0{week}</span>
        <div>
          <p className="context-line">Week {week} outcome</p>
          <h2 id="week-title">{weekPurpose[week - 1]}</h2>
        </div>
      </section>

      <ol className="curriculum-sessions">
        {sessions.map((session) => {
          const Icon = kindIcon[session.kind];
          const complete = Boolean(session.lessonId && state.lessons[session.lessonId]?.transferPassed);
          const href = session.lessonId ? `/learn?lesson=${session.lessonId}` : session.kind === "mock" ? "/mock" : "/practice";
          return (
            <li key={session.id} className={cn(complete && "curriculum-session--complete")}>
              <span className="session-order">{complete ? <Check size={17} /> : session.order}</span>
              <div className="session-copy">
                <span><Icon size={15} /> {kindLabel[session.kind]}</span>
                <h3>{session.title}</h3>
                <p>{session.purpose}</p>
              </div>
              <span className="session-duration"><Clock3 size={15} /> {session.minutes} min</span>
              <Link href={href} className="button button--secondary">
                {complete ? "Review" : session.lessonId ? "Start" : "Open"} <ArrowRight size={16} />
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
