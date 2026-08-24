import { NextResponse } from "next/server";
import { z } from "zod";
import { aptitudeSet, buildAptitudeItem } from "@/lib/aptitude/catalog";
import { getActor } from "@/lib/server/actor";

const requestSchema = z.object({
  day: z.coerce.number().int().min(1).max(28),
  count: z.coerce.number().int().min(1).max(12).default(8),
});

const answerSchema = z.object({
  questionId: z.string().regex(/^aptitude-(?:[1-9]|1\d|2[0-8])-(?:[0-9]|1[01])$/),
  selectedIndex: z.number().int().min(0).max(3),
});

export async function GET(request: Request) {
  if (!await getActor()) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const parsed = requestSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid aptitude request" }, { status: 400 });
  const questions = aptitudeSet(parsed.data.day, parsed.data.count).map((question) => {
    return {
      id: question.id,
      topic: question.topic,
      prompt: question.prompt,
      options: question.options,
      difficulty: question.difficulty,
      targetSeconds: question.targetSeconds,
    };
  });
  return NextResponse.json({ questions });
}

export async function POST(request: Request) {
  if (!await getActor()) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const parsed = answerSchema.safeParse(await request.json().catch(() => undefined));
  if (!parsed.success) return NextResponse.json({ error: "Invalid answer" }, { status: 400 });
  const [, day, offset] = parsed.data.questionId.match(/^aptitude-(\d+)-(\d+)$/) ?? [];
  const question = buildAptitudeItem(Number(day), Number(offset));
  return NextResponse.json({
    correct: parsed.data.selectedIndex === question.answerIndex,
    answerIndex: question.answerIndex,
    explanation: question.explanation,
  });
}
