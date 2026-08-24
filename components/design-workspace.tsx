"use client";

import { useEffect, useMemo, useState } from "react";
import { BrainCircuit, Check, Clock3, Database, Send, ShieldCheck, Target } from "@/components/icons";
import { cn } from "@/lib/utils";
import { ProgressBar } from "./ui/progress-bar";
import { useLearnerState } from "./state/learner-state-provider";

const designStages = ["Requirements", "Estimates", "API", "Data model", "Scale-out", "Tradeoffs"] as const;
const cases = ["URL shortener", "News feed", "Chat", "Autocomplete", "Ride hailing", "File sync", "Ticketing"];
const lldCases = ["Parking lot", "Elevator", "Splitwise", "Rate limiter", "Min stack", "Iterator"];

type Grade = { score: number; dimensions: Array<{ label: string; met: boolean }>; feedback: string[] };

export function DesignWorkspace() {
  const { dispatch } = useLearnerState();
  const [mode, setMode] = useState<"system" | "lld">("system");
  const [caseName, setCaseName] = useState(cases[0]);
  const [stage, setStage] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [probe, setProbe] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(45 * 60);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const completion = useMemo(() => Math.round((designStages.filter((item) => (answers[item]?.trim().length ?? 0) >= 35).length / designStages.length) * 100), [answers]);

  useEffect(() => {
    if (mode !== "system" || remaining === 0) return;
    const timer = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [mode, remaining]);

  async function gradeDesign() {
    setGrading(true);
    setError(null);
    try {
      const responseText = designStages.map((item) => `${item}:\n${answers[item] ?? ""}`).join("\n\n");
      const response = await fetch("/api/responses/grade", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "system_design", response: responseText }) });
      const payload = await response.json() as Grade & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Design could not be graded");
      setGrade(payload);
      dispatch({ type: "attempt.record", payload: { id: crypto.randomUUID(), itemType: "system-design", itemId: caseName.toLowerCase().replaceAll(" ", "-"), topic: "System design", correct: payload.score >= 75, difficulty: 0.75, durationMs: (45 * 60 - remaining) * 1000, targetDurationMs: 45 * 60_000, scaffoldLevel: probe ? 1 : 0, timed: true, communicationScore: payload.score, createdAt: new Date().toISOString() } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Design could not be graded");
    } finally {
      setGrading(false);
    }
  }

  function chooseCase(item: string) {
    setCaseName(item);
    setStage(0);
    setAnswers({});
    setProbe(null);
    setGrade(null);
    setError(null);
    setRemaining(45 * 60);
  }

  const clock = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;

  return <div className="design-workspace">
    <header className="workspace-heading"><div><p className="context-line">Architecture under interview pressure</p><h2>Make every tradeoff inspectable.</h2><p>The canvas preserves the sequence: clarify, quantify, shape interfaces, model data, scale, then defend choices.</p></div><div className="segmented"><button type="button" className={cn(mode === "system" && "segmented__active")} onClick={() => setMode("system")}>System design</button><button type="button" className={cn(mode === "lld" && "segmented__active")} onClick={() => setMode("lld")}>LLD</button></div></header>
    {mode === "system" ? <div className="design-layout">
      <aside className="design-cases"><h3>Cases</h3>{cases.map((item) => <button type="button" key={item} className={cn(caseName === item && "design-case--active")} onClick={() => chooseCase(item)}>{item}</button>)}</aside>
      <main className="design-canvas">
        <div className="design-canvas__top"><span><Target size={17} /> {caseName}</span><strong><Clock3 size={17} /> {clock}</strong></div>
        <div className="design-stage-line">{designStages.map((item, index) => <button type="button" key={item} className={cn(index === stage && "design-stage--active", (answers[item]?.length ?? 0) >= 35 && "design-stage--done")} onClick={() => setStage(index)}><span>{(answers[item]?.length ?? 0) >= 35 ? <Check size={14} /> : index + 1}</span>{item}</button>)}</div>
        <section className="design-stage"><span className="context-line">{designStages[stage]}</span><h3>{stagePrompt(caseName, designStages[stage])}</h3><textarea rows={12} value={answers[designStages[stage]] ?? ""} onChange={(event) => { setAnswers({ ...answers, [designStages[stage]]: event.target.value }); setProbe(null); setGrade(null); }} placeholder={stagePlaceholder(designStages[stage])} /><div className="design-actions"><button type="button" className="button button--secondary" disabled={(answers[designStages[stage]]?.length ?? 0) < 25} onClick={() => setProbe(probeFor(designStages[stage]))}><BrainCircuit size={17} /> Pressure-test</button>{stage < designStages.length - 1 ? <button type="button" className="button button--primary" disabled={(answers[designStages[stage]]?.length ?? 0) < 35} onClick={() => setStage((value) => value + 1)}>Commit stage <Send size={17} /></button> : <button type="button" className="button button--primary" disabled={completion < 100 || grading} onClick={() => void gradeDesign()}><Send size={17} /> {grading ? "Grading…" : "Grade design"}</button>}</div>{probe && <div className="design-probe"><BrainCircuit size={18} /><p><strong>Interviewer follow-up</strong>{probe}</p></div>}{error && <p className="warning-text">{error}</p>}</section>
      </main>
      <aside className="design-evidence"><strong>{grade?.score ?? completion}%</strong><span>{grade ? "Rubric score" : "Canvas complete"}</span><ProgressBar value={grade?.score ?? completion} label={grade ? "System design rubric score" : "Design canvas completion"} /><p>{grade ? (grade.feedback.length ? `Missing evidence: ${grade.feedback.join(", ")}.` : "Every scored dimension has explicit evidence.") : "Coverage unlocks grading; it is not itself a score."}</p><div><Database size={17} /><span><small>Data model</small><strong>{grade?.dimensions.find((item) => item.label === "interface and data")?.met ? "Evidenced" : "Missing"}</strong></span></div><div><ShieldCheck size={17} /><span><small>Failure modes</small><strong>{grade?.dimensions.find((item) => item.label === "failure handling")?.met ? "Evidenced" : "Missing"}</strong></span></div></aside>
    </div> : <LldWorkspace />}
  </div>;
}

