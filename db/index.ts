import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let client: ReturnType<typeof postgres> | undefined;

export function getDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to use the database");
  }
  client ??= postgres(connectionString, {
    max: 10,
    connect_timeout: 2,
    idle_timeout: 20,
    max_lifetime: 60 * 30,
  });
  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof getDb>;
