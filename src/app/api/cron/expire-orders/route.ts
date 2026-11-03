import { runExpiry } from "@/lib/maintenance";

// Dipanggil Vercel Cron (lihat vercel.json). Vercel mengirim "Authorization: Bearer $CRON_SECRET".
// Tanpa CRON_SECRET, endpoint menolak semua permintaan agar tak bisa dipicu sembarang orang.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Tidak diizinkan" }, { status: 401 });
  }
  const cancelled = await runExpiry();
  return Response.json({ cancelled });
}
