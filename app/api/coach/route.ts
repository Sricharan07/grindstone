import { NextResponse } from "next/server";
import { z } from "zod";
import { coach } from "@/lib/ai/coach";
import { getActor } from "@/lib/server/actor";
import { getCodexAppServer } from "@/lib/ai/codex-app-server";

const schema = z.object({ purpose: z.enum(["why", "teach-back", "mock-debrief", "short-answer", "socratic", "concept", "pseudocode", "next-step", "completion"]), prompt: z.string().min(3).max(5000), context: z.string().min(3).max(12_000), lessonId: z.string().min(1).max(120).optional() });
export async function GET() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ ok: false, detail: "Authentication required", model: "gpt-5.6-luna", reasoning: "xhigh" }, { status: 401 });
  const status = await getCodexAppServer().status();
  return NextResponse.json(status, { status: status.ok ? 200 : 503 });
}
export async function POST(request: Request) {
  const actor = await getActor(); if (!actor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => undefined)); if (!parsed.success) return NextResponse.json({ error: "Invalid coaching request" }, { status: 400 });
  try { return NextResponse.json(await coach({ userId: actor.id, ...parsed.data, signal: request.signal })); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Coach unavailable" }, { status: 503 }); }
}
