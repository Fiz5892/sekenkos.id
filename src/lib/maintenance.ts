import "server-only";
import { emailOrderCancelled } from "@/lib/order-emails";
import { expireOverdueOrders } from "@/lib/orders";

/**
 * Membatalkan pesanan yang lewat batas bayar, mengembalikan stok, lalu memberi tahu pembeli.
 * Dipanggil oleh cron harian dan, agar stok tertahan cepat bebas, secara oportunistik dari halaman katalog.
 */
export async function runExpiry(): Promise<number> {
  const cancelled = await expireOverdueOrders();
  for (const o of cancelled) await emailOrderCancelled(o, "tidak dibayar dalam 24 jam");
  return cancelled.length;
}
