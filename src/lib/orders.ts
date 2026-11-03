import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { OrderStatus, PaymentMethod } from "@/generated/prisma/enums";
import type { CartLine } from "@/lib/cart";
import { db } from "@/lib/db";
import { generateOrderCode } from "@/lib/order-code";
import { CANCELLABLE, PREVIOUS } from "@/lib/order-status";
import { calcTotals } from "@/lib/pricing";
import { getCourier } from "@/lib/shipping";

export const ORDER_TTL_MS = 24 * 60 * 60 * 1000;

/** Kesalahan yang aman ditampilkan ke pembeli (pesannya berbahasa Indonesia). */
export class OrderError extends Error {}

type Tx = Prisma.TransactionClient;

export type Address = { recipient: string; phone: string; street: string; city: string; zip: string };

export type CheckoutInput = {
  userId: string;
  lines: CartLine[];
  address: Address;
  courierId: string;
  paymentMethod: PaymentMethod;
  promoCode?: string;
};

/** Memeriksa kode promo tanpa mengubah apa pun. Dipakai untuk pratinjau dan di dalam transaksi checkout. */
export async function validatePromo(client: Tx | typeof db, rawCode: string, userId: string) {
  const code = rawCode.trim().toUpperCase();
  const promo = await client.promo.findUnique({ where: { code } });
  if (!promo || !promo.active) throw new OrderError("Kode promo tidak valid.");
  if (promo.validUntil && promo.validUntil < new Date()) throw new OrderError("Kode promo sudah kedaluwarsa.");
  if (promo.quota !== null && promo.usedCount >= promo.quota) throw new OrderError("Kuota kode promo sudah habis.");
  if (promo.firstPurchaseOnly) {
    const previous = await client.order.count({ where: { userId, status: { not: "CANCELLED" } } });
    if (previous > 0) throw new OrderError("Kode ini hanya berlaku untuk pembelian pertama.");
  }
  return promo;
}

const isCodeCollision = (e: unknown) =>
  typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";

export async function createOrder(input: CheckoutInput) {
  const courier = getCourier(input.courierId);
  if (!courier) throw new OrderError("Jasa pengiriman tidak valid.");
  if (input.lines.length === 0) throw new OrderError("Keranjang kosong.");

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await db.$transaction((tx) => build(tx, input, courier, generateOrderCode()));
    } catch (e) {
      if (isCodeCollision(e)) continue; // kode pesanan kebetulan sama; buat ulang
      throw e;
    }
  }
  throw new OrderError("Gagal membuat pesanan. Silakan coba lagi.");
}

