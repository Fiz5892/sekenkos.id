import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { after } from "next/server";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { addToCart, buyNow } from "@/app/(shop)/keranjang/actions";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/format";
import { runExpiry } from "@/lib/maintenance";
import { CONDITION_HINT, CONDITION_LABEL, SITE } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/produk/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await db.product.findFirst({
    where: { slug, status: "ACTIVE" },
    select: { name: true, description: true, images: true },
  });
  if (!p) return { title: "Produk tidak ditemukan" };
  return {
    title: p.name,
    description: p.description.slice(0, 160),
    openGraph: { title: p.name, description: p.description.slice(0, 160), images: p.images.slice(0, 1) },
  };
}

export default function ProductPage(props: PageProps<"/produk/[slug]">) {
  return (
    <div className="mx-auto w-[min(1100px,100%-32px)] py-8">
      <Suspense fallback={<div className="h-[480px] animate-pulse rounded-card bg-header" aria-label="Memuat produk" />}>
        <Detail params={props.params} />
      </Suspense>
    </div>
  );
}

async function Detail({ params }: Pick<PageProps<"/produk/[slug]">, "params">) {
  const { slug } = await params;
  // Bebaskan stok dari pesanan kedaluwarsa tanpa menunda respons.
  after(() => runExpiry());
  const p = await db.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: { category: true },
  });
  if (!p) notFound();

  const related = await db.product.findMany({
    where: { status: "ACTIVE", categoryId: p.categoryId, id: { not: p.id } },
    orderBy: { popularity: "desc" },
    take: 4,
    include: { category: { select: { name: true } } },
  });

  const soldOut = p.stock === 0;
  const chat = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(`Halo sekenkos.id, saya tertarik dengan ${p.name}.`)}`;

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
        <Link href="/" className="hover:underline">Beranda</Link> /{" "}
        <Link href={`/produk?kategori=${p.category.slug}`} className="hover:underline">{p.category.name}</Link> / {p.name}
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery images={p.images} name={p.name} isPhoto={p.isPhoto} />

        <div>
          <h1 className="text-3xl font-semibold">{p.name}</h1>
          <div className="mt-1 text-2xl font-bold text-brand">{formatRupiah(p.price)}</div>
          <p className="mt-4">{p.description}</p>

          <dl className="mt-4 grid grid-cols-[110px_1fr] gap-y-1 text-sm">
            <dt className="text-muted">Kategori</dt><dd>{p.category.name}</dd>
            <dt className="text-muted">Kondisi</dt><dd>{CONDITION_LABEL[p.condition]} <span className="text-muted">— {CONDITION_HINT[p.condition]}</span></dd>
            <dt className="text-muted">Ukuran</dt><dd>{p.size}</dd>
            <dt className="text-muted">Stok</dt><dd>{soldOut ? "Habis terjual" : p.stock <= 2 ? `Tinggal ${p.stock}` : `${p.stock} tersedia`}</dd>
          </dl>

          <form className="mt-6 flex flex-wrap items-center gap-3">
            <input type="hidden" name="productId" value={p.id} />
            <label className="flex items-center gap-2 text-sm">
              Jumlah
              <input
                type="number"
                name="qty"
                defaultValue={1}
                min={1}
                max={Math.max(1, p.stock)}
                disabled={soldOut}
                className="w-16 rounded-md border border-line px-2 py-2"
              />
            </label>
            <button formAction={addToCart} disabled={soldOut} className="rounded-full bg-foreground px-6 py-3 font-bold text-white hover:bg-black disabled:opacity-40">
              Tambah ke Keranjang
            </button>
            <button formAction={buyNow} disabled={soldOut} className="rounded-full border border-foreground px-6 py-3 font-bold hover:bg-header disabled:opacity-40">
              Beli Sekarang
            </button>
          </form>

          <ul className="mt-5 grid gap-1 text-sm text-muted">
            <li>Bayar lewat transfer, lalu konfirmasi via WhatsApp.</li>
            <li>Stok ditahan 24 jam setelah checkout; lewat itu pesanan dibatalkan otomatis.</li>
          </ul>

          <div className="mt-6 flex items-center gap-3 rounded-card bg-header p-4">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-brand font-bold text-white" aria-hidden="true">S</div>
            <div className="text-sm">
              <b>{SITE.name}</b>
              <div className="text-muted">{SITE.address} · Barang sudah dicek &amp; dibersihkan</div>
            </div>
            <a href={chat} target="_blank" rel="noopener noreferrer" className="ml-auto rounded-full border border-foreground px-4 py-1.5 text-sm font-bold hover:bg-white">
              Chat
            </a>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 text-2xl font-bold">Barang serupa</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.map((r) => (
              <ProductCard key={r.id} p={r} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
