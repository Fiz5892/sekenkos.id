import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { Suspense } from "react";
import { ProductCard } from "@/components/product-card";
import { CONDITION_PARAM, SORTS, buildWhere, parseCatalogQuery } from "@/lib/catalog";
import { db } from "@/lib/db";
import { runExpiry } from "@/lib/maintenance";
import { rankSimilar } from "@/lib/similar";
import { CONDITION_LABEL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Semua Produk",
  description: "Jelajahi barang preloved pilihan: pakaian, aksesori, dekorasi, perabot, elektronik, dan kebersihan.",
};

export default function ProdukPage(props: PageProps<"/produk">) {
  return (
    <div className="mx-auto w-[min(1224px,100%-32px)] py-8">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-card bg-header" aria-label="Memuat produk" />}>
        <Catalog searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Catalog({ searchParams }: Pick<PageProps<"/produk">, "searchParams">) {
  const query = parseCatalogQuery(await searchParams);
  // Bebaskan stok dari pesanan kedaluwarsa tanpa menunda respons.
  after(() => runExpiry());
  const where = buildWhere(query);

  const [categories, sizeRows, products] = await Promise.all([
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.product.findMany({
      where: { status: "ACTIVE", ...(query.kategori && { category: { slug: query.kategori } }) },
      distinct: ["size"],
      select: { size: true },
      orderBy: { size: "asc" },
    }),
    db.product.findMany({
      where,
      orderBy: SORTS[query.urut].orderBy,
      take: 60,
      include: { category: { select: { name: true } } },
    }),
  ]);

  // Hasil pencarian kosong atau sedikit: tawarkan barang yang mirip (salah ketik, sinonim, sekategori).
  const similar =
    query.q && products.length < 4
      ? rankSimilar(
          query.q,
          await db.product.findMany({
            where: { status: "ACTIVE", id: { notIn: products.map((p) => p.id) } },
            orderBy: { popularity: "desc" },
            take: 500,
            include: { category: { select: { name: true, slug: true } } },
          }),
          products.length ? 4 : 6,
        )
      : undefined;

  const activeCategory = categories.find((c) => c.slug === query.kategori);
  const title = query.q ? `Hasil pencarian “${query.q}”` : activeCategory ? activeCategory.name : "Semua produk";
  const hasFilter = query.kondisi.length > 0 || query.ukuran.length > 0 || query.min !== undefined || query.max !== undefined;
  const resetHref = query.kategori ? `/produk?kategori=${query.kategori}` : "/produk";

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr] lg:items-start">
      <aside
        aria-label="Filter produk"
        className="lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-6.5rem)] lg:overflow-y-auto lg:pr-3 custom-scrollbar"
      >
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">Kategori</h2>
        <nav className="grid gap-0.5 text-sm">
          <Link href="/produk" className={`rounded-md px-3 py-1.5 hover:bg-header ${!query.kategori ? "bg-header font-bold" : ""}`}>
            Semua produk
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/produk?kategori=${c.slug}`}
              className={`rounded-md px-3 py-1.5 hover:bg-header ${query.kategori === c.slug ? "bg-header font-bold" : ""}`}
            >
              {c.name}
            </Link>
          ))}
        </nav>

        <form action="/produk" className="mt-6 grid gap-5 text-sm">
          {query.q && <input type="hidden" name="q" value={query.q} />}
          {query.kategori && <input type="hidden" name="kategori" value={query.kategori} />}

          <fieldset>
            <legend className="mb-1 font-bold">Harga</legend>
            <div className="grid grid-cols-2 gap-2">
              <input name="min" type="number" min={0} step={1000} inputMode="numeric" placeholder="Min" defaultValue={query.min} aria-label="Harga minimum" className="w-full rounded-md border border-line px-2 py-1.5" />
              <input name="max" type="number" min={0} step={1000} inputMode="numeric" placeholder="Maks" defaultValue={query.max} aria-label="Harga maksimum" className="w-full rounded-md border border-line px-2 py-1.5" />
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-1 font-bold">Kondisi</legend>
            {Object.entries(CONDITION_PARAM).map(([param, value]) => (
              <label key={param} className="flex items-center gap-2 py-0.5">
                <input type="checkbox" name="kondisi" value={param} defaultChecked={query.kondisi.includes(value)} />
                {CONDITION_LABEL[value]}
              </label>
            ))}
          </fieldset>

          <details open={query.ukuran.length > 0}>
            <summary className="cursor-pointer font-bold">
              Ukuran{query.ukuran.length > 0 && ` (${query.ukuran.length})`}
            </summary>
            <div className="mt-1 max-h-56 overflow-y-auto">
              {sizeRows.map(({ size }) => (
                <label key={size} className="flex items-center gap-2 py-0.5">
                  <input type="checkbox" name="ukuran" value={size} defaultChecked={query.ukuran.includes(size)} />
                  {size}
                </label>
              ))}
            </div>
          </details>

          <label className="grid gap-1 font-bold">
            Urutkan
            <select name="urut" defaultValue={query.urut} className="rounded-md border border-line px-2 py-1.5 font-normal">
              {Object.entries(SORTS).map(([key, s]) => (
                <option key={key} value={key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center gap-3">
            <button className="rounded-full bg-foreground px-5 py-2 font-bold text-white hover:bg-black">Terapkan</button>
            {(hasFilter || query.urut !== "terbaru") && (
              <Link href={resetHref} className="text-brand hover:underline">
                Reset filter
              </Link>
            )}
          </div>
        </form>
      </aside>

      <section>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mb-4 mt-1 text-sm text-muted" role="status">
          {products.length} barang
        </p>
        {products.length ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        ) : (
          <div className="rounded-card bg-header p-8 text-center text-muted">
            <p>
              Belum ada barang yang cocok dengan “{query.q || "filter ini"}”. Barang preloved datang dan pergi, jadi coba cek lagi nanti atau{" "}
              <Link href="/produk" className="text-brand underline">
                reset filter
              </Link>
              .
            </p>
            {similar?.suggestion && (
              <p className="mt-2">
                Mungkin maksudmu{" "}
                <Link href={`/produk?q=${encodeURIComponent(similar.suggestion)}`} className="font-bold text-brand underline">
                  {similar.suggestion}
                </Link>
                ?
              </p>
            )}
          </div>
        )}

        {similar && similar.items.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold">{similar.kind === "similar" ? "Mungkin yang kamu cari" : "Barang yang lagi diminati"}</h2>
            <p className="mb-4 mt-1 text-sm text-muted">
              {similar.kind === "similar" ? "Barang dengan nama, jenis, atau kategori yang mirip." : "Belum ada yang mirip, tapi barang ini sering dilihat."}
            </p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {similar.items.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
