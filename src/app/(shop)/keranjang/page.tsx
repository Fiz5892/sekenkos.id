import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { loadCart } from "@/lib/cart-server";
import { formatRupiah } from "@/lib/format";
import { getSession } from "@/lib/session";
import { CONDITION_LABEL } from "@/lib/site";
import { removeFromCart, updateQuantity } from "./actions";

export const metadata: Metadata = { title: "Shopping bag" };

export default function KeranjangPage() {
  return (
    <div className="mx-auto w-[min(1100px,100%-32px)] py-8">
      <h1 className="mb-6 text-3xl font-bold">Shopping bag</h1>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-card bg-header" aria-label="Memuat keranjang" />}>
        <Cart />
      </Suspense>
    </div>
  );
}

async function Cart() {
  const session = await getSession();
  if ((session?.user as { role?: string })?.role === "ADMIN") redirect("/admin");
  const { items, subtotal, buyableCount } = await loadCart();

  if (items.length === 0) {
    return (
      <div className="rounded-card bg-header p-10 text-center text-muted">
        Keranjangmu masih kosong.
        <div className="mt-4">
          <Link href="/produk" className="inline-flex rounded-full bg-foreground px-6 py-2.5 font-bold text-white hover:bg-black">
            Mulai belanja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <ul className="grid gap-4">
        {items.map(({ product: p, qty, requested, available }) => (
          <li key={p.id} className="grid grid-cols-[88px_1fr_auto] gap-4 rounded-card border border-line p-4">
            <Link href={`/produk/${p.slug}`} className={`relative block aspect-square overflow-hidden rounded-lg ${p.isPhoto ? "" : "bg-brand-soft/40"}`}>
              <Image src={p.images[0]} alt="" fill sizes="88px" className={p.isPhoto ? "object-cover" : "object-contain p-2"} />
            </Link>
            <div>
              <h2 className="font-medium">
                <Link href={`/produk/${p.slug}`} className="hover:underline">
                  {p.name}
                </Link>
              </h2>
              <p className="text-[13px] text-muted">
                {CONDITION_LABEL[p.condition]} · {p.size}
              </p>
              {available === 0 ? (
                <p className="mt-2 text-sm font-bold text-danger">Barang ini sudah terjual dan tidak ikut dihitung.</p>
              ) : (
                <>
                  <div className="mt-2 flex items-center gap-1" role="group" aria-label={`Jumlah ${p.name}`}>
                    <QtyButton productId={p.id} qty={qty - 1} label="Kurangi" symbol="−" />
                    <span className="w-8 text-center" aria-live="polite">
                      {qty}
                    </span>
                    <QtyButton productId={p.id} qty={qty + 1} label="Tambah" symbol="+" disabled={qty >= available} />
                  </div>
                  {requested > available && <p className="mt-1 text-xs text-muted">Stok tersisa {available}, jumlah disesuaikan.</p>}
                </>
              )}
            </div>
            <div className="text-right">
              <b>{formatRupiah(p.price * qty)}</b>
              <form action={removeFromCart} className="mt-1">
                <input type="hidden" name="productId" value={p.id} />
                <button className="text-sm text-brand hover:underline">Hapus</button>
              </form>
            </div>
          </li>
        ))}
      </ul>

      <aside className="h-fit rounded-card border border-line p-5">
        <h2 className="text-xl font-bold">Ringkasan</h2>
        <div className="mt-3 flex justify-between text-sm">
          <span>Subtotal ({items.reduce((n, i) => n + i.qty, 0)} barang)</span>
          <span>{formatRupiah(subtotal)}</span>
        </div>
        <div className="mt-3 flex justify-between border-t border-line pt-3 text-lg font-bold">
          <span>Total</span>
          <span>{formatRupiah(subtotal)}</span>
        </div>
        <p className="mt-2 text-xs text-muted">Ongkir dan kode promo dihitung di langkah checkout.</p>
        {buyableCount > 0 ? (
          <Link href="/checkout" className="mt-4 block rounded-full bg-foreground py-3 text-center font-bold text-white hover:bg-black">
            Checkout
          </Link>
        ) : (
          <p className="mt-4 text-sm text-danger">Tidak ada barang yang bisa dibeli.</p>
        )}
        <Link href="/produk" className="mt-2 block rounded-full border border-foreground py-3 text-center font-bold hover:bg-header">
          Lanjut belanja
        </Link>
      </aside>
    </div>
  );
}

function QtyButton({ productId, qty, label, symbol, disabled }: { productId: string; qty: number; label: string; symbol: string; disabled?: boolean }) {
  return (
    <form action={updateQuantity}>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="qty" value={qty} />
      <button aria-label={label} disabled={disabled} className="h-8 w-8 rounded-full border border-line hover:bg-header disabled:opacity-40">
        {symbol}
      </button>
    </form>
  );
}
