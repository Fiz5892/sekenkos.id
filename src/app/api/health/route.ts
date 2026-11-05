import { db } from "@/lib/db";

// Dipanggil terjadwal (GitHub Actions / UptimeRobot) agar database Supabase paket gratis
// tidak dijeda karena tidak ada aktivitas. Memakai CRON_SECRET yang sama dengan cron lain.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Tidak diizinkan" }, { status: 401 });
  }
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
