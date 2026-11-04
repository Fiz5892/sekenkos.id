import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { SITE } from "@/lib/site";

// Batas percobaan per menit per IP. Bisa dinaikkan hanya untuk tes otomatis (lihat playwright.config.ts).
const strictMax = Number(process.env.AUTH_RATE_LIMIT_MAX) || 5;

// Asal (origin) yang boleh memanggil API auth selain baseURL. Di Vercel, domain produksi dan URL deploy/preview
// diisi otomatis oleh Vercel, jadi login tidak ditolak "Invalid origin" saat dibuka lewat domain tersebut.
const trustedOrigins = [
  process.env.NEXT_PUBLIC_SITE_URL,
  ...[process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL].map((h) => (h ? `https://${h}` : undefined)),
].filter((o): o is string => Boolean(o));

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? SITE.url,
  trustedOrigins,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    // Tautan reset berlaku 1 jam dan hanya sekali pakai (F-02); sesi lama dicabut setelah reset.
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      // Tidak di-await agar waktu respons tidak membocorkan apakah email terdaftar.
      void sendEmail({
        to: user.email,
        subject: "Reset password sekenkos.id",
        text: `Halo ${user.name},\n\nKlik tautan berikut untuk membuat password baru (berlaku 1 jam):\n${url}\n\nJika kamu tidak meminta ini, abaikan email ini.`,
      }).catch((e) => console.error("Gagal mengirim email reset password:", e));
    },
  },
  user: {
    additionalFields: {
      // input:false = tidak bisa diisi dari form daftar, sehingga tak seorang pun bisa mendaftar sebagai admin.
      role: { type: "string", defaultValue: "BUYER", input: false },
    },
  },
  session: { expiresIn: 60 * 60 * 24 * 30 },
  // Pembatasan percobaan (NFR keamanan). Penyimpanan di memori per instance: cukup untuk MVP,
  // pindah ke database/Redis bila trafik naik.
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: strictMax },
      "/sign-up/email": { window: 60, max: strictMax },
      "/request-password-reset": { window: 60, max: 3 },
    },
  },
  plugins: [nextCookies()],
});
