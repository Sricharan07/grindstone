import { sql } from "drizzle-orm";
import Redis from "ioredis";
import { getDb } from "@/db";
import { getJudge } from "@/lib/judge";
import { runReadOnlySql } from "@/lib/judge/sql";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function databaseHealth() {
  await getDb().execute(sql`select 1`);
  return "ready";
}

async function redisHealth() {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is not configured");
  const redis = new Redis(url, { lazyConnect: true, connectTimeout: 2_000, maxRetriesPerRequest: 0, enableOfflineQueue: false });
  redis.on("error", () => undefined);
  try {
    await redis.connect();
    if (await redis.ping() !== "PONG") throw new Error("Redis ping failed");
    return "ready";
  } finally {
    redis.disconnect();
  }
}

async function judgeHealth() {
  const health = await getJudge().health();
  if (!health.ok) throw new Error(health.detail);
  return health.adapter;
}

async function sqlSandboxHealth() {
  const result = await runReadOnlySql("select 1 as ok");
  if (String(result.rows[0]?.ok) !== "1") throw new Error("SQL sandbox check failed");
  return "ready";
}

export async function GET() {
  const names = ["database", "redis", "judge", "sqlSandbox"] as const;
  const results = await Promise.allSettled([databaseHealth(), redisHealth(), judgeHealth(), sqlSandboxHealth()]);
  const services = Object.fromEntries(results.map((result, index) => [names[index], { ok: result.status === "fulfilled" }]));
  const ok = results.every((result) => result.status === "fulfilled");
  return Response.json({ ok, services }, { status: ok ? 200 : 503, headers: { "cache-control": "no-store" } });
}
