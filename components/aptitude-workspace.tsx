"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Clock3, RotateCcw, Target, X } from "@/components/icons";
import { sprintDay } from "@/lib/curriculum/catalog";
import { cn } from "@/lib/utils";
import { useLearnerState } from "./state/learner-state-provider";

interface AptitudeQuestion {
  id: string;
  topic: string;
  prompt: string;
  options: string[];
  difficulty: number;
  targetSeconds: number;
}

interface AnswerResult {
  selectedIndex: number;
  answerIndex: number;
  correct: boolean;
  explanation: string;
}

export function AptitudeWorkspace({ dayNumber, count = 8 }: { dayNumber: number; count?: number }) {
  const { state, dispatch } = useLearnerState();
  const day = sprintDay(dayNumber);
  const saved = state.aptitude[String(dayNumber)];
  const [questions, setQuestions] = useState<AptitudeQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, AnswerResult>>(saved?.answers ?? {});
  const [index, setIndex] = useState(saved?.currentIndex ?? 0);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const questionStartedAt = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/aptitude?day=${dayNumber}&count=${count}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json() as { questions?: AptitudeQuestion[]; error?: string };
        if (!response.ok || !payload.questions?.length) throw new Error(payload.error ?? "No questions are available.");
        setQuestions(payload.questions);
        setIndex((current) => Math.min(payload.questions!.length - 1, current));
      })
      .catch((caught) => {
        if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "The aptitude round could not load.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [count, dayNumber]);

  useEffect(() => {
    questionStartedAt.current = Date.now();
    const timer = window.setInterval(() => setElapsedSeconds(Math.floor((Date.now() - questionStartedAt.current) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [index]);

  const question = questions[index];
  const result = question ? answers[question.id] : undefined;
  const complete = questions.length > 0 && Object.keys(answers).length === questions.length;
  const correctCount = Object.values(answers).filter((answer) => answer.correct).length;
  const score = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;

  function markPlanComplete() {
    const itemId = `d${dayNumber}-aptitude`;
    if (!state.sprint.completedItems.includes(itemId)) {
      dispatch({ type: "plan.toggle", payload: { itemId, completedAt: new Date().toISOString() } });
    }
  }

  async function checkAnswer() {
    if (!question || selected === null || result) return;
    setGrading(true);
    setError(null);
    try {
      const response = await fetch("/api/aptitude", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ questionId: question.id, selectedIndex: selected }),
      });
      const payload = await response.json() as Omit<AnswerResult, "selectedIndex"> & { error?: string };
      if (!response.ok || payload.answerIndex === undefined) throw new Error(payload.error ?? "This answer could not be graded.");
      const answer = { selectedIndex: selected, answerIndex: payload.answerIndex, correct: payload.correct, explanation: payload.explanation };
      const nextAnswers = { ...answers, [question.id]: answer };
      setAnswers(nextAnswers);
      dispatch({ type: "aptitude.save", payload: { day: dayNumber, progress: { answers: nextAnswers, currentIndex: index, completed: Object.keys(nextAnswers).length === questions.length } } });
      dispatch({
        type: "attempt.record",
        payload: {
          id: crypto.randomUUID(),
          itemType: "aptitude",
          itemId: `day${dayNumber}:${question.id}`,
          topic: `Aptitude: ${question.topic}`,
          correct: answer.correct,
          difficulty: question.difficulty,
          durationMs: Math.max(1, Date.now() - questionStartedAt.current),
          targetDurationMs: question.targetSeconds * 1000,
          scaffoldLevel: 0,
          assistance: "none",
          transfer: true,
          timed: true,
          answer: { selectedIndex: selected },
          createdAt: new Date().toISOString(),
        },
      });
      if (Object.keys(nextAnswers).length === questions.length) markPlanComplete();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "This answer could not be graded.");
    } finally {
      setGrading(false);
    }
  }

  function nextQuestion() {
    if (index >= questions.length - 1) return;
    const nextIndex = index + 1;
    setIndex(nextIndex);
    dispatch({ type: "aptitude.save", payload: { day: dayNumber, progress: { currentIndex: nextIndex } } });
    setSelected(null);
    setElapsedSeconds(0);
    questionStartedAt.current = Date.now();
  }

  if (loading) return <section className="session-loading" role="status"><span className="brand-mark">G</span><p>Preparing today&apos;s aptitude set...</p></section>;
  if (error && !question) return <section className="session-error"><Target size={24} /><h1>The aptitude set did not load.</h1><p>{error}</p><button type="button" className="button button--primary" onClick={() => window.location.reload()}><RotateCcw size={16} /> Retry</button></section>;

  if (complete && index === questions.length - 1 && result) {
    return <div className="session-workspace"><header className="session-heading"><Link href="/" className="button button--quiet"><ArrowLeft size={16} /> Today</Link><div><p className="section-label">Day {dayNumber} · Aptitude complete</p><h1>{day.aptitude}</h1><p>The score records timed accuracy. The explanation review records what to repair.</p></div></header><section className="round-complete"><span className={cn("round-score", score >= 70 && "is-pass")}>{score}%</span><div><p className="section-label">{correctCount} of {questions.length} correct</p><h2>{score >= 70 ? "The timed set is complete." : "Review the misses before the next timed set."}</h2><p>{score >= 70 ? "Keep the pace, but do not skip the explanations you guessed correctly." : "The errors are now in your evidence log and can guide the next recovery session."}</p><div><Link href="/" className="button button--primary">Continue today <ArrowRight size={16} /></Link><Link href="/progress" className="button button--secondary">Review evidence</Link></div></div></section></div>;
  }

  return (
    <div className="session-workspace">
      <header className="session-heading">
        <Link href="/" className="button button--quiet"><ArrowLeft size={16} /> Today</Link>
        <div><p className="section-label">Day {dayNumber} · General aptitude</p><h1>{day.aptitude}</h1><p>Answer under time, then read the reasoning. One question appears at a time so the work stays focused.</p></div>
      </header>
      <section className="aptitude-round">
        <header><span>Question {index + 1} of {questions.length}</span><span><Clock3 size={15} /> {elapsedSeconds}s · target {question?.targetSeconds}s</span></header>
        <div className="round-track" aria-hidden="true"><span style={{ transform: `scaleX(${(index + (result ? 1 : 0)) / questions.length})` }} /></div>
        {question && <article className="aptitude-question">
          <p className="section-label">{question.topic}</p>
          <h2>{question.prompt}</h2>
          <div className="answer-options" role="radiogroup" aria-label="Answer choices">
            {question.options.map((option, optionIndex) => {
              const chosen = (result?.selectedIndex ?? selected) === optionIndex;
              const correct = result?.answerIndex === optionIndex;
              const wrong = Boolean(result && chosen && !correct);
              return <button type="button" role="radio" aria-checked={chosen} disabled={Boolean(result)} className={cn(chosen && "is-selected", correct && "is-correct", wrong && "is-wrong")} onClick={() => setSelected(optionIndex)} key={`${option}-${optionIndex}`}><span>{String.fromCharCode(65 + optionIndex)}</span><strong>{option}</strong>{correct ? <Check size={17} /> : wrong ? <X size={17} /> : null}</button>;
            })}
          </div>
          {result && <div className={cn("answer-explanation", result.correct ? "is-correct" : "is-wrong")} role="status"><strong>{result.correct ? "Correct" : `Correct answer: ${String.fromCharCode(65 + result.answerIndex)}`}</strong><p>{result.explanation}</p></div>}
          {error && <p className="inline-error" role="alert">{error}</p>}
          <footer>{result ? <button type="button" className="button button--primary" onClick={nextQuestion}>{index === questions.length - 1 ? "Finish round" : "Next question"} <ArrowRight size={16} /></button> : <button type="button" className="button button--primary" disabled={selected === null || grading} onClick={() => void checkAnswer()}>{grading ? "Checking..." : "Check answer"}</button>}</footer>
        </article>}
      </section>
    </div>
  );
}
