import { NextResponse } from "next/server";
import { z } from "zod";
import { getActor } from "@/lib/server/actor";
import { applyLearnerAction, loadLearnerState } from "@/lib/server/state-store";
import type { LearnerAction } from "@/lib/product/types";

const actionSchema = z.object({ type: z.string().min(1), payload: z.unknown().optional() });

export async function GET() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  return NextResponse.json(await loadLearnerState(actor));
}

export async function PATCH(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const parsed = actionSchema.safeParse(await request.json().catch(() => undefined));
  if (!parsed.success) return NextResponse.json({ error: "Invalid state action" }, { status: 400 });
  try {
    return NextResponse.json(await applyLearnerAction(actor, parsed.data as LearnerAction));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "State update failed" }, { status: 422 });
  }
}
