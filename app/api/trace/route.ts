import { NextResponse } from "next/server";
import { z } from "zod";
import { getJudge } from "@/lib/judge";
import { publicJudgeError } from "@/lib/judge/errors";
import { tracePython } from "@/lib/judge/tracer";

const schema = z.object({ code: z.string().min(1).max(30_000) });

export async function POST(request: Request) {
  const body = await request.json().catch(() => undefined);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid trace request" }, { status: 400 });
  try { return NextResponse.json(await tracePython(getJudge(), parsed.data.code)); }
  catch (error) {
    console.error("Trace execution failed", error);
    return NextResponse.json({ error: publicJudgeError(error, "Trace failed") }, { status: 503 });
  }
}
