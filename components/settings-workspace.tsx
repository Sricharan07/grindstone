"use client";

import { useEffect, useState } from "react";
import { Check, Clock3, Code2, Settings, ShieldCheck } from "@/components/icons";
import type { LearningLanguage } from "@/lib/learning/catalog";
import { useLearnerState } from "./state/learner-state-provider";

export function SettingsWorkspace() {
  const { state, dispatch, persistence } = useLearnerState();
  const [name, setName] = useState(state.profile.name);
  const [language, setLanguage] = useState<LearningLanguage>(state.profile.language);
  const [timezone, setTimezone] = useState(state.profile.timezone);
  const [sessionTime, setSessionTime] = useState(state.profile.sessionTime);
  const [saved, setSaved] = useState(false);
  const [ai, setAi] = useState<{ ok?: boolean; detail?: string; model?: string; reasoning?: string }>();

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/coach", { signal: controller.signal }).then(async (response) => response.json()).then(setAi).catch(() => setAi({ ok: false, detail: "Luna status unavailable", model: "gpt-5.6-luna" }));
    return () => controller.abort();
  }, []);

  function save() {
    dispatch({ type: "profile.update", payload: { name, language, timezone, sessionTime } });
    setSaved(true); window.setTimeout(() => setSaved(false), 1600);
  }

  return <div className="settings-page"><header className="page-intro"><div><p className="section-label">Your training defaults</p><h1>Keep the plan predictable.</h1><p>Changing language updates future examples and starter code. Existing drafts stay in their original language so nothing is silently lost.</p></div></header>
    <section className="settings-band"><header><Settings size={18} /><div><h2>Profile</h2><p>The name shown inside this private product.</p></div></header><label className="field"><span>Display name</span><input value={name} onChange={(event) => setName(event.target.value)} /></label></section>
    <section className="settings-band"><header><Code2 size={18} /><div><h2>Language and schedule</h2><p>The curriculum is fixed at 150 minutes for 28 days.</p></div></header><div className="settings-grid"><label className="field"><span>Interview language</span><select value={language} onChange={(event) => setLanguage(event.target.value as LearningLanguage)}><option value="python">Python</option><option value="java">Java</option></select></label><label className="field"><span>Daily start time</span><input type="time" value={sessionTime} onChange={(event) => setSessionTime(event.target.value)} /></label><label className="field"><span>Timezone</span><input value={timezone} onChange={(event) => setTimezone(event.target.value)} /></label></div><button type="button" className="button button--primary" onClick={save}><Check size={16} /> {saved ? "Saved" : "Save changes"}</button></section>
    <section className="settings-band system-band"><header><ShieldCheck size={18} /><div><h2>System status</h2><p>These are real connections, not demo indicators.</p></div></header><dl><div><dt>Learning data</dt><dd><i className={persistence === "postgres" ? "is-ok" : "is-warn"} />{persistence === "postgres" ? "Saved to PostgreSQL" : persistence === "memory" ? "Saved for this server session" : "Saved in this browser"}</dd></div><div><dt>Luna tutor</dt><dd><i className={ai?.ok ? "is-ok" : "is-warn"} />{ai?.detail ?? "Checking connection..."}</dd></div><div><dt>Model</dt><dd><Clock3 size={14} />{ai?.model ?? "gpt-5.6-luna"} · {ai?.reasoning ?? "xhigh"}</dd></div></dl></section>
  </div>;
}
