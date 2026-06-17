import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function createPrismaClient() {
  // max: 1 evita que múltiples workers del build o instancias serverless
  // agoten el límite de 15 conexiones del pooler de Supabase en session mode.
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Cachear siempre (no solo en dev) para reusar la instancia entre invocaciones
// de la misma función serverless y reducir conexiones abiertas.
globalForPrisma.prisma = prisma;
