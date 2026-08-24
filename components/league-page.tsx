"use client";

import { Flame, ShieldCheck, Sparkles, Trophy } from "@/components/icons";
import { cn } from "@/lib/utils";
import { Avatar } from "./ui/avatar";
import { relativeTime, useCohort } from "./state/use-cohort";

export function LeaguePage() {
  const { members, activity } = useCohort();
  const ranked = members.map((person, index) => ({ ...person, rank: index + 1 }));
  return (
    <div className="league-page">
      <header className="workspace-heading">
        <div><p className="context-line">Resets Monday · timed attempts only</p><h2>Compete on proof, not volume.</h2><p>XP rewards difficulty, clean solves, gates, and consistency. Repeats diminish fast.</p></div>
        <div className="league-countdown"><Trophy size={18} /><span><small>Weekly reset</small><strong>Monday 00:00 UTC</strong></span></div>
      </header>

      <div className="league-layout">
        <section className="league-table-section">
          {ranked.length > 1 && <div className="podium-strip">
            {ranked.slice(0, 3).map((person) => <div key={person.id} className={cn(person.rank === 1 && "podium-strip__first")}>{person.rank === 1 && <Trophy size={20} />}<Avatar initials={person.initials} size="lg" /><span>{person.rank}</span><strong>{person.name}</strong><small>{person.xp.toLocaleString()} XP</small></div>)}
          </div>}
          <div className="league-table">
            <header><span>Rank</span><span>Learner</span><span>Streak</span><span>Gate</span><span>XP</span></header>
            {ranked.map((person) => (
              <div key={person.id} className={cn(person.self && "league-row--self")}>
                <span className="rank-cell">{person.rank}</span>
                <span className="learner-cell"><Avatar initials={person.initials} size="sm" /><strong>{person.name}</strong>{person.self && <small>You</small>}</span>
                <span><Flame size={15} /> {person.streak}</span><span>{person.gate === null ? "—" : `${person.gate}%`}</span><strong>{person.xp.toLocaleString()}</strong>
              </div>
            ))}
          </div>
        </section>

        <aside className="league-rail">
          <section>
            <div className="section-heading-row"><h3>Recent activity</h3><span className="live-dot">This week</span></div>
            <div className="activity-list">
              {activity.map((item) => <div className="activity-item" key={item.id}><Avatar initials={item.initials} size="sm" /><p><strong>{item.name}</strong> {item.action}<span>{item.detail}</span></p><time>{relativeTime(item.createdAt)}</time></div>)}
              {!activity.length && <p>No timed cohort attempts have been recorded this week.</p>}
            </div>
          </section>
          <section className="xp-rules">
            <span><ShieldCheck size={18} /> Anti-gaming is on</span>
            <p>Only timed attempts with recorded durations earn XP. Repeat rewards diminish after the first clean solve.</p>
            <div><span>Correct timed attempt</span><strong>+30–82</strong></div><div><span>Incorrect timed attempt</span><strong>+4</strong></div><div><span>Friday gate pass</span><strong>+180</strong></div>
          </section>
          <section className="next-unlock"><Sparkles size={18} /><div><span>Next proof</span><strong>Friday gate at 75%</strong><p>Passing unlocks the next week&apos;s higher training load.</p></div></section>
        </aside>
      </div>
    </div>
  );
}
