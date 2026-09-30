import "dotenv/config";
import "temporal-polyfill/full/global";
import "temporal-polyfill/types/global";
import { Pool } from "pg";
import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "./contract.d";
import contractJson from "./contract.json" with { type: "json" };

type Database = ReturnType<typeof postgres<Contract>>;

const globalForDb = globalThis as unknown as {
  db: Database | undefined;
  pool: Pool | undefined;
};

function getPool() {
  if (!globalForDb.pool) {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    globalForDb.pool = new Pool({
      connectionString: databaseUrl,
      max: 5,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 10000,
      allowExitOnIdle: true,
    });

    globalForDb.pool.on("error", (err) => {
      console.error("Unexpected pool error:", err);
      globalForDb.pool = undefined;
      globalForDb.db = undefined;
    });
  }

  return globalForDb.pool;
}

function createDb() {
  return postgres<Contract>({
    contractJson,
    pg: getPool(),
  });
}

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}

export async function closeDb() {
  await db.close();
  await globalForDb.pool?.end();
  globalForDb.pool = undefined;
  globalForDb.db = undefined;
}
