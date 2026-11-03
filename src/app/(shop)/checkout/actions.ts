"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { writeCart, readCart } from "@/lib/cart-server";
import { db } from "@/lib/db";
import { runExpiry } from "@/lib/maintenance";
import { emailOrderCreated } from "@/lib/order-emails";
import { OrderError, createOrder, validatePromo } from "@/lib/orders";
import { requireUser } from "@/lib/session";
import { COURIERS } from "@/lib/shipping";

export type CheckoutState = { error?: string };
export type PromoState = { ok: boolean; message: string; percent?: number; code?: string };

const phone = z
  .string()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(/^(0|\+62)\d{8,13}$/, "Nomor HP tidak valid."));

const schema = z.object({
  recipient: z.string().trim().min(2, "Nama penerima wajib diisi.").max(80),
  phone,
  street: z.string().trim().min(5, "Alamat lengkap wajib diisi.").max(200),
  city: z.string().trim().min(2, "Kota wajib diisi.").max(80),
  zip: z.string().trim().regex(/^\d{5}$/, "Kode pos harus 5 digit."),
  courier: z.enum(COURIERS.map((c) => c.id) as [string, ...string[]], "Pilih jasa pengiriman."),
  payment: z.enum(["BANK_TRANSFER", "EWALLET"], "Pilih metode pembayaran."),
  promo: z.string().trim().max(40).optional(),
});

const text = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : "");

export async function checkPromo(code: string): Promise<PromoState> {
  const user = await requireUser("/checkout");
  const trimmed = code.trim();
  if (!trimmed) return { ok: false, message: "Masukkan kode promo." };
  try {
    const promo = await validatePromo(db, trimmed, user.id);
    return { ok: true, message: `Diskon ${promo.percent}% dipakai.`, percent: promo.percent, code: promo.code };
  } catch (e) {
    if (e instanceof OrderError) return { ok: false, message: e.message };
    throw e;
  }
}

export async function placeOrder(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const user = await requireUser("/checkout");

  const parsed = schema.safeParse({
    recipient: text(formData.get("recipient")),
    phone: text(formData.get("phone")),
    street: text(formData.get("street")),
    city: text(formData.get("city")),
    zip: text(formData.get("zip")),
    courier: text(formData.get("courier")),
    payment: text(formData.get("payment")),
    promo: text(formData.get("promo")) || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const lines = await readCart();
  if (lines.length === 0) return { error: "Keranjangmu kosong." };

  // Lepaskan stok dari pesanan kedaluwarsa dulu agar tidak salah menolak pembeli.
  await runExpiry();

  let order;
  try {
    order = await createOrder({
      userId: user.id,
      lines,
      address: { recipient: d.recipient, phone: d.phone, street: d.street, city: d.city, zip: d.zip },
      courierId: d.courier,
      paymentMethod: d.payment,
      promoCode: d.promo,
    });
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message };
    throw e;
  }

  // Simpan alamat terakhir untuk checkout berikutnya.
  const addr = { recipient: d.recipient, phone: d.phone, street: d.street, city: d.city, zip: d.zip };
  const existing = await db.address.findFirst({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });
  if (existing) await db.address.update({ where: { id: existing.id }, data: addr });
  else await db.address.create({ data: { userId: user.id, ...addr } });

  await writeCart([]);
  after(() => emailOrderCreated(order, order.expiresAt));
  redirect(`/pesanan/${order.code}`);
}