async function build(tx: Tx, input: CheckoutInput, courier: { name: string; cost: number }, code: string) {
  const products = await tx.product.findMany({
    where: { id: { in: input.lines.map((l) => l.id) }, status: "ACTIVE" },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  const items: { productId: string; nameSnapshot: string; priceSnapshot: number; qty: number }[] = [];
  for (const line of input.lines) {
    const p = byId.get(line.id);
    if (!p) throw new OrderError("Salah satu barang di keranjang sudah tidak dijual.");
    // Pengurangan stok bersyarat dalam satu perintah: bila dua pembeli berebut 1 unit, hanya satu yang
    // menghasilkan count 1. Pembeli lain mendapat 0 dan seluruh transaksi dibatalkan (rollback).
    const taken = await tx.product.updateMany({
      where: { id: p.id, status: "ACTIVE", stock: { gte: line.qty } },
      data: { stock: { decrement: line.qty } },
    });
    if (taken.count === 0) throw new OrderError(`Maaf, stok ${p.name} sudah tidak cukup.`);
    subtotal += p.price * line.qty;
    items.push({ productId: p.id, nameSnapshot: p.name, priceSnapshot: p.price, qty: line.qty });
  }

  let promoId: string | undefined;
  let percent = 0;
  if (input.promoCode?.trim()) {
    const promo = await validatePromo(tx, input.promoCode, input.userId);
    // Penghitung dinaikkan hanya bila nilainya belum berubah sejak dibaca (cegah kuota terlampaui).
    const claimed = await tx.promo.updateMany({
      where: { id: promo.id, usedCount: promo.usedCount },
      data: { usedCount: { increment: 1 } },
    });
    if (claimed.count === 0) throw new OrderError("Kode promo baru saja habis dipakai. Silakan coba lagi.");
    promoId = promo.id;
    percent = promo.percent;
  }

  const totals = calcTotals(subtotal, courier.cost, percent);
  const { address: a } = input;
  return tx.order.create({
    data: {
      code,
      userId: input.userId,
      subtotal: totals.subtotal,
      discount: totals.discount,
      shippingCost: totals.shipping,
      total: totals.total,
      courier: courier.name,
      paymentMethod: input.paymentMethod,
      promoId,
      shipName: a.recipient,
      shipPhone: a.phone,
      shipStreet: a.street,
      shipCity: a.city,
      shipZip: a.zip,
      expiresAt: new Date(Date.now() + ORDER_TTL_MS),
      items: { create: items },
      events: { create: { status: "PENDING_PAYMENT", actorId: input.userId, note: "Pesanan dibuat" } },
    },
    include: { items: true, user: { select: { email: true, name: true } } },
  });
}

/**
 * Memajukan status satu langkah. Idempoten: bila status saat ini bukan status asal yang sah
 * (mis. sudah ditandai dibayar oleh admin lain), tidak ada yang berubah dan `changed` bernilai false.
 */
export async function advanceOrder(
  orderId: string,
  to: Exclude<OrderStatus, "PENDING_PAYMENT" | "CANCELLED">,
  actorId: string | null,
  opts: { trackingNumber?: string; note?: string } = {},
) {
  const from = PREVIOUS[to]!;
  if (to === "SHIPPED" && !opts.trackingNumber?.trim()) throw new OrderError("Nomor resi wajib diisi.");
  const now = new Date();

  return db.$transaction(async (tx) => {
    const moved = await tx.order.updateMany({
      where: { id: orderId, status: from },
      data: {
        status: to,
        ...(to === "PAID" && { paidAt: now }),
        ...(to === "SHIPPED" && { shippedAt: now, trackingNumber: opts.trackingNumber!.trim() }),
        ...(to === "RECEIVED" && { receivedAt: now }),
      },
    });
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { email: true, name: true } } },
    });
    if (moved.count === 0) return { changed: false as const, order };
    await tx.orderEvent.create({ data: { orderId, status: to, actorId, note: opts.note } });
    return { changed: true as const, order };
  });
}

/** Membatalkan pesanan, mengembalikan stok dan kuota promo. Idempoten seperti advanceOrder. */
export async function cancelOrder(orderId: string, actorId: string | null, note: string) {
  return db.$transaction(async (tx) => {
    const cancelled = await tx.order.updateMany({
      where: { id: orderId, status: { in: CANCELLABLE } },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: { select: { email: true, name: true } } },
    });
    if (cancelled.count === 0 || !order) return { changed: false as const, order };

    for (const item of order.items) {
      await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.qty } } });
    }
    if (order.promoId) {
      await tx.promo.updateMany({ where: { id: order.promoId, usedCount: { gt: 0 } }, data: { usedCount: { decrement: 1 } } });
    }
    await tx.orderEvent.create({ data: { orderId, status: "CANCELLED", actorId, note } });
    return { changed: true as const, order };
  });
}

/** Membatalkan pesanan yang melewati batas bayar dan mengembalikan stoknya (F-14). */
export async function expireOverdueOrders(limit = 100) {
  const overdue = await db.order.findMany({
    where: { status: "PENDING_PAYMENT", expiresAt: { lt: new Date() } },
    select: { id: true },
    orderBy: { expiresAt: "asc" },
    take: limit,
  });
  const cancelled = [];
  for (const { id } of overdue) {
    const r = await cancelOrder(id, null, "Kedaluwarsa: tidak dibayar dalam 24 jam");
    if (r.changed) cancelled.push(r.order!);
  }
  return cancelled;
}
