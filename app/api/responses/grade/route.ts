import { NextResponse } from "next/server";
import { z } from "zod";
import { gradeResponse } from "@/lib/engine/response-rubric";
import { getActor } from "@/lib/server/actor";

const schema = z.object({ kind: z.enum(["behavioral", "communication", "coding_communication", "codebase", "system_design", "ai_fluency", "lld", "teach_back"]), response: z.string().min(20).max(20_000) });

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => undefined));
  if (!parsed.success) return NextResponse.json({ error: "Response is too short to grade" }, { status: 400 });
  return NextResponse.json(gradeResponse(parsed.data.kind, parsed.data.response));
}
