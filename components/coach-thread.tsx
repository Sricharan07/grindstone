"use client";

import { useRef, useState } from "react";
import { BrainCircuit, RotateCcw, Send, X } from "@/components/icons";

export function CoachThread({ title, context, lessonId, onClose }: { title: string; context: string; lessonId?: string; onClose?: () => void }) {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "learner" | "coach"; text: string; failed?: boolean }>>([]);
  const [sending, setSending] = useState(false);
  const [lastPrompt, setLastPrompt] = useState("");
  const controllerRef = useRef<AbortController | null>(null);

  async function send(retryValue?: string) {
    const value = (retryValue ?? prompt).trim();
    if (!value) return;
    if (!retryValue) setMessages((current) => [...current, { role: "learner", text: value }]);
    setLastPrompt(value); setPrompt(""); setSending(true);
    try {
      const controller = new AbortController(); controllerRef.current = controller;
      const response = await fetch("/api/coach", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ purpose: "why", prompt: value, context, lessonId }), signal: controller.signal });
      const payload = await response.json() as { answer?: string; error?: string };
      if (!response.ok || !payload.answer) throw new Error(payload.error ?? "AI tutor unavailable");
      setMessages((current) => [...current.filter((message) => !message.failed), { role: "coach", text: payload.answer! }]);
    } catch (error) {
      const cancelled = error instanceof DOMException && error.name === "AbortError";
      setMessages((current) => [...current.filter((message) => !message.failed), { role: "coach", failed: !cancelled, text: cancelled ? "Request cancelled. Your lesson draft is still saved." : error instanceof Error ? error.message : "AI tutor unavailable. Your lesson draft is still saved." }]);
    } finally { controllerRef.current = null; setSending(false); }
  }

  return <aside className="coach-thread" aria-label="AI tutor thread"><header><span><BrainCircuit size={18} /> {title}</span>{onClose && <button type="button" className="icon-button" aria-label="Close tutor" onClick={onClose}><X size={17}/></button>}</header><div className="coach-messages" aria-live="polite">{messages.length === 0 && <p>Ask for a simpler explanation, a concrete example, or help diagnosing your current approach. Luna will not replace your code.</p>}{messages.map((message, index) => <div key={index} className={`coach-message coach-message--${message.role}`}><strong>{message.role === "coach" ? "Luna" : "You"}</strong><p>{message.text}</p>{message.failed && <button type="button" className="ask-coach-link" disabled={sending} onClick={() => void send(lastPrompt)}><RotateCcw size={15} /> Retry</button>}</div>)}</div><form onSubmit={(event) => { event.preventDefault(); void send(); }}><label className="sr-only" htmlFor={`coach-question-${lessonId ?? "general"}`}>Ask the AI tutor</label><input id={`coach-question-${lessonId ?? "general"}`} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Explain this more simply..." disabled={sending}/>{sending ? <button type="button" className="icon-button" aria-label="Cancel tutor request" onClick={() => controllerRef.current?.abort()}><X size={17}/></button> : <button type="submit" className="icon-button" aria-label="Send question" disabled={!prompt.trim()}><Send size={17}/></button>}</form></aside>;
}
