"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Clock3, Target } from "@/components/icons";
import { diagnosticQuestions, scoreDiagnostic } from "@/lib/content/diagnostic";
import type { InterviewRoute } from "@/lib/product/types";
import { cn } from "@/lib/utils";
import { useLearnerState } from "./state/learner-state-provider";
import { ProgressBar } from "./ui/progress-bar";

export function DiagnosticRunner() {
  const { state, dispatch } = useLearnerState();
  const [index, setIndex] = useState(() => Math.min(Object.keys(state.diagnostic.answers).length, diagnosticQuestions.length - 1));
  const [finished, setFinished] = useState(state.diagnostic.status === "complete");
  const question = diagnosticQuestions[index];
  const answer = state.diagnostic.answers[question.id];
  const result = useMemo(() => scoreDiagnostic(state.diagnostic.answers), [state.diagnostic.answers]);

  function finish() {
    dispatch({ type: "diagnostic.complete", payload: { route: result.route as InterviewRoute, goal: result.goal, topicPriors: result.topicPriors, completedAt: new Date().toISOString() } });
    setFinished(true);
  }

  if (finished) {
    return <div className="diagnostic-runner diagnostic-result">
      <span className="result-mark"><Check size={24} /></span>
      <p className="context-line">Diagnostic complete</p>
      <h1>Your honest starting line is set.</h1>
      <p>{result.totalCorrect} of {result.total} evidence points cleared. This is a routing decision, not a verdict.</p>
      <div className="diagnostic-result__goal"><span>Sprint 1 goal</span><strong>{result.goal}</strong><small>Route: {result.route}</small></div>
      <div className="diagnostic-priors">{Object.entries(result.topicPriors).map(([topic, prior]) => <div key={topic}><span>{topic}</span><strong>{Math.round(prior * 100)}%</strong><ProgressBar value={prior * 100} label={`${topic} prior`} /></div>)}</div>
      <Link href="/" className="button button--primary">Build today&apos;s plan <ArrowRight size={17} /></Link>
    </div>;
  }

  return <div className="diagnostic-runner">
    <header className="diagnostic-header"><div><p className="context-line">Day-one diagnostic</p><h1>Find the edge, then train it.</h1><p>Twelve route-spanning questions. Progress is saved after every response.</p></div><span><Clock3 size={17} /> Splittable</span></header>
    <div className="diagnostic-progress"><span>Question {index + 1} of {diagnosticQuestions.length}</span><ProgressBar value={((index + 1) / diagnosticQuestions.length) * 100} label="Diagnostic progress" /></div>
    <section className="diagnostic-question">
      <span><Target size={17} /> {question.topic}</span>
      <h2>{question.prompt}</h2>
      <div className="diagnostic-options">{question.options.map((option, optionIndex) => <button type="button" key={option} className={cn(Number(answer) === optionIndex && "diagnostic-option--active")} onClick={() => dispatch({ type: "diagnostic.answer", payload: { questionId: question.id, answer: String(optionIndex) } })}><span>{String.fromCharCode(65 + optionIndex)}</span>{option}</button>)}</div>
    </section>
    <footer className="diagnostic-actions"><button type="button" className="button button--quiet" disabled={index === 0} onClick={() => setIndex((value) => value - 1)}><ArrowLeft size={17} /> Back</button>{index < diagnosticQuestions.length - 1 ? <button type="button" className="button button--primary" disabled={answer === undefined} onClick={() => setIndex((value) => value + 1)}>Next <ArrowRight size={17} /></button> : <button type="button" className="button button--primary" disabled={answer === undefined} onClick={finish}>Set my route <Check size={17} /></button>}</footer>
  </div>;
}
