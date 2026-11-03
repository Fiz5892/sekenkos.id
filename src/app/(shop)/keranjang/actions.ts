"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CART_COOKIE, addLine, parseCart, removeLine, setLineQty } from "@/lib/cart";
import { readCart, writeCart } from "@/lib/cart-server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

const text = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : "");

async function ensureNotAdmin() {
  const session = await getSession();
  if ((session?.user as { role?: string })?.role === "ADMIN") {
    redirect("/admin");
  }
}

async function stockOf(productId: string) {
  const p = await db.product.findFirst({ where: { id: productId, status: "ACTIVE" }, select: { stock: true } });
  return p?.stock ?? 0;
}

export async function addToCart(formData: FormData) {
  await ensureNotAdmin();
  const id = text(formData.get("productId"));
  const qty = Number(text(formData.get("qty")) || 1);
  if (!id || !Number.isFinite(qty)) return;
  await writeCart(addLine(await readCart(), id, qty, await stockOf(id)));
}

export async function buyNow(formData: FormData) {
  await addToCart(formData);
  redirect("/keranjang");
}

export async function updateQuantity(formData: FormData) {
  await ensureNotAdmin();
  const id = text(formData.get("productId"));
  const qty = Number(text(formData.get("qty")));
  if (!id || !Number.isFinite(qty)) return;
  await writeCart(setLineQty(await readCart(), id, qty, await stockOf(id)));
}

export async function removeFromCart(formData: FormData) {
  await ensureNotAdmin();
  const id = text(formData.get("productId"));
  if (!id) return;
  await writeCart(removeLine(await readCart(), id));
}

/**
 * Dipanggil sesaat setelah login/daftar berhasil: memindahkan isi keranjang cookie (milik pengunjung)
 * ke keranjang akun, menjumlahkan barang yang sama dan membatasi sesuai stok, lalu mengosongkan cookie.
 */
export async function mergeGuestCart() {
  const session = await getSession();
  if (!session || (session.user as { role?: string }).role === "ADMIN") return;
  const store = await cookies();
  const guest = parseCart(store.get(CART_COOKIE)?.value);
  if (guest.length === 0) return;

  const products = await db.product.findMany({
    where: { id: { in: guest.map((g) => g.id) }, status: "ACTIVE" },
    select: { id: true, stock: true },
  });
  const stock = new Map(products.map((p) => [p.id, p.stock]));

  let lines = await readCart(); // sudah login, jadi ini keranjang akun
  for (const g of guest) {
    const max = stock.get(g.id);
    if (max) lines = addLine(lines, g.id, g.qty, max);
  }
  await writeCart(lines);
  store.delete(CART_COOKIE);
}
