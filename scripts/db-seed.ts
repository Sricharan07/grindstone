import "dotenv/config";
import { getDb } from "@/db";
import { codebaseTasks, companyPacks, concepts, problems, questions } from "@/db/schema";
import { buildBootstrapBank } from "@/lib/content/bootstrap-bank";
import { pythonCodebaseFixtures } from "@/lib/content/codebase-fixtures";

async function main() {
const db = getDb();

await db.insert(concepts).values({
  slug: "mutability-references",
  title: "Mutability: references are not copies",
  track: "Coding foundations",
  tier: "Foundation",
  prerequisites: [],
  bodyL1: "A variable can hold a direction to an object. Copying that direction does not copy the object.",
  bodyL2: "Assignment aliases the same list. An in-place mutation is visible through every alias; use an explicit shallow or deep copy when state must be independent.",
  bodyL3: "CPython local slots store references to heap objects. Assignment increments ownership of the same object in constant time, while a shallow list copy allocates and copies references in linear time.",
}).onConflictDoUpdate({ target: concepts.slug, set: { bodyL1: "A variable can hold a direction to an object. Copying that direction does not copy the object.", bodyL2: "Assignment aliases the same list. An in-place mutation is visible through every alias; use an explicit shallow or deep copy when state must be independent.", bodyL3: "CPython local slots store references to heap objects. Assignment increments ownership of the same object in constant time, while a shallow list copy allocates and copies references in linear time.", updatedAt: new Date() } });

const bank = buildBootstrapBank(1200);
for (let start = 0; start < bank.length; start += 200) {
  await db.insert(questions).values(bank.slice(start, start + 200).map((item, offset) => ({
    sourceKey: `bootstrap-v1-${String(start + offset + 1).padStart(4, "0")}`,
    kind: item.kind,
    topic: item.topic,
    difficulty: item.difficulty,
    prompt: item.prompt,
    payload: item.payload,
    explanation: item.explanation,
    status: "published" as const,
    verification: item.verification,
  }))).onConflictDoNothing();
}

for (const pack of [
  { slug: "amazon-general", company: "Amazon", roleFamily: "Software engineering", loopShape: { rounds: ["coding", "system-design", "leadership-principles"] }, aiPolicy: { default: "disallowed", source: "recruiter-confirmation-required" } },
  { slug: "google-practice", company: "Google practice", roleFamily: "Software engineering", loopShape: { rounds: ["coding", "ai-assisted-coding", "design", "googleyness"] }, aiPolicy: { default: "disallowed", "ai-assisted-coding": "permitted" } },
  { slug: "meta-practice", company: "Meta practice", roleFamily: "Software engineering", loopShape: { rounds: ["coding", "system-design", "behavioral"] }, aiPolicy: { default: "round-specific" } },
]) await db.insert(companyPacks).values({ ...pack, lastVerified: new Date("2026-08-23T00:00:00Z") }).onConflictDoNothing();

await db.insert(problems).values({
  leetcodeId: 1,
  title: "Two Sum",
  slug: "two-sum",
  statement: "Return the indices of two distinct values whose sum equals the target.",
  difficulty: "easy",
  tier: "A",
  tags: ["arrays", "hashing"],
  optimalTime: "O(n)",
  optimalSpace: "O(n)",
  followups: ["Process values as a stream and return the first pair as soon as it exists."],
  sourceUrl: "https://leetcode.com/problems/two-sum/",
  status: "published",
}).onConflictDoUpdate({ target: problems.slug, set: { status: "published", updatedAt: new Date() } });

for (const fixture of pythonCodebaseFixtures) {
  const values = {
    title: fixture.title,
    language: "python",
    repositoryFixture: fixture.repositoryFixture,
    plantedBugs: fixture.plantedBugs,
    rubric: fixture.rubric,
    status: "published" as const,
  };
  await db.insert(codebaseTasks).values(values).onConflictDoUpdate({
    target: codebaseTasks.repositoryFixture,
    set: values,
  });
}

console.info(JSON.stringify({ seededQuestions: bank.length, seededJudgeProblems: 1, seededLessons: 1, codebaseRepositories: pythonCodebaseFixtures.length }, null, 2));
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
