import "server-only";

type Email = { to: string; subject: string; text: string };

/**
 * Mengirim email lewat Resend (REST). Tanpa RESEND_API_KEY:
 * - di development, isi email dicetak ke konsol server agar alur (mis. reset password) bisa dicoba;
 * - di produksi, pengiriman gagal dengan error supaya tidak terlihat "berhasil" padahal tidak terkirim.
 */
export async function sendEmail({ to, subject, text }: Email) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") throw new Error("RESEND_API_KEY belum diatur; email tidak terkirim.");
    console.log(`\n[email dev] Kepada: ${to}\n[email dev] Subjek: ${subject}\n${text}\n`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "sekenkos.id <onboarding@resend.dev>",
      to,
      subject,
      text,
    }),
  });
  if (!res.ok) throw new Error(`Resend menolak email (${res.status}): ${await res.text()}`);
}
