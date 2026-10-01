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

function isLocalPrismaPostgres(databaseUrl: string) {
  try {
    const { hostname, port } = new URL(databaseUrl);
    return hostname === "localhost" && (port === "51214" || port === "51215");
  } catch {
    return false;
  }
}

function getPool() {
  if (!globalForDb.pool) {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    // Local Prisma Postgres (PGlite) only accepts one connection at a time.
    // A larger pool queues and then times out with "Connection terminated due
    // to connection timeout".
    const local = isLocalPrismaPostgres(databaseUrl);

    globalForDb.pool = new Pool({
      connectionString: databaseUrl,
      max: local ? 1 : 5,
      idleTimeoutMillis: local ? 1000 : 60000,
      connectionTimeoutMillis: local ? 60000 : 10000,
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
