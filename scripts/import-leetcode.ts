import "dotenv/config";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { getDb } from "@/db";
import { problems } from "@/db/schema";

const problemSchema = z.object({
  number: z.number().int().positive(),
  title: z.string().min(2),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  difficulty: z.enum(["easy", "medium", "hard"]),
  tags: z.array(z.string()).min(1),
  sourceUrl: z.string().url(),
  statement: z.string().min(20),
  tier: z.enum(["A", "B", "C"]),
  optimalTime: z.string().min(2),
  optimalSpace: z.string().min(2),
  followups: z.array(z.string()).min(1),
});

async function main() {
const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Usage: pnpm content:import -- /absolute/path/to/leetcode-export.json");
const inputPath = resolve(sourcePath);
const rows = z.array(problemSchema).parse(JSON.parse(await readFile(inputPath, "utf8")));
const db = getDb();
const executableProblems = new Set(["two-sum"]);

for (const row of rows) {
  const status = executableProblems.has(row.slug) ? "published" as const : "verified" as const;
  await db.insert(problems).values({
    leetcodeId: row.number,
    title: row.title,
    slug: row.slug,
    statement: row.statement,
    difficulty: row.difficulty,
    tier: row.tier,
    tags: row.tags,
    optimalTime: row.optimalTime,
    optimalSpace: row.optimalSpace,
    followups: row.followups,
    sourceUrl: row.sourceUrl,
    status,
  }).onConflictDoUpdate({ target: problems.slug, set: { title: row.title, statement: row.statement, difficulty: row.difficulty, tier: row.tier, tags: row.tags, optimalTime: row.optimalTime, optimalSpace: row.optimalSpace, followups: row.followups, sourceUrl: row.sourceUrl, status, updatedAt: new Date() } });
}

console.info(JSON.stringify({ imported: rows.length, publishedWithHarness: rows.filter((row) => executableProblems.has(row.slug)).length, awaitingHarness: rows.filter((row) => !executableProblems.has(row.slug)).length, source: inputPath }, null, 2));
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
