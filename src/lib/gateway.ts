import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

/*
 * Payment gateway: Midtrans Snap (halaman bayar hosted milik Midtrans; pembeli memilih VA bank, QRIS,
 * dompet digital, kartu, dll di sana, jadi tidak ada data kartu yang menyentuh server kita).
 *   MIDTRANS_SERVER_KEY  Server Key (Settings > Access Keys). Kunci sandbox berawalan "SB-" otomatis memakai
 *                        server sandbox; selain itu memakai server produksi. Kunci yang sama dipakai
 *                        memverifikasi signature webhook.
 *   MIDTRANS_ENABLED     "false" menyembunyikan bayar online sementara tanpa menghapus kunci.
 * Kosong = metode "Bayar online" disembunyikan dan toko memakai transfer manual saja.
 */
const serverKey = () => process.env.MIDTRANS_SERVER_KEY ?? "";
const sandbox = () => serverKey().startsWith("SB-");
const SNAP_URL = () => (sandbox() ? "https://app.sandbox.midtrans.com/snap/v1" : "https://app.midtrans.com/snap/v1");
const API_URL = () => (sandbox() ? "https://api.sandbox.midtrans.com/v2" : "https://api.midtrans.com/v2");

export const gatewayEnabled = () => Boolean(serverKey()) && process.env.MIDTRANS_ENABLED !== "false";

/** Kesalahan yang aman ditampilkan ke pembeli. */
export class GatewayError extends Error {}

const authHeader = () => `Basic ${Buffer.from(`${serverKey()}:`).toString("base64")}`;

/** Midtrans tidak punya id invoice terpisah: order_id (kode pesanan) menjadi id-nya. */
export type Invoice = { id: string; url: string };

export async function createInvoice(input: {
  externalId: string;
  amount: number;
  description: string;
  email: string;
  name: string;
  phone?: string;
  /** Berapa detik invoice berlaku. */
  durationSeconds: number;
  successUrl: string;
  failureUrl: string;
}): Promise<Invoice> {
  let res: Response;
  try {
    res = await fetch(`${SNAP_URL()}/transactions`, {
      method: "POST",
      headers: { Authorization: authHeader(), "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        transaction_details: { order_id: input.externalId, gross_amount: input.amount },
        customer_details: { first_name: input.name, email: input.email, ...(input.phone && { phone: input.phone }) },
        expiry: { unit: "minutes", duration: Math.max(1, Math.ceil(input.durationSeconds / 60)) },
        callbacks: { finish: input.successUrl },
      }),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
  } catch {
    throw new GatewayError("Pembayaran online belum bisa dibuka. Coba lagi atau pilih transfer manual.");
  }
  if (!res.ok) {
    console.error(`Midtrans ${res.status}:`, (await res.text()).slice(0, 400));
    throw new GatewayError("Pembayaran online belum bisa dibuka. Coba lagi atau pilih transfer manual.");
  }
  const json = (await res.json()) as { token?: string; redirect_url?: string };
  if (!json.redirect_url) throw new GatewayError("Pembayaran online belum bisa dibuka. Coba lagi atau pilih transfer manual.");
  return { id: input.externalId, url: json.redirect_url };
}

/** Menutup transaksi yang belum dibayar agar tidak bisa dibayar setelah pesanan dibatalkan. Gagal = diabaikan. */
export async function expireInvoice(invoiceId: string): Promise<void> {
  try {
    await fetch(`${API_URL()}/${encodeURIComponent(invoiceId)}/expire`, {
      method: "POST",
      headers: { Authorization: authHeader(), Accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
  } catch {
    /* transaksi akan kedaluwarsa sendiri sesuai masa berlakunya */
  }
}

const sha512 = (s: string) => createHash("sha512").update(s).digest("hex");

/**
 * Memastikan notifikasi benar-benar dari Midtrans:
 * signature_key = SHA512(order_id + status_code + gross_amount + ServerKey).
 */
export function validNotification(body: unknown): boolean {
  const key = serverKey();
  if (!key || typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  const { order_id, status_code, gross_amount, signature_key } = b;
  if (![order_id, status_code, gross_amount, signature_key].every((v) => typeof v === "string")) return false;
  const a = Buffer.from(sha512(`${order_id}${status_code}${gross_amount}${key}`));
  const c = Buffer.from(signature_key as string);
  return a.length === c.length && timingSafeEqual(a, c);
}

export type InvoiceEvent = {
  id: string;
  externalId: string;
  status: string;
  amount: number;
  paidAmount?: number;
  channel?: string;
};

/** Nama kanal yang mudah dibaca, mis. "BCA" untuk VA bank atau "qris". */
function channelOf(b: Record<string, unknown>): string | undefined {
  const va = Array.isArray(b.va_numbers) ? (b.va_numbers[0] as { bank?: unknown } | undefined) : undefined;
  if (typeof va?.bank === "string") return va.bank.toUpperCase();
  if (b.payment_type === "echannel") return "MANDIRI";
  if (typeof b.permata_va_number === "string") return "PERMATA";
  return typeof b.payment_type === "string" && b.payment_type ? b.payment_type : undefined;
}

/**
 * Membaca notifikasi transaksi Midtrans; null bila bentuknya tidak dikenal. Status dipetakan ke
 * PAID (settlement, atau capture kartu yang lolos fraud check), EXPIRED, atau status mentah huruf besar
 * (pending, cancel, deny, ... yang diabaikan).
 */
export function parseInvoiceEvent(body: unknown): InvoiceEvent | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  if (typeof b.order_id !== "string" || typeof b.transaction_status !== "string") return null;
  const amount = Number(b.gross_amount);
  if (!Number.isFinite(amount)) return null;
  const raw = b.transaction_status.toLowerCase();
  const fraud = typeof b.fraud_status === "string" ? b.fraud_status.toLowerCase() : "accept";
  const status = raw === "settlement" || (raw === "capture" && fraud === "accept") ? "PAID" : raw === "expire" ? "EXPIRED" : raw.toUpperCase();
  return { id: b.order_id, externalId: b.order_id, status, amount, paidAmount: amount, channel: channelOf(b) };
}