function LldWorkspace() {
  const { dispatch } = useLearnerState();
  const [selected, setSelected] = useState(lldCases[0]);
  const [contracts, setContracts] = useState("");
  const [model, setModel] = useState("");
  const [tests, setTests] = useState("");
  const [grade, setGrade] = useState<Grade | null>(null);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const complete = [contracts, model, tests].every((value) => value.trim().length >= 40);

  async function submit() {
    setGrading(true);
    setError(null);
    try {
      const response = await fetch("/api/responses/grade", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "lld", response: `CONTRACTS:\n${contracts}\nMODEL:\n${model}\nTESTS:\n${tests}` }) });
      const payload = await response.json() as Grade & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "LLD response could not be graded");
      setGrade(payload);
      dispatch({ type: "attempt.record", payload: { id: crypto.randomUUID(), itemType: "lld", itemId: selected.toLowerCase().replaceAll(" ", "-"), topic: "Low-level design", correct: payload.score >= 75, difficulty: 0.7, durationMs: 0, targetDurationMs: 45 * 60_000, scaffoldLevel: 0, timed: false, communicationScore: payload.score, createdAt: new Date().toISOString() } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "LLD response could not be graded");
    } finally {
      setGrading(false);
    }
  }

  function choose(item: string) {
    setSelected(item);
    setContracts("");
    setModel("");
    setTests("");
    setGrade(null);
    setError(null);
  }

  return <div className="lld-layout"><aside>{lldCases.map((item) => <button type="button" key={item} className={cn(selected === item && "design-case--active")} onClick={() => choose(item)}>{item}</button>)}</aside><main><p className="context-line">Machine coding · {selected}</p><h3>Define behavior before classes.</h3><label>Public contracts<textarea rows={6} value={contracts} onChange={(event) => { setContracts(event.target.value); setGrade(null); }} placeholder="Commands, queries, invariants, and errors..." /></label><label>Object model and responsibilities<textarea rows={7} value={model} onChange={(event) => { setModel(event.target.value); setGrade(null); }} placeholder="Entities and why each owns its behavior..." /></label><label>Tests and change pressure<textarea rows={6} value={tests} onChange={(event) => { setTests(event.target.value); setGrade(null); }} placeholder="Happy path, race, invalid transition, new requirement..." /></label><button type="button" className="button button--primary" disabled={!complete || grading} onClick={() => void submit()}><Send size={17} /> {grading ? "Grading…" : "Grade design"}</button>{error && <p className="warning-text">{error}</p>}</main><aside className="lld-score"><strong>{grade?.score ?? 0}</strong><span>{grade ? "Rubric score" : "Not graded"}</span><ProgressBar value={grade?.score ?? 0} label="LLD rubric score" /><p>{grade?.feedback.length ? `Missing evidence: ${grade.feedback.join(", ")}.` : grade ? "Every scored dimension has explicit evidence." : "Complete all three artifacts, then grade the evidence."}</p></aside></div>;
}

function stagePrompt(caseName: string, stage: typeof designStages[number]) {
  const prompts = { Requirements: `What must ${caseName.toLowerCase()} do, and what is out of scope?`, Estimates: "Put numbers on traffic, storage, bandwidth, and latency.", API: "Define the smallest stable interface clients need.", "Data model": "Choose keys, relationships, indexes, and consistency boundaries.", "Scale-out": "Where does the single-node design fail first?", Tradeoffs: "Defend the hardest choice and name when you would reverse it." };
  return prompts[stage];
}

function stagePlaceholder(stage: typeof designStages[number]) {
  return stage === "Estimates" ? "DAU, peak QPS, object size, retention, read/write ratio..." : stage === "API" ? "POST /..., GET /..., idempotency key, pagination..." : "State assumptions and connect every choice to a requirement...";
}

function probeFor(stage: typeof designStages[number]) {
  const probes = { Requirements: "Which requirement changes your storage choice most?", Estimates: "Show how the peak QPS follows from DAU rather than intuition.", API: "What happens when the client retries after a timeout?", "Data model": "Which access pattern becomes expensive with this primary key?", "Scale-out": "How does the system behave when the queue is full?", Tradeoffs: "What evidence would make you choose the opposite design?" };
  return probes[stage];
}
