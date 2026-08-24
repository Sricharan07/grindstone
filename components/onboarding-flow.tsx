"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Clock3, Code2, Target } from "@/components/icons";
import type { LearningLanguage } from "@/lib/learning/catalog";
import { cn } from "@/lib/utils";
import { useLearnerState } from "./state/learner-state-provider";

const stepCopy = [
  { title: "What should we call you?", body: "This is the only profile information Grindstone needs for your private cohort." },
  { title: "Choose your interview language.", body: "The curriculum stays the same. Examples, starter code, tests, and interview answers use this language." },
  { title: "Set your daily start time.", body: "The sprint runs for 28 consecutive days. Every day is 150 minutes; Days 7, 14, 21, and 28 are lower-intensity consolidation days." },
];

export function OnboardingFlow() {
  const router = useRouter();
  const { state, dispatch } = useLearnerState();
  const draft = state.onboarding;
  const step = Math.min(2, draft.step);
  const current = stepCopy[step];
  const canContinue = step === 0 ? draft.name.trim().length >= 2 : step === 1 ? Boolean(draft.language) : Boolean(draft.timezone && draft.sessionTime);

  function update(payload: Partial<typeof draft>) {
    dispatch({ type: "onboarding.save", payload });
  }

  function next() {
    if (!canContinue) return;
    if (step < 2) {
      update({ step: step + 1 });
      return;
    }
    dispatch({
      type: "onboarding.complete",
      payload: {
        name: draft.name,
        language: draft.language,
        timezone: draft.timezone,
        sessionTime: draft.sessionTime,
        startedAt: new Date().toISOString(),
      },
    });
    router.push("/");
  }

  return (
    <main className="onboarding-page">
      <header className="onboarding-topbar">
        <span className="brand"><span className="brand-mark" aria-hidden="true">G</span><span className="brand-copy"><strong>Grindstone</strong><small>28-day interview sprint</small></span></span>
        <span>Step {step + 1} of 3</span>
      </header>

      <div className="onboarding-progress" aria-label={`Setup step ${step + 1} of 3`}>
        {[0, 1, 2].map((value) => <span key={value} className={cn(value <= step && "is-active")} />)}
      </div>

      <section className="onboarding-stage">
        <div className="onboarding-promise">
          <p className="section-label">One curriculum, one next step</p>
          <h1>Prepare for coding, full-stack, AI, aptitude, and interview rounds together.</h1>
          <ul>
            <li><Target size={18} /><span><strong>28 focused days</strong><small>Five learning days, one gate, and one consolidation day each week.</small></span></li>
            <li><Clock3 size={18} /><span><strong>150 minutes a day</strong><small>Recall, aptitude, concept, problems, project work, and explanation.</small></span></li>
            <li><Code2 size={18} /><span><strong>Python or Java</strong><small>The same interview outcomes with language-specific examples and tests.</small></span></li>
          </ul>
        </div>

        <form className="onboarding-form" onSubmit={(event) => { event.preventDefault(); next(); }}>
          <div className="onboarding-form__heading">
            <p className="section-label">Your setup</p>
            <h2>{current.title}</h2>
            <p>{current.body}</p>
          </div>

          {step === 0 && (
            <label className="field">
              <span>Display name</span>
              <input autoFocus value={draft.name} onChange={(event) => update({ name: event.target.value })} placeholder="Your name" autoComplete="name" />
              <small>Visible as your chosen name in the optional friend scoreboard.</small>
            </label>
          )}

          {step === 1 && (
            <fieldset className="language-choice">
              <legend>Interview language</legend>
              {(["python", "java"] as LearningLanguage[]).map((language) => (
                <button key={language} type="button" className={cn(draft.language === language && "is-selected")} onClick={() => update({ language })}>
                  <span className="language-choice__icon">{language === "python" ? "PY" : "JV"}</span>
                  <span><strong>{language === "python" ? "Python" : "Java"}</strong><small>{language === "python" ? "Fast interview iteration and the primary AI ecosystem." : "Strong typing with Spring Boot for the main backend."}</small></span>
                  <i>{draft.language === language && <Check size={16} />}</i>
                </button>
              ))}
            </fieldset>
          )}

          {step === 2 && (
            <div className="schedule-fields">
              <label className="field">
                <span>Timezone</span>
                <input value={draft.timezone} onChange={(event) => update({ timezone: event.target.value })} list="timezones" />
                <datalist id="timezones"><option value="UTC" /><option value="America/Phoenix" /><option value="America/New_York" /><option value="Asia/Kolkata" /><option value="Europe/London" /></datalist>
              </label>
              <label className="field">
                <span>Daily start time</span>
                <input type="time" value={draft.sessionTime} onChange={(event) => update({ sessionTime: event.target.value })} />
              </label>
              <div className="schedule-summary">
                <span><Clock3 size={17} /> Starts every day at {draft.sessionTime || "20:00"}</span>
                <p>Your first normal session also establishes the baseline. There is no separate diagnostic wall.</p>
              </div>
            </div>
          )}

          <div className="onboarding-actions">
            <button type="button" className="button button--quiet" disabled={step === 0} onClick={() => update({ step: step - 1 })}><ArrowLeft size={17} /> Back</button>
            <button type="submit" className="button button--primary" disabled={!canContinue}>{step === 2 ? "Start Day 1" : "Continue"} <ArrowRight size={17} /></button>
          </div>
          <p className="autosave-note"><Check size={14} /> Every choice saves automatically.</p>
        </form>
      </section>
    </main>
  );
}
