"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { advanceOrder } from "@/lib/orders";
import { requireUser } from "@/lib/session";

/** Pembeli menandai barang sudah sampai. Hanya pemilik pesanan, dan hanya dari status Dikirim. */
export async function confirmReceived(formData: FormData) {
  const code = String(formData.get("code") ?? "");
  const user = await requireUser(`/pesanan/${code}`);
  const order = await db.order.findFirst({ where: { code, userId: user.id }, select: { id: true } });
  if (order) await advanceOrder(order.id, "RECEIVED", user.id, { note: "Dikonfirmasi pembeli" });
  redirect(`/pesanan/${code}`);
}
