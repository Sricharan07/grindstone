"use client";

import { useEffect, useState } from "react";
import { Check, Clock3, Code2, Settings, ShieldCheck } from "@/components/icons";
import type { Language } from "@/lib/judge/types";
import { useLearnerState } from "./state/learner-state-provider";

export function SettingsWorkspace() {
  const { state, dispatch, persistence } = useLearnerState();
  const [name, setName] = useState(state.profile.name);
  const [target, setTarget] = useState(state.profile.target);
  const [language, setLanguage] = useState<Language>(state.profile.preferredLanguage);
  const [dailyMinutes, setDailyMinutes] = useState(state.profile.dailyMinutes);
  const [daysPerWeek, setDaysPerWeek] = useState(state.profile.daysPerWeek);
  const [saved, setSaved] = useState(false);
  const [ai, setAi] = useState<{ ok: boolean; detail: string; model: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/coach", { signal: controller.signal }).then(async (response) => response.json()).then((value) => setAi(value)).catch(() => setAi({ ok: false, detail: "AI tutor status unavailable", model: "gpt-5.6-luna" }));
    return () => controller.abort();
  }, []);

  function save() {
    dispatch({ type: "profile.update", payload: { name, target, language, dailyMinutes, daysPerWeek } });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div className="settings-workspace">
      <header className="workspace-heading">
        <div><p className="context-line">Your training setup</p><h1>Settings</h1><p>Change the language and schedule used in every lesson and daily plan.</p></div>
      </header>
      <section className="settings-section" aria-labelledby="profile-settings">
        <div><span><Settings size={18} /> Profile and target</span><h2 id="profile-settings">What you are preparing for</h2></div>
        <div className="settings-fields">
          <label>Name<input value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label>Interview target<input value={target} onChange={(event) => setTarget(event.target.value)} /></label>
        </div>
      </section>
      <section className="settings-section" aria-labelledby="training-settings">
        <div><span><Code2 size={18} /> Training defaults</span><h2 id="training-settings">Language and weekly rhythm</h2></div>
        <div className="settings-fields settings-fields--three">
          <label>Practice language<select value={language} onChange={(event) => setLanguage(event.target.value as Language)}><option value="python">Python</option><option value="java">Java</option><option value="cpp">C++</option></select></label>
          <label>Minutes per day<input type="number" min={20} max={180} step={5} value={dailyMinutes} onChange={(event) => setDailyMinutes(Number(event.target.value))} /></label>
          <label>Days per week<input type="number" min={3} max={7} value={daysPerWeek} onChange={(event) => setDaysPerWeek(Number(event.target.value))} /></label>
        </div>
        <button type="button" className="button button--primary" onClick={save}><Check size={17} /> {saved ? "Saved" : "Save settings"}</button>
      </section>
      <section className="settings-section system-status" aria-labelledby="system-status">
        <div><span><ShieldCheck size={18} /> System status</span><h2 id="system-status">Storage and AI tutor</h2></div>
        <dl>
          <div><dt>Learning data</dt><dd><i className="status-dot status-dot--ok" /> {persistence === "postgres" ? "Saved to the self-hosted database" : persistence === "memory" ? "Saved on this server" : "Saved in this browser"}</dd></div>
          <div><dt>AI tutor</dt><dd><i className={`status-dot ${ai?.ok ? "status-dot--ok" : "status-dot--warn"}`} /> {ai?.detail ?? "Checking ChatGPT connection..."}</dd></div>
          <div><dt>Model</dt><dd><Clock3 size={14} /> {ai?.model ?? "gpt-5.6-luna"} · extra-high reasoning · no fallback</dd></div>
        </dl>
      </section>
    </div>
  );
}
