"use server";

import { refresh } from "next/cache";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { CartLine } from "@/lib/cart";
import { writeCart, readCart } from "@/lib/cart-server";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/format";
// import { GatewayError, createInvoice, gatewayEnabled } from "@/lib/gateway";
import { runExpiry } from "@/lib/maintenance";
import { emailOrderCreated } from "@/lib/order-emails";
import { OrderError, /* cancelOrder, */ createOrder, validatePromo } from "@/lib/orders";
import { requireUser } from "@/lib/session";
import { type ShippingOption } from "@/lib/shipping";
import { packageWeight } from "@/lib/shipping-calc";
import { ShippingError, quoteShipping, resolveShipping, shippingSettings } from "@/lib/shipping-quote";
// import { SITE } from "@/lib/site";
import { resolveVillage } from "@/lib/wilayah";

export type CheckoutState = { error?: string; refreshShipping?: boolean };
export type ShippingState = { options: ShippingOption[]; error?: undefined } | { options?: undefined; error: string };
export type PromoState = { ok: boolean; message: string; percent?: number; code?: string };

const phone = z
  .string()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(/^(0|\+62)\d{8,13}$/, "Nomor HP tidak valid."));

const schema = z.object({
  recipient: z.string().trim().min(2, "Nama penerima wajib diisi.").max(80),
  phone,
  street: z.string().trim().min(5, "Detail alamat (jalan, nomor, RT/RW) wajib diisi.").max(200),
  villageCode: z.string().trim().min(1, "Pilih provinsi sampai desa / kelurahan."),
  zip: z.string().trim().regex(/^\d{5}$/, "Kode pos harus 5 digit."),
  courier: z.string().trim().min(1, "Pilih jasa pengiriman.").max(60),
  // Ongkir yang tampil di layar saat pembeli memilih; dibandingkan dengan hitungan ulang di server.
  shippingCost: z.coerce.number().int().min(0),
  // "GATEWAY" (Midtrans) dinonaktifkan; tambahkan kembali bersama blok yang dikomentari di bawah bila dibutuhkan.
  payment: z.enum(["BANK_TRANSFER", "EWALLET", "QRIS"], "Pilih metode pembayaran."),
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

/** Berat paket dan nilai barang untuk isi keranjang saat ini, dihitung dari data di database (bukan dari klien). */
async function cartParcel(lines: CartLine[]) {
  const products = await db.product.findMany({
    where: { id: { in: lines.map((l) => l.id) }, status: "ACTIVE" },
    select: { id: true, price: true, weightGrams: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  const found = lines.flatMap((l) => {
    const p = byId.get(l.id);
    return p ? [{ weightGrams: p.weightGrams, price: p.price, qty: l.qty }] : [];
  });
  return {
    weight: packageWeight(found, shippingSettings().packingGrams),
    value: found.reduce((sum, p) => sum + p.price * p.qty, 0),
  };
}

/** Pilihan ongkir untuk kode pos tujuan, berdasarkan berat isi keranjang. Dipanggil dari form checkout. */
export async function getShippingOptions(zip: string, villageCode = ""): Promise<ShippingState> {
  await requireUser("/checkout");
  const lines = await readCart();
  if (lines.length === 0) return { error: "Keranjangmu kosong." };
  try {
    const parcel = await cartParcel(lines);
    const place = await resolveVillage(villageCode);
    return { options: await quoteShipping(zip, parcel.weight, parcel.value, place?.regencyCode) };
  } catch (e) {
    if (e instanceof ShippingError) return { error: e.message };
    throw e;
  }
}

export async function placeOrder(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const user = await requireUser("/checkout");

  const parsed = schema.safeParse({
    recipient: text(formData.get("recipient")),
    phone: text(formData.get("phone")),
    street: text(formData.get("street")),
    villageCode: text(formData.get("villageCode")),
    zip: text(formData.get("zip")),
    courier: text(formData.get("courier")),
    shippingCost: text(formData.get("shippingCost")),
    payment: text(formData.get("payment")),
    promo: text(formData.get("promo")) || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  // Nama wilayah diturunkan dari kode desa di server, bukan dipercaya dari klien.
  const place = await resolveVillage(d.villageCode);
  if (!place) return { error: "Alamat tidak valid. Pilih ulang provinsi sampai desa / kelurahan." };

  const lines = await readCart();
  if (lines.length === 0) return { error: "Keranjangmu kosong." };
  // if (d.payment === "GATEWAY" && !gatewayEnabled()) return { error: "Pembayaran online belum tersedia. Pilih transfer manual." };

  // Ongkir selalu dihitung ulang di server dari berat barang di database dan tarif kurir terbaru.
  let shipping: ShippingOption;
  let totalWeight: number;
  try {
    const parcel = await cartParcel(lines);
    totalWeight = parcel.weight;
    shipping = await resolveShipping(d.zip, parcel.weight, d.courier, parcel.value, place.regencyCode);
  } catch (e) {
    if (e instanceof ShippingError) return { error: e.message, refreshShipping: true };
    throw e;
  }
  if (shipping.cost !== d.shippingCost) {
    return {
      error: `Tarif ongkir berubah menjadi ${formatRupiah(shipping.cost)}. Periksa totalnya lalu tekan Buat Pesanan lagi.`,
      refreshShipping: true,
    };
  }

  // Lepaskan stok dari pesanan kedaluwarsa dulu agar tidak salah menolak pembeli.
  await runExpiry();

  let order;
  try {
    order = await createOrder({
      userId: user.id,
      lines,
      address: { recipient: d.recipient, phone: d.phone, street: d.street, village: place.village, district: place.district, city: place.city, province: place.province, zip: d.zip },
      shipping: { name: shipping.name, cost: shipping.cost },
      totalWeight,
      paymentMethod: d.payment,
      promoCode: d.promo,
    });
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message };
    throw e;
  }

  // Simpan alamat terakhir untuk checkout berikutnya.
  const addr = {
    recipient: d.recipient,
    phone: d.phone,
    street: d.street,
    province: place.province,
    city: place.city,
    district: place.district,
    village: place.village,
    villageCode: place.villageCode,
    zip: d.zip,
  };
  const existing = await db.address.findFirst({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });
  if (existing) await db.address.update({ where: { id: existing.id }, data: addr });
  else await db.address.create({ data: { userId: user.id, ...addr } });

  const payUrl = `/pesanan/${order.code}`;
  // Payment gateway (Midtrans) dinonaktifkan. Untuk mengaktifkan lagi: ubah payUrl menjadi `let`, buka komentar blok ini,
  // tambahkan "GATEWAY" ke enum `payment` dan CHECKOUT_PAYMENTS, serta impor GatewayError, createInvoice, cancelOrder, SITE.
  // if (d.payment === "GATEWAY") {
  //   try {
  //     const invoice = await createInvoice({
  //       externalId: order.code,
  //       amount: order.total,
  //       description: `Pesanan ${order.code} - ${SITE.name}`,
  //       email: order.user.email,
  //       name: d.recipient,
  //       phone: d.phone,
  //       // Invoice berakhir sedikit sebelum pesanan kedaluwarsa agar tidak ada pembayaran setelah stok dilepas.
  //       durationSeconds: Math.max(1800, Math.floor((order.expiresAt.getTime() - Date.now()) / 1000) - 120),
  //       successUrl: `${SITE.url}/pesanan/${order.code}?bayar=ok`,
  //       failureUrl: `${SITE.url}/pesanan/${order.code}`,
  //     });
  //     await db.order.update({ where: { id: order.id }, data: { gatewayInvoiceId: invoice.id, gatewayUrl: invoice.url } });
  //     payUrl = invoice.url;
  //   } catch (e) {
  //     // Tanpa invoice pesanan tidak bisa dibayar: batalkan dan kembalikan stok agar pembeli bisa mencoba lagi.
  //     await cancelOrder(order.id, null, "Gagal membuat invoice pembayaran");
  //     if (e instanceof GatewayError) return { error: e.message };
  //     throw e;
  //   }
  // }

  await writeCart([]);
  after(() => emailOrderCreated(order, order.expiresAt));
  // Keranjang akun disimpan di database (bukan cookie), jadi header perlu dirender ulang agar badge keranjang kosong.
  refresh();
  redirect(payUrl);
}
