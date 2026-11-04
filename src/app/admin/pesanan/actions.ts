"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { carrierByCode, detectCarrier } from "@/lib/couriers";
import { db } from "@/lib/db";
import { emailOrderCancelled, emailOrderPaid, emailOrderShipped } from "@/lib/order-emails";
import { OrderError, advanceOrder, cancelOrder } from "@/lib/orders";
import { requireAdmin } from "@/lib/session";

const text = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : "");
const STEPS = ["PAID", "PACKED", "SHIPPED", "RECEIVED"] as const;
type Step = (typeof STEPS)[number];

async function findOrder(code: string) {
  const order = await db.order.findUnique({ where: { code }, select: { id: true } });
  if (!order) redirect("/admin/pesanan");
  return order;
}

export async function advance(formData: FormData) {
  const admin = await requireAdmin();
  const code = text(formData.get("code"));
  const to = text(formData.get("to")) as Step;
  if (!STEPS.includes(to)) redirect(`/admin/pesanan/${code}`);
  const order = await findOrder(code);

  let error: string | null = null;
  try {
    // Pesanan bayar online hanya boleh lunas lewat webhook gateway, supaya status tak bisa ditandai tanpa uang masuk.
    const meta = await db.order.findUnique({ where: { id: order.id }, select: { paymentMethod: true, courier: true, status: true } });
    if (to === "PAID" && meta?.paymentMethod === "GATEWAY") throw new OrderError("Pesanan bayar online lunas otomatis begitu pembayaran dikonfirmasi gateway.");
    // Ongkir "estimasi" tidak menyebut kurir: admin memilihnya saat mengirim, agar pelanggan dapat tautan lacak yang tepat.
    if (to === "SHIPPED" && meta && meta.status === "PACKED" && !detectCarrier(meta.courier)) {
      const carrier = carrierByCode(text(formData.get("carrier")));
      if (!carrier) throw new OrderError("Pilih kurir pengirim.");
      await db.order.update({ where: { id: order.id }, data: { courier: `${carrier.name} (${meta.courier})`.slice(0, 60) } });
    }
    const r = await advanceOrder(order.id, to, admin.id, { trackingNumber: text(formData.get("resi")) });
    const o = r.order;
    if (r.changed && o) {
      if (to === "PAID") after(() => emailOrderPaid(o));
      if (to === "SHIPPED") after(() => emailOrderShipped(o));
    }
  } catch (e) {
    if (!(e instanceof OrderError)) throw e;
    error = e.message;
  }
  redirect(error ? `/admin/pesanan/${code}?galat=${encodeURIComponent(error)}` : `/admin/pesanan/${code}`);
}

export async function cancel(formData: FormData) {
  const admin = await requireAdmin();
  const code = text(formData.get("code"));
  const reason = text(formData.get("alasan")).trim().slice(0, 200) || "Dibatalkan admin";
  const order = await findOrder(code);

  const r = await cancelOrder(order.id, admin.id, reason);
  const o = r.order;
  if (r.changed && o) after(() => emailOrderCancelled(o, reason));
  redirect(`/admin/pesanan/${code}`);
}
