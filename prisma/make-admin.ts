// Menjadikan akun yang sudah terdaftar sebagai admin:  npm run admin:make -- email@contoh.com
// Peran admin sengaja tidak bisa dipilih saat mendaftar; hanya lewat skrip ini (akses ke server/DB).
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { databaseSsl } from "../src/lib/db-ssl";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Pemakaian: npm run admin:make -- email@contoh.com");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, ssl: databaseSsl() }),
});

prisma.user
  .update({ where: { email }, data: { role: "ADMIN" }, select: { email: true, role: true } })
  .then((u) => console.log(`${u.email} sekarang ${u.role}.`))
  .catch(() => {
    console.error(`Akun ${email} tidak ditemukan. Daftar dulu lewat /daftar.`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
