import "server-only";
import { db } from "@/lib/db";
import type { InvoiceEvent } from "@/lib/gateway";
import { emailOrderCancelled, emailOrderPaid } from "@/lib/order-emails";
import { advanceOrder, cancelOrder } from "@/lib/orders";

export type EventResult = "paid" | "cancelled" | "ignored" | "unknown-order" | "amount-mismatch" | "late-payment";

/**
 * Menerapkan pemberitahuan invoice dari gateway ke pesanan. Aman dipanggil berulang (Midtrans mengirim ulang
 * bila respons gagal atau notifikasi sama datang dua kali): perpindahan status bersifat idempoten.
 */
export async function applyInvoiceEvent(e: InvoiceEvent): Promise<EventResult> {
  // Hanya pesanan GATEWAY yang boleh diubah lewat webhook; dicocokkan lewat id invoice, lalu kode pesanan.
  const order = await db.order.findFirst({
    where: { paymentMethod: "GATEWAY", OR: [{ gatewayInvoiceId: e.id }, { code: e.externalId }] },
    include: { user: { select: { email: true, name: true } } },
  });
  if (!order) return "unknown-order";

  if (e.status === "PAID") {
    // Nominal harus pas dengan tagihan; selisih ditandai untuk dicek admin, bukan otomatis dianggap lunas.
    if ((e.paidAmount ?? e.amount) !== order.total || e.amount !== order.total) {
      await db.orderEvent.create({
        data: { orderId: order.id, status: order.status, note: `PERIKSA: nominal webhook ${e.paidAmount ?? e.amount} ≠ tagihan ${order.total} (invoice ${e.id})` },
      });
      return "amount-mismatch";
    }
    if (order.status === "CANCELLED") {
      // Dibayar tepat setelah pesanan dibatalkan (stok sudah dikembalikan): perlu tindakan manual.
      await db.orderEvent.create({
        data: { orderId: order.id, status: "CANCELLED", note: `PERHATIAN: invoice ${e.id} dibayar setelah pesanan dibatalkan. Refund atau pulihkan pesanan secara manual.` },
      });
      console.error(`Pembayaran masuk untuk pesanan yang sudah dibatalkan: ${order.code}`);
      return "late-payment";
    }
    if (e.channel && order.paymentChannel !== e.channel) {
      await db.order.update({ where: { id: order.id }, data: { paymentChannel: e.channel } });
    }
    const r = await advanceOrder(order.id, "PAID", null, { note: `Dibayar online${e.channel ? ` via ${e.channel}` : ""}` });
    if (r.changed && r.order) await emailOrderPaid(r.order);
    return r.changed ? "paid" : "ignored";
  }

  if (e.status === "EXPIRED") {
    const r = await cancelOrder(order.id, null, "Invoice pembayaran kedaluwarsa");
    if (r.changed && r.order) await emailOrderCancelled(r.order, "pembayaran tidak diterima sampai batas waktu");
    return r.changed ? "cancelled" : "ignored";
  }

  return "ignored";
}
