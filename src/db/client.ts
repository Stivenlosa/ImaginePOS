import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma";

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
    pool: Pool | undefined;
};

function getPool() {
    if (!globalForPrisma.pool) {
        const databaseUrl = process.env.DATABASE_URL;
        
        if (!databaseUrl) {
            throw new Error("DATABASE_URL environment variable is not set");
        }

        globalForPrisma.pool = new Pool({
            connectionString: databaseUrl,
            max: 5,
            idleTimeoutMillis: 60000,
            connectionTimeoutMillis: 10000,
            allowExitOnIdle: true,
        });

        // Handle unexpected pool errors so they don't crash the process
        globalForPrisma.pool.on("error", (err) => {
            console.error("Unexpected pool error:", err);
            // Reset pool and prisma so they get recreated on next use
            globalForPrisma.pool = undefined;
            globalForPrisma.prisma = undefined;
        });
    }

    return globalForPrisma.pool;
}

function createPrismaClient() {
    const pool = getPool();
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}

export default prisma;
