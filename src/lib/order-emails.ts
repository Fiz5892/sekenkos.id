import "server-only";
import { detectCarrier } from "@/lib/couriers";
import { sendEmail } from "@/lib/email";
import { formatRupiah } from "@/lib/format";
import { SITE } from "@/lib/site";

type OrderMail = { code: string; total: number; courier: string; trackingNumber: string | null; paymentMethod?: string; user: { email: string; name: string } };

const link = (code: string) => `${SITE.url}/pesanan/${code}`;
const sign = `\n\nSalam,\n${SITE.name}`;

async function safeSend(to: string, subject: string, text: string) {
  try {
    await sendEmail({ to, subject, text });
  } catch (e) {
    // Gagal kirim email tidak boleh menggagalkan pesanan; cukup dicatat.
    console.error(`Gagal mengirim email "${subject}" ke ${to}:`, e);
  }
}

export const emailOrderCreated = (o: OrderMail, expiresAt: Date) =>
  safeSend(
    o.user.email,
    `Pesanan ${o.code} dibuat`,
    `Halo ${o.user.name},\n\nPesananmu ${o.code} sudah kami terima. Total yang perlu dibayar: ${formatRupiah(o.total)}.\n` +
      `Selesaikan pembayaran sebelum ${expiresAt.toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })} ` +
      (o.paymentMethod === "GATEWAY"
        ? `lewat tombol "Bayar sekarang" di halaman pesanan; pesanan otomatis lunas setelah dibayar. Tautan: ${link(o.code)}${sign}`
        : `lalu kirim bukti lewat WhatsApp. Petunjuk lengkap: ${link(o.code)}${sign}`),
  );

export const emailOrderPaid = (o: OrderMail) =>
  safeSend(o.user.email, `Pembayaran pesanan ${o.code} diterima`, `Halo ${o.user.name},\n\nPembayaranmu sudah kami terima. Pesananmu segera dikemas.\nPantau status: ${link(o.code)}${sign}`);

export const emailOrderShipped = (o: OrderMail) => {
  const carrier = detectCarrier(o.courier);
  const track = carrier && o.trackingNumber ? `\nLacak posisi paket di situs ${carrier.name}: ${carrier.trackUrl} (tempel nomor resi di atas).` : "";
  return safeSend(
    o.user.email,
    `Pesanan ${o.code} dikirim`,
    `Halo ${o.user.name},\n\nPesananmu dikirim lewat ${o.courier}${o.trackingNumber ? ` dengan nomor resi ${o.trackingNumber}` : ""}.${track}\nPantau status: ${link(o.code)}${sign}`,
  );
};

export const emailOrderCancelled = (o: OrderMail, reason: string) =>
  safeSend(o.user.email, `Pesanan ${o.code} dibatalkan`, `Halo ${o.user.name},\n\nPesanan ${o.code} dibatalkan (${reason}). Stok barang dikembalikan. Jika sudah membayar, hubungi kami lewat WhatsApp ${SITE.whatsapp}.${sign}`);
