// Keranjang disimpan di cookie (daftar { id, qty }) sehingga pengunjung tanpa akun pun bisa belanja
// dan isinya otomatis ikut saat login. Cookie hanya berisi id dan jumlah; harga, stok, dan status
// produk SELALU dibaca ulang dari database oleh server — nilai dari browser tidak dipercaya.

export const CART_COOKIE = "ply_cart";
export const CART_MAX_LINES = 30;
export const CART_MAX_QTY = 20;

export type CartLine = { id: string; qty: number };

const clampQty = (n: number) => Math.min(Math.max(Math.trunc(n), 1), CART_MAX_QTY);

export function parseCart(raw: string | undefined): CartLine[] {
  if (!raw) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];

  const merged = new Map<string, number>();
  for (const item of data) {
    if (typeof item !== "object" || item === null) continue;
    const { id, qty } = item as Record<string, unknown>;
    if (typeof id !== "string" || id.length === 0 || id.length > 40) continue;
    if (typeof qty !== "number" || !Number.isFinite(qty) || qty < 1) continue;
    merged.set(id, clampQty((merged.get(id) ?? 0) + qty));
    if (merged.size >= CART_MAX_LINES) break;
  }
  return [...merged].map(([id, qty]) => ({ id, qty }));
}

export function serializeCart(lines: CartLine[]): string {
  return JSON.stringify(lines);
}

/** Menambah jumlah; `max` (stok) membatasi total per barang. */
export function addLine(lines: CartLine[], id: string, qty: number, max = CART_MAX_QTY): CartLine[] {
  const limit = Math.min(max, CART_MAX_QTY);
  const existing = lines.find((l) => l.id === id);
  if (existing) return lines.map((l) => (l.id === id ? { id, qty: Math.min(l.qty + clampQty(qty), limit) } : l));
  if (lines.length >= CART_MAX_LINES || limit < 1) return lines;
  return [...lines, { id, qty: Math.min(clampQty(qty), limit) }];
}

/** Mengatur jumlah; 0 atau kurang menghapus barang. */
export function setLineQty(lines: CartLine[], id: string, qty: number, max = CART_MAX_QTY): CartLine[] {
  if (qty < 1) return lines.filter((l) => l.id !== id);
  return lines.map((l) => (l.id === id ? { id, qty: Math.min(clampQty(qty), Math.min(max, CART_MAX_QTY)) } : l));
}

export function removeLine(lines: CartLine[], id: string): CartLine[] {
  return lines.filter((l) => l.id !== id);
}

export const cartCount = (lines: CartLine[]) => lines.reduce((sum, l) => sum + l.qty, 0);
