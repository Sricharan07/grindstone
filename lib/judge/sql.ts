import postgres from "postgres";
import { parse } from "pgsql-ast-parser";

let sandbox: ReturnType<typeof postgres> | undefined;

const forbiddenFunctions = new Set(["pg_sleep", "dblink", "lo_import", "lo_export", "set_config", "current_setting"]);

function visit(value: unknown, fn: (node: Record<string, unknown>) => void) {
  if (Array.isArray(value)) { value.forEach((item) => visit(item, fn)); return; }
  if (!value || typeof value !== "object") return;
  const node = value as Record<string, unknown>;
  fn(node);
  Object.values(node).forEach((item) => visit(item, fn));
}

export function validateReadOnlySql(query: string) {
  const statements = parse(query);
  if (statements.length !== 1) throw new Error("Submit exactly one SQL statement");
  if (statements[0].type !== "select") throw new Error("Only SELECT queries are permitted");
  let invalid: string | null = null;
  visit(statements[0], (node) => {
    if ("into" in node && node.into) invalid = "SELECT INTO is not permitted";
    if (node.type === "call" && typeof node.function === "object" && node.function) {
      const name = String((node.function as { name?: string }).name ?? "").toLowerCase();
      if (forbiddenFunctions.has(name) || name.startsWith("pg_")) invalid = `Function ${name} is not permitted`;
    }
  });
  if (invalid) throw new Error(invalid);
  return statements[0];
}

function getSandbox() {
  const url = process.env.SQLSANDBOX_URL;
  if (!url) throw new Error("SQLSANDBOX_URL is not configured");
  sandbox ??= postgres(url, { max: 5, connect_timeout: 2, idle_timeout: 10 });
  return sandbox;
}

export async function runReadOnlySql(query: string) {
  validateReadOnlySql(query);
  const sql = getSandbox();
  const started = performance.now();
  const rows = await sql.begin(async (tx) => {
    await tx`set transaction read only`;
    await tx`set local statement_timeout = '5000ms'`;
    return tx.unsafe(query);
  });
  return { rows: rows.slice(0, 100).map((row) => ({ ...row })), rowCount: rows.length, truncated: rows.length > 100, durationMs: Math.round(performance.now() - started) };
}

export function rowsMatch(actual: Array<Record<string, unknown>>, expected: Array<Record<string, unknown>>) {
  const normalize = (rows: Array<Record<string, unknown>>) => rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value instanceof Date ? value.toISOString().slice(0, 10) : String(value)])));
  return JSON.stringify(normalize(actual)) === JSON.stringify(normalize(expected));
}
