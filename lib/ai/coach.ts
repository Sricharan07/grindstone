import "server-only";

import { getCodexAppServer } from "./codex-app-server";

export type CoachPurpose = "why" | "teach-back" | "mock-debrief" | "short-answer" | "socratic" | "concept" | "pseudocode" | "next-step" | "completion";

const quota = new Map<string, { day: string; count: number }>();
let activeTurns = 0;
const waiters: Array<() => void> = [];

function claimQuota(userId: string) {
  const day = new Date().toISOString().slice(0, 10);
  const current = quota.get(userId);
  const count = current?.day === day ? current.count : 0;
  const limit = Number(process.env.AI_USER_DAILY_TURNS ?? 80);
  if (count >= limit) throw new Error(`Daily AI tutor limit reached (${limit} turns). Core lessons and the code runner remain available.`);
  quota.set(userId, { day, count: count + 1 });
}

async function acquireSlot() {
  const limit = Math.max(1, Number(process.env.AI_MAX_CONCURRENT_TURNS ?? 2));
  if (activeTurns >= limit) await new Promise<void>((resolve) => waiters.push(resolve));
  activeTurns += 1;
  return () => {
    activeTurns -= 1;
    waiters.shift()?.();
  };
}

export function buildTutorPrompt({ purpose, prompt, context }: { purpose: CoachPurpose; prompt: string; context: string }) {
  const instruction = purpose === "completion"
    ? "Return exactly one syntactically valid line that could come next. No markdown, explanation, or surrounding code."
    : purpose === "socratic"
      ? "Ask exactly one guiding question. Do not answer it."
      : purpose === "concept"
        ? "Explain only the relevant concept and mental model. Do not provide code."
        : purpose === "pseudocode"
          ? "Give concise language-neutral pseudocode, not runnable code."
          : purpose === "next-step"
            ? "Give only the learner's next concrete step, not the remaining solution."
            : "Answer the learner's question without supplying a finished solution.";
  return `Help level: ${purpose}\nRequired response behavior: ${instruction}\n\n<lesson_context>\n${context}\n</lesson_context>\n\n<learner_message>\n${prompt}\n</learner_message>`;
}

export async function coach({ userId, lessonId, purpose, prompt, context, signal }: { userId: string; lessonId?: string; purpose: CoachPurpose; prompt: string; context: string; signal?: AbortSignal }) {
  claimQuota(userId);
  const release = await acquireSlot();
  try {
    const answer = await getCodexAppServer().runTutorTurn({ threadKey: `${userId}:${lessonId ?? purpose}`, prompt: buildTutorPrompt({ purpose, prompt, context }), signal });
    const clean = purpose === "completion" ? answer.replaceAll("`", "").split("\n").find((line) => line.trim())?.trim() ?? answer : answer;
    return { answer: clean, model: "gpt-5.6-luna", reasoning: "xhigh" };
  } finally {
    release();
  }
}
