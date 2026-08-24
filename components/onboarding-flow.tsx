"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  Code2,
  Goal,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Target,
} from "@/components/icons";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ProgressBar } from "./ui/progress-bar";
import { useLearnerState } from "./state/learner-state-provider";
import type { InterviewRoute } from "@/lib/product/types";

const levels = [
  { id: "never", title: "I have never coded", detail: "Start with how code runs, language basics, and short reasoning exercises.", goal: "Write working code unaided and explain the decisions clearly." },
  { id: "codes", title: "I can code, but algorithms are new", detail: "Build pattern recognition and screening-round fluency.", goal: "Pass a startup or product-company coding screen." },
  { id: "dsa", title: "I know algorithm basics", detail: "Train mixed patterns, speed, and communication under a clock.", goal: "Clear a product-company interview loop with consistent evidence." },
  { id: "strong", title: "I am already strong", detail: "Focus on harder problems, system design, codebase work, and behavioral depth.", goal: "Prove readiness across a big-tech interview loop." },
] as const;

export function OnboardingFlow() {
  const { state, dispatch } = useLearnerState();
  const draft = state.onboarding;
  const [step, setStep] = useState(draft.step);
  const [level, setLevel] = useState(draft.experience);
  const [target, setTarget] = useState(draft.target || "Product company");
  const [language, setLanguage] = useState(draft.language);
  const [dailyMinutes, setDailyMinutes] = useState(draft.dailyMinutes);
  const [days, setDays] = useState(draft.daysPerWeek);
  const [trigger, setTrigger] = useState(draft.trigger);
  const [action, setAction] = useState(draft.action);
  const [stakeEnabled, setStakeEnabled] = useState(draft.stakeCents !== null);
  const [stakeAmount, setStakeAmount] = useState((draft.stakeCents ?? 500) / 100);
  const selectedLevel = levels.find((item) => item.id === level) ?? levels[1];
  const route: InterviewRoute = level === "never" ? "foundations" : target === "Service IT" ? "service-it" : target === "Big tech" ? "big-tech" : target === "Non-technical corporate" ? "non-tech" : "product";

  useEffect(() => {
    const timer = window.setTimeout(() => dispatch({ type: "onboarding.save", payload: {
      step,
      experience: level,
      route,
      target,
      language,
      dailyMinutes,
      daysPerWeek: days,
      trigger,
      action,
      implementationIntention: `If ${trigger}, then ${action}.`,
      goal: selectedLevel.goal,
      stakeCents: stakeEnabled ? Math.round(stakeAmount * 100) : null,
    } }), 350);
    return () => window.clearTimeout(timer);
  }, [action, dailyMinutes, days, dispatch, language, level, route, selectedLevel.goal, stakeAmount, stakeEnabled, step, target, trigger]);

  return (
    <div className="onboarding-page">
      <header className="onboarding-header">
        <Link href="/" className="brand"><span className="brand-mark">G</span><span className="brand-word">grindstone</span></Link>
        <span>Setup saves automatically <LockKeyhole size={15} /></span>
      </header>

      <main className="onboarding-main">
        <aside className="onboarding-steps">
          <div><span>Four weeks</span><h1>Set a goal the sprint can prove.</h1><p>Your answers choose what to teach first. You can leave and resume from this step.</p></div>
          {["Route", "Commitment", "Diagnostic"].map((label, index) => (
            <button key={label} type="button" disabled={index > step} className={cn(index === step && "onboarding-step--active", index < step && "onboarding-step--done")} onClick={() => index < step && setStep(index)}>
              <span>{index < step ? <Check size={14} /> : index + 1}</span><strong>{label}</strong>
            </button>
          ))}
          <ProgressBar value={((step + 1) / 3) * 100} label="Onboarding progress" />
        </aside>

        <section className="onboarding-panel">
          {step === 0 && (
            <>
              <div className="onboarding-panel__heading"><span><Target size={20} /></span><div><h2>Choose the honest starting line</h2><p>Nothing here slows you down. It decides which finish line is real in four hard weeks.</p></div></div>
              <fieldset className="route-options"><legend>Where are you now?</legend>{levels.map((item) => <label key={item.id} className={cn("route-option", level === item.id && "route-option--active")}><input type="radio" name="level" checked={level === item.id} onChange={() => setLevel(item.id)} /><span><strong>{item.title}</strong><small>{item.detail}</small></span><ChevronRight size={17} /></label>)}</fieldset>
              <div className="onboarding-fields two-fields"><label>Interview target<select value={target} onChange={(event) => setTarget(event.target.value)}><option>Product company</option><option>Service IT</option><option>Big tech</option><option>Non-technical corporate</option></select></label><label>Practice language<select value={language} onChange={(event) => setLanguage(event.target.value as typeof language)}><option value="python">Python</option><option value="java">Java</option><option value="cpp">C++</option></select></label></div>
              <div className="sprint-goal-preview"><Goal size={20} /><div><span>Your Sprint 1 promise</span><strong>{selectedLevel.goal}</strong><p>Target: {target} · Language: {language === "cpp" ? "C++" : language[0].toUpperCase() + language.slice(1)}</p></div></div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="onboarding-panel__heading"><span><Clock3 size={20} /></span><div><h2>Make the daily decision once</h2><p>Your commitment is visible to the group. Missed days recalibrate; they never become debt.</p></div></div>
              <div className="commitment-grid">
                <label>Daily training minutes<div className="stepper"><button type="button" onClick={() => setDailyMinutes((value) => Math.max(20, value - 15))}>−</button><output>{dailyMinutes}</output><button type="button" onClick={() => setDailyMinutes((value) => Math.min(180, value + 15))}>+</button></div><small>The daily floor stays at 20 minutes.</small></label>
                <label>Days per week<div className="segmented commitment-days">{[5, 6, 7].map((value) => <button key={value} type="button" className={cn(days === value && "segmented__active")} onClick={() => setDays(value)}>{value}</button>)}</div><small>Six leaves one recovery day.</small></label>
              </div>
              <fieldset className="if-then-builder"><legend>Implementation intention</legend><label>If…<input value={trigger} onChange={(event) => setTrigger(event.target.value)} /></label><label>then…<input value={action} onChange={(event) => setAction(event.target.value)} /></label><blockquote>“If {trigger}, then {action}.”</blockquote></fieldset>
              <label className="stake-toggle"><span><strong>Money stake</strong><small>Optional. Off by default because the behavior rarely lasts after the stake ends.</small></span><input type="checkbox" checked={stakeEnabled} onChange={(event) => setStakeEnabled(event.target.checked)} /></label>
              {stakeEnabled && <label className="stake-amount">Stake amount (USD)<input type="number" min={1} max={1000} step={1} value={stakeAmount} onChange={(event) => setStakeAmount(Math.max(1, Number(event.target.value) || 1))} /></label>}
            </>
          )}

          {step === 2 && (
            <>
              <div className="onboarding-panel__heading"><span><Sparkles size={20} /></span><div><h2>Your starting check is ready</h2><p>Twelve short questions identify what you already know and what the first week should teach. Every answer is saved.</p></div></div>
              <div className="diagnostic-sections"><div><span><Target size={18} /></span><p><strong>Aptitude</strong><small>Quantitative and reasoning</small></p><em>4 items</em></div><div><span><Code2 size={18} /></span><p><strong>Coding foundations</strong><small>Reading, mutability, complexity, and patterns</small></p><em>5 items</em></div><div><span><ShieldCheck size={18} /></span><p><strong>Interview baseline</strong><small>SQL, operating systems, communication, and design</small></p><em>3 items</em></div></div>
              <div className="diagnostic-summary"><span>Your plan</span><h3>{selectedLevel.goal}</h3><dl><div><dt>Daily load</dt><dd>{dailyMinutes} min · {days} days/week</dd></div><div><dt>Minimum session</dt><dd>20 min</dd></div><div><dt>Language</dt><dd>{language === "cpp" ? "C++" : language[0].toUpperCase() + language.slice(1)}</dd></div><div><dt>Target</dt><dd>{target}</dd></div><div><dt>Stake</dt><dd>{stakeEnabled ? `$${stakeAmount}` : "Off"}</dd></div></dl></div>
            </>
          )}

          <footer className="onboarding-actions">
            <button type="button" className="button button--quiet" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}><ArrowLeft size={17} /> Back</button>
            {step < 2 ? <button type="button" className="button button--primary" onClick={() => setStep((value) => value + 1)}>Continue <ArrowRight size={17} /></button> : <Link href="/diagnostic" className="button button--primary" onClick={() => dispatch({ type: "onboarding.complete", payload: { route, target, language, dailyMinutes, daysPerWeek: days, implementationIntention: `If ${trigger}, then ${action}.`, goal: selectedLevel.goal, stakeCents: stakeEnabled ? Math.round(stakeAmount * 100) : null } })}>Start 10-minute check <ArrowRight size={17} /></Link>}
          </footer>
        </section>
      </main>
    </div>
  );
}
