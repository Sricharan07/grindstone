import { NextResponse } from "next/server";
import { z } from "zod";
import { getActor } from "@/lib/server/actor";
import { applyLearnerAction, loadLearnerState } from "@/lib/server/state-store";
import type { LearnerAction } from "@/lib/product/types";

const actionSchema = z.object({
  type: z.enum([
    "onboarding.save", "onboarding.complete", "profile.update", "lesson.save", "lab.save", "aptitude.save",
    "plan.toggle", "gate.complete", "attempt.record", "content.report", "streak.recover", "sprint.restart",
  ]),
  payload: z.unknown().optional(),
});

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
  if (parsed.data.type === "attempt.record" && (parsed.data.payload as { itemType?: unknown } | undefined)?.itemType === "lesson-transfer") {
    return NextResponse.json({ error: "Independent lesson evidence must come from the assessment service." }, { status: 403 });
  }
  try {
    return NextResponse.json(await applyLearnerAction(actor, parsed.data as LearnerAction));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "State update failed" }, { status: 422 });
  }
}
