import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

type Email = { to: string; subject: string; text: string };

// Satu transport dipakai bersama (pooling): koneksi SMTP dipakai ulang dan jumlahnya dibatasi,
// jadi lonjakan permintaan antre di sini, tidak membuka ratusan koneksi sekaligus.
let pooled: { key: string; transport: Transporter } | undefined;
function getTransport(user: string, pass: string) {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 465;
  const key = `${host}:${port}:${user}:${pass}`;
  if (pooled?.key !== key) {
    const transport = nodemailer.createTransport({ host, port, secure: port === 465, pool: true, maxConnections: 3, maxMessages: 100, auth: { user, pass } });
    pooled = { key, transport };
  }
  return pooled.transport;
}

/**
 * Mengirim email lewat SMTP (mis. Gmail + App Password) atau Resend (REST), sesuai env yang diisi:
 * - SMTP_USER + SMTP_PASS: dikirim lewat SMTP. Bawaan host smtp.gmail.com port 465.
 * - RESEND_API_KEY: dikirim lewat Resend.
 * Tanpa keduanya:
 * - di development, isi email dicetak ke konsol server agar alur (mis. reset password) bisa dicoba;
 * - di produksi, pengiriman gagal dengan error supaya tidak terlihat "berhasil" padahal tidak terkirim.
 */
export async function sendEmail({ to, subject, text }: Email) {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (smtpUser && smtpPass) {
    const transport = getTransport(smtpUser, smtpPass);
    await transport.sendMail({ from: process.env.EMAIL_FROM || `sekenkos.id <${smtpUser}>`, to, subject, text });
    return;
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") throw new Error("Layanan email belum diatur (SMTP_USER/SMTP_PASS atau RESEND_API_KEY); email tidak terkirim.");
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
