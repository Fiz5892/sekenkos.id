import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { databaseSsl } from "@/lib/db-ssl";

// Satu instance per proses agar hot reload di dev tidak membuka koneksi baru terus-menerus.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL belum diatur. Salin .env.example ke .env.");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString, ssl: databaseSsl() }) });
}

// Bila skema Prisma diperbarui saat server dev berjalan (mis. model cartItem/productImage baru di-generate),
// instance lama di globalThis tidak memiliki delegate model baru. Buang instance lama agar dibuat ulang.
if (
  globalForPrisma.prisma &&
  (!("cartItem" in globalForPrisma.prisma) || !("productImage" in globalForPrisma.prisma))
) {
  delete globalForPrisma.prisma;
}

export const db = globalForPrisma.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
