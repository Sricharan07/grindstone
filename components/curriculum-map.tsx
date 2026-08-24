"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Lock, Target } from "@/components/icons";
import { companyPolicies, curriculumGroups, recognitionPatterns } from "@/lib/content/catalog";
import { cn } from "@/lib/utils";
import { useLearnerState } from "./state/learner-state-provider";
import { ProgressBar } from "./ui/progress-bar";
import { masteryPercent } from "@/lib/engine";

export function CurriculumMap() {
  const { state } = useLearnerState(); const [selected, setSelected] = useState(curriculumGroups[0].id); const group = curriculumGroups.find((item) => item.id === selected) ?? curriculumGroups[0];
  return <div className="curriculum-map"><header className="workspace-heading"><div><p className="context-line">Route-aware curriculum</p><h2>Know what is gated, and why.</h2><p>Tier C stays locked until Tier B evidence is stable. Placement and interview tracks share the same mastery machinery.</p></div><span className="status-pill"><Target size={16} /> {curriculumGroups.reduce((sum, item) => sum + item.topics.length, 0)} named skills</span></header><div className="curriculum-layout"><aside>{curriculumGroups.map((item) => <button type="button" key={item.id} className={cn(selected === item.id && "curriculum-group--active")} onClick={() => setSelected(item.id)}><span>{item.tier}</span><strong>{item.title}</strong><small>{item.topics.length} topics</small></button>)}</aside><main><div className="section-heading-row"><div><span className="context-line">Tier {group.tier}</span><h3>{group.title}</h3></div><Link href="/learn">Open mutability lesson <ArrowRight size={16} /></Link></div><div className="curriculum-topics">{group.topics.map((topic, index) => { const evidence = state.mastery[topic]; const locked = group.tier === "C" && masteryPercent(state.mastery["DP state design"] ?? { rating: 0, confidence: 0, attempts: 0, calibrationError: 0 }) < 68; const value = evidence ? masteryPercent(evidence) : 0; return <div key={topic}><span>{locked ? <Lock size={15} /> : value >= 70 ? <Check size={15} /> : index + 1}</span><p><strong>{topic}</strong><small>{locked ? "Clear Tier B first" : evidence ? `${evidence.attempts} evidence points` : "Not started"}</small></p><ProgressBar value={value} label={`${topic} mastery`} /><em>{value}%</em></div>; })}</div></main><aside className="pattern-index"><h3>20 recognition patterns</h3><p>Name the tool before you write code.</p>{recognitionPatterns.map((pattern, index) => <span key={pattern}><i>{index + 1}</i>{pattern}</span>)}</aside></div><section className="policy-band"><div><p className="context-line">Per-round AI policy</p><h3>The company name is not the policy.</h3></div>{companyPolicies.map((item) => <div key={item.company}><strong>{item.company}</strong><span>{item.round}</span><p>{item.policy}</p><small>{item.verified}</small></div>)}</section></div>;
}
