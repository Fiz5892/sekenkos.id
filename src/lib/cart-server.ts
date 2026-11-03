import "server-only";
import { cookies } from "next/headers";
import { CART_COOKIE, parseCart, serializeCart, type CartLine } from "@/lib/cart";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

/*
 * Dua tempat penyimpanan keranjang, dipilih menurut status login:
 *  - Pengunjung (belum login): cookie di browser ini. Cocok untuk belanja tanpa akun.
 *  - Sudah login: tabel cart_items milik akun. Keranjang ikut ke perangkat lain dan tidak bocor ke
 *    orang lain yang memakai browser yang sama setelah logout.
 * Saat login/daftar, isi cookie digabung ke keranjang akun lalu cookie dikosongkan (mergeGuestCart).
 */

export async function readCart(): Promise<CartLine[]> {
  const session = await getSession();
  if (session) {
    if ((session.user as { role?: string }).role === "ADMIN") return [];
    const rows = await db.cartItem.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "asc" } });
    return rows.map((r) => ({ id: r.productId, qty: r.qty }));
  }
  return parseCart((await cookies()).get(CART_COOKIE)?.value);
}

export async function writeCart(lines: CartLine[]) {
  const session = await getSession();
  if (session) {
    if ((session.user as { role?: string }).role === "ADMIN") return;
    const userId = session.user.id;
    const ops = [db.cartItem.deleteMany({ where: { userId } })];
    if (lines.length > 0) {
      ops.push(
        db.cartItem.createMany({
          data: lines.map((l) => ({ userId, productId: l.id, qty: l.qty })),
        })
      );
    }
    await db.$transaction(ops);
    return;
  }
  (await cookies()).set(CART_COOKIE, serializeCart(lines), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

/**
 * Mengubah isi keranjang menjadi rincian memakai data terbaru dari database.
 * Barang yang sudah diarsipkan/habis ditandai `unavailable`, dan jumlah dibatasi sesuai stok.
 */
export async function loadCart() {
  const lines = await readCart();
  const products = await db.product.findMany({
    where: { id: { in: lines.map((l) => l.id) } },
    include: { category: { select: { name: true } } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const items = lines.flatMap((l) => {
    const product = byId.get(l.id);
    if (!product) return [];
    const available = product.status === "ACTIVE" ? product.stock : 0;
    return [{ product, requested: l.qty, qty: Math.min(l.qty, available), available }];
  });

  const buyable = items.filter((i) => i.qty > 0);
  const subtotal = buyable.reduce((sum, i) => sum + i.product.price * i.qty, 0);
  return { items, subtotal, buyableCount: buyable.length };
}
