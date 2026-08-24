import { NextResponse } from "next/server";
import { z } from "zod";
import { rowsMatch, runReadOnlySql } from "@/lib/judge/sql";

const schema = z.object({ query: z.string().min(6).max(20_000), task: z.enum(["hires-by-department"]) });

const expectedByTask = {
  "hires-by-department": [{ department: "Engineering", hires: "2" }, { department: "Operations", hires: "2" }, { department: "Finance", hires: "1" }],
};

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => undefined));
  if (!parsed.success) return NextResponse.json({ error: "Invalid SQL request" }, { status: 400 });
  try {
    const result = await runReadOnlySql(parsed.data.query);
    return NextResponse.json({ ...result, matchedExpected: rowsMatch(result.rows, expectedByTask[parsed.data.task]) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "SQL execution failed" }, { status: 422 });
  }
}
