import "server-only";
import type { PaymentMethod } from "@/generated/prisma/enums";

/**
 * Tujuan pembayaran manual. Diatur lewat env agar tidak perlu mengubah kode:
 *   PAYMENT_BANK="BCA 123 456 7890 a.n. sekenkos.id"
 *   PAYMENT_EWALLET="DANA / GoPay 0812-0000-0000 a.n. sekenkos.id"
 * Di produksi tanpa env, pembeli diarahkan menanyakan rekening ke admin (bukan memakai rekening contoh).
 */
export function paymentTarget(method: PaymentMethod): string {
  const value = method === "BANK_TRANSFER" ? process.env.PAYMENT_BANK : process.env.PAYMENT_EWALLET;
  if (value) return value;
  if (process.env.NODE_ENV === "production") return "Hubungi admin lewat WhatsApp untuk mendapatkan nomor tujuan pembayaran.";
  return method === "BANK_TRANSFER" ? "BCA 123 456 7890 a.n. sekenkos.id (contoh)" : "DANA 0812-0000-0000 a.n. sekenkos.id (contoh)";
}
