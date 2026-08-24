"use client";

import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BrainCircuit,
  CalendarDays,
  Check,
  Gauge,
  History,
  Target,
} from "@/components/icons";
import { useState } from "react";
import { calibrationPoints, readinessEvidence, routeReadiness } from "@/lib/product/evidence";
import { cn } from "@/lib/utils";
import { ProgressBar } from "./ui/progress-bar";
import { useLearnerState } from "./state/learner-state-provider";
import type { LearnerState } from "@/lib/product/types";
import { masteryPercent } from "@/lib/engine";

export function ProgressDashboard() {
  const { state } = useLearnerState();
  const [view, setView] = useState<"readiness" | "mastery" | "calibration">("readiness");

  return (
    <div className="progress-dashboard">
      <header className="workspace-heading">
        <div><p className="context-line">Observed performance only</p><h2>Know what the room will see.</h2><p>Readiness combines timed correctness, speed, mastery, communication, calibration, and the latest gate.</p></div>
        <span className="status-pill"><CalendarDays size={16} /> Current sprint</span>
      </header>

      <div className="mode-tabs progress-tabs" role="tablist" aria-label="Progress view">
        {(["readiness", "mastery", "calibration"] as const).map((tab) => (
          <button key={tab} type="button" role="tab" aria-selected={view === tab} className={cn(view === tab && "mode-tab--active")} onClick={() => setView(tab)}>
            {tab === "readiness" ? <Gauge size={17} /> : tab === "mastery" ? <Target size={17} /> : <BrainCircuit size={17} />}
            {tab[0].toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {view === "readiness" && <ReadinessView state={state} />}
      {view === "mastery" && <MasteryView state={state} />}
      {view === "calibration" && <CalibrationView state={state} />}
    </div>
  );
}

function ReadinessView({ state }: { state: LearnerState }) {
  const { attempts, topicMastery, timedAccuracy, speed, communication, calibration, gate, score: routeScore } = readinessEvidence(state);
  const outlook = routeReadiness(state);
  const axes = [{ label: "Topic mastery", value: topicMastery, weight: "30%", note: topicMastery >= 70 ? "Above bar" : "Building" }, { label: "Timed accuracy", value: timedAccuracy, weight: "22%", note: timedAccuracy >= 75 ? "Above bar" : "Needs reps" }, { label: "Speed", value: speed, weight: "14%", note: speed >= 70 ? "Stable" : "Focus next" }, { label: "Communication", value: communication, weight: "12%", note: communication >= 70 ? "Stable" : "Focus next" }, { label: "Calibration", value: calibration, weight: "8%", note: calibration >= 75 ? "Calibrated" : "Overconfident" }, { label: "Recent gate", value: gate, weight: "14%", note: state.sprint.gate?.passed ? "Passed" : state.sprint.gate ? "Recalibrated" : "No evidence" }];
  return (
    <div className="readiness-view">
      <section className="readiness-summary">
        <div className="readiness-dial" style={{ "--score": routeScore } as React.CSSProperties}>
          <span><strong>{routeScore}</strong><small>{state.profile.route.replace("-", " ")} route</small></span>
        </div>
        <div className="readiness-summary__copy">
          <span className="status-pill"><History size={14} /> {attempts.length} timed attempts</span>
          <h3>{routeScore >= 75 ? "The evidence clears the current bar." : "The next weakness is visible."}</h3>
          <p>{communication < 60 ? "Communication remains the weakest independent axis in timed attempts." : "The plan is training the lowest measured axis before adding difficulty."}</p>
          <div className="readiness-evidence"><span><Check size={15} /> {attempts.length} timed attempts</span><span><Check size={15} /> {state.sprint.gate ? 1 : 0} mixed gate</span><span><Check size={15} /> {state.driveResults.length} drive runs</span></div>
        </div>
      </section>

      <section className="score-axis-section">
        <div className="section-heading-row"><div><h3>What makes up {routeScore}</h3><p>Mastery 30% · accuracy 22% · speed 14% · communication 12% · calibration 8% · gate 14%.</p></div></div>
        <div className="score-axis-list">
          {axes.map((axis) => (
            <div className="score-axis-row" key={axis.label}>
              <div><span>{axis.label}</span><small>{axis.weight} weight</small></div>
              <ProgressBar value={axis.value} label={`${axis.label} ${axis.value}%`} tone={axis.value >= 75 ? "success" : axis.value >= 60 ? "primary" : "warning"} />
              <strong>{axis.value}</strong><em>{axis.note}</em>
            </div>
          ))}
        </div>
      </section>

      <section className="company-readiness">
        <div className="section-heading-row"><div><h3>Route outlook</h3><p>Same evidence, different interview bars.</p></div></div>
        <div className="company-readiness__rows">
          {outlook.map((item) => (
            <div key={item.company}><span>{item.company}</span><strong>{item.score}</strong><ProgressBar value={item.score} label={`${item.company} readiness`} tone={item.score >= 80 ? "success" : item.score >= 60 ? "primary" : "warning"} /><em>{attempts.length}</em><small>{item.label}</small></div>
          ))}
        </div>
      </section>
    </div>
  );
}

function MasteryView({ state }: { state: LearnerState }) {
  const topics = Object.entries(state.mastery).map(([topic, evidence]) => ({ topic, attempts: evidence.attempts, value: masteryPercent(evidence), confidence: Math.round(evidence.confidence * 100) })).sort((left, right) => left.value - right.value);
  const weakest = topics[0];
  return (
    <div className="mastery-view">
      <section className="mastery-map">
        <div className="section-heading-row"><div><h3>Topic mastery</h3><p>Ratings account for help used, time, difficulty, and confidence accuracy.</p></div><span className="status-pill"><History size={14} /> {state.attempts.length} attempts</span></div>
        <div className="mastery-table">
          <header><span>Topic</span><span>Evidence</span><span>Mastery</span><span>Confidence</span><span /></header>
          {topics.map((topic) => (
            <div key={topic.topic}>
              <strong>{topic.topic}</strong>
              <span>{topic.attempts} attempts</span>
              <div><ProgressBar value={topic.value} label={`${topic.topic} mastery ${topic.value}%`} tone={topic.value >= 70 ? "success" : topic.value >= 50 ? "primary" : "warning"} /><strong>{topic.value}%</strong></div>
              <em>{topic.confidence}%</em>
              <Link href="/practice" className="icon-button" aria-label={`Practice ${topic.topic}`}><ArrowRight size={16} /></Link>
            </div>
          ))}
          {!topics.length && <div><strong>No mastery evidence yet</strong><span>Complete the diagnostic, then submit a timed attempt.</span></div>}
        </div>
      </section>
      <aside className="mastery-focus">
        <span className="status-pill status-pill--warning"><Target size={14} /> Named weakness</span>
        <h3>{weakest ? weakest.topic : "Establish your baseline."}</h3>
        <p>{weakest ? `${weakest.topic} is currently the lowest measured topic. The next plan will schedule it before new difficulty.` : "The diagnostic creates priors without pretending you already have practice evidence."}</p>
        <div><span>Current mastery</span><strong>{weakest?.value ?? 0}%</strong><ProgressBar value={weakest?.value ?? 0} label="Lowest topic mastery" tone="warning" /></div>
        <Link href={state.profile.diagnosticComplete ? "/practice" : "/diagnostic"} className="button button--primary">{state.profile.diagnosticComplete ? "Train this weakness" : "Run diagnostic"} <ArrowRight size={16} /></Link>
      </aside>
    </div>
  );
}

function CalibrationView({ state }: { state: LearnerState }) {
  const points = calibrationPoints(state);
  const gap = points.length ? Math.round(points.reduce((sum, point) => sum + Math.abs(point.predicted - point.actual), 0) / points.length) : 0;
  const over = [...points].sort((left, right) => (right.predicted - right.actual) - (left.predicted - left.actual))[0];
  const under = [...points].sort((left, right) => (left.predicted - left.actual) - (right.predicted - right.actual))[0];
  const closest = [...points].sort((left, right) => Math.abs(left.predicted - left.actual) - Math.abs(right.predicted - right.actual))[0];
  return (
    <div className="calibration-view">
      <section className="calibration-chart-section">
        <div className="section-heading-row"><div><h3>Predicted vs actual</h3><p>Points on the diagonal are calibrated. Above it means overconfidence.</p></div><span className="status-pill status-pill--warning">{gap}% average gap</span></div>
        <div className="calibration-chart" aria-label="Calibration scatter plot">
          <div className="calibration-diagonal" />
          {[0, 25, 50, 75, 100].map((value) => <span key={`x-${value}`} className="axis-x" style={{ left: `${value}%` }}>{value}</span>)}
          {[0, 25, 50, 75, 100].map((value) => <span key={`y-${value}`} className="axis-y" style={{ bottom: `${value}%` }}>{value}</span>)}
          {points.map((point, index) => (
            <span key={`${point.topic}-${index}`} className="calibration-point" style={{ left: `${point.actual}%`, bottom: `${point.predicted}%` }} title={`${point.topic}: predicted ${point.predicted}%, actual ${point.actual}%`}><span>{point.topic}</span></span>
          ))}
          {!points.length && <p>No timed predictions yet. Calibration begins with your first practice answer.</p>}
        </div>
        <div className="chart-labels"><span>Actual performance →</span><span>Predicted success →</span></div>
      </section>
      <aside className="calibration-insights">
        <h3>Calibration signals</h3>
        {under && <div><span className="insight-icon insight-icon--down"><ArrowDown size={16} /></span><p><strong>{under.topic} may be stronger than it feels.</strong>Prediction {under.predicted}%; outcome {under.actual}%.</p></div>}
        {over && <div><span className="insight-icon insight-icon--up"><ArrowUp size={16} /></span><p><strong>{over.topic} needs a confidence reset.</strong>Prediction {over.predicted}%; outcome {over.actual}%.</p></div>}
        {closest && <div><span className="insight-icon"><Target size={16} /></span><p><strong>{closest.topic} is closest to calibrated.</strong>The gap is {Math.abs(closest.predicted - closest.actual)} points.</p></div>}
        {!points.length && <p>Commit a prediction before each timed attempt to unlock this view.</p>}
      </aside>
    </div>
  );
}
