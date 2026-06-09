import "dotenv/config"
// Refreshed client types at 2026-06-03
import { PrismaClient } from "@/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// Evict stale cached prisma client instances (helps with dev HMR caching of schema updates)
if (globalForPrisma.prisma) {
  delete (globalForPrisma as any).prisma
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
})
const adapter = new PrismaPg(pool)

export const db = (globalForPrisma.prisma || new (PrismaClient as any)({ adapter })) as PrismaClient

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
