import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { OrderJourney } from "@/components/order-journey";
import { ProductCard } from "@/components/product-card";
import { db } from "@/lib/db";

const STEPS = [
  ["Pilih barang", "Foto dan kondisi ditulis apa adanya. Kalau ragu, tanya lewat Chat di halaman produk."],
  ["Checkout", "Stok langsung ditahan untukmu selama 24 jam. Barang preloved biasanya cuma satu."],
  ["Bayar, lalu kabari", "Pilih transfer bank, e-wallet, atau QRIS, lalu kirim bukti lewat WhatsApp."],
  ["Kami kirim", "Setelah pembayaran dicek, barang dikemas dan nomor resi muncul di halaman pesananmu."],
] as const;

export default function HomePage() {
  return (
    <>
      <section className="overflow-x-clip bg-hero">
        <div className="mx-auto grid w-[min(1224px,100%-32px)] items-center gap-10 py-12 md:grid-cols-[1.1fr_1fr] md:py-16">
          <div className="intro">
            <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
              Barang bekas layak pakai, dari isi lemari sampai isi kamar kos.
            </h1>
            <p className="mt-4 max-w-md text-lg text-foreground/75">
              Dicek satu per satu, difoto apa adanya, dan harganya masuk akal untuk kantong mahasiswa.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href="/produk?urut=terbaru" className="inline-flex rounded-full bg-foreground px-7 py-3 font-bold text-white hover:bg-black">
                Lihat barang terbaru
              </Link>
              <a
                href="#cara-belanja"
                className="inline-flex rounded-full bg-white px-7 py-3 font-bold text-foreground ring-1 ring-foreground hover:bg-header"
              >
                Cara belanjanya
              </a>
            </div>
          </div>
          <HeroProducts />
        </div>
      </section>

      <Section title="Cari per kategori" href="/produk" linkText="Semua barang →">
        <Suspense fallback={<GridSkeleton count={6} cols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6" />}>
          <Categories />
        </Suspense>
      </Section>

      <Section title="Baru masuk" href="/produk?urut=terbaru" linkText="Lihat semua →">
        <Suspense fallback={<GridSkeleton count={4} cols="grid-cols-2 lg:grid-cols-4" />}>
          <ProductList order="newest" />
        </Suspense>
      </Section>

      <Section title="Paling diminati" href="/produk?urut=populer" linkText="Lihat semua →">
        <Suspense fallback={<GridSkeleton count={4} cols="grid-cols-2 lg:grid-cols-4" />}>
          <ProductList order="popular" />
        </Suspense>
      </Section>

      <section id="cara-belanja" className="mx-auto w-[min(1224px,100%-32px)] scroll-mt-24 py-12">
        <h2 className="mb-6 text-2xl font-bold">Cara belanja di sini</h2>
        <OrderJourney steps={STEPS} />
      </section>
    </>
  );
}

/*
 * Komposisi produk di hero: foto tanpa latar disusun bebas di atas blob pasir, dengan ukuran berbeda
 * (kursi & hoodie besar, rice cooker & tas sedang, lampu kecil) dan sedikit bertumpuk agar ada kedalaman.
 * Posisi dalam persen terhadap kotak, jadi proporsinya sama di desktop maupun HP.
 */
const HERO_PRODUCTS: { src: string; w: number; h: number; alt: string; pos: React.CSSProperties; z: number; drift?: boolean }[] = [
  { src: "/assets/hero/chair.webp", w: 396, h: 600, alt: "Kursi kayu dengan sandaran rotan", pos: { left: "40%", top: "4%", width: "38%" }, z: 1 },
  { src: "/assets/hero/lamp.webp", w: 404, h: 510, alt: "Lampu meja kuningan", pos: { left: "9%", top: "13%", width: "27%" }, z: 1, drift: true },
  { src: "/assets/hero/tote.webp", w: 384, h: 706, alt: "Tote bag kanvas", pos: { right: "1%", top: "30%", width: "19%" }, z: 2, drift: true },
  { src: "/assets/hero/hoodie.webp", w: 757, h: 532, alt: "Hoodie rajut terlipat", pos: { left: "0%", bottom: "7%", width: "55%" }, z: 3 },
  { src: "/assets/hero/ricecooker.webp", w: 357, h: 322, alt: "Rice cooker krem", pos: { right: "7%", bottom: "5%", width: "33%" }, z: 4 },
];

function HeroProducts() {
  return (
    <div className="relative mx-auto aspect-[20/21] w-full max-w-[500px] md:mr-0">
      <div
        aria-hidden="true"
        className="intro-media absolute inset-x-[4%] bottom-[6%] top-[3%] rounded-[62%_38%_54%_46%/44%_56%_44%_56%] bg-sandstone/55"
      />
      <ul aria-label="Contoh barang yang dijual">
        {HERO_PRODUCTS.map((p, i) => (
          <li
            key={p.src}
            className="hero-obj absolute"
            style={{ ...p.pos, zIndex: p.z, "--d": `${i * 0.08}s` } as React.CSSProperties}
          >
            <div className={p.drift ? "hero-drift" : undefined}>
              <Image
                src={p.src}
                width={p.w}
                height={p.h}
                alt={p.alt}
                priority={i < 2}
                sizes="(min-width: 768px) 280px, 55vw"
                className="h-auto w-full drop-shadow-[0_16px_14px_rgb(46_38_32/0.2)]"
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Section({ title, href, linkText, children }: { title: string; href: string; linkText: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto w-[min(1224px,100%-32px)] py-8">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Link href={href} className="text-sm text-brand hover:underline">
          {linkText}
        </Link>
      </div>
      {children}
    </section>
  );
}

function GridSkeleton({ count, cols }: { count: number; cols: string }) {
  return (
    <div className={`grid gap-4 ${cols}`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="aspect-[4/5] animate-pulse rounded-card bg-header" />
      ))}
    </div>
  );
}

async function Categories() {
  const categories = await db.category.findMany({ orderBy: { name: "asc" } });
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
      {categories.map((c) => (
        <li key={c.id}>
          <Link
            href={`/produk?kategori=${c.slug}`}
            className="reveal group relative flex aspect-square flex-col justify-end overflow-hidden rounded-card bg-header p-3 ring-1 sm:aspect-[4/5] sm:p-4 ring-line/70 transition-transform duration-300 hover:-translate-y-1"
          >
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-[42%] aspect-square w-[82%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-header-contrast transition-transform duration-500 group-hover:scale-110"
            />
            <span className="absolute inset-x-[15%] bottom-[30%] top-[12%] transition-transform duration-500 group-hover:-translate-y-1.5 group-hover:scale-105">
              <Image
                src={c.icon}
                alt=""
                fill
                sizes="(min-width: 1024px) 160px, (min-width: 640px) 28vw, 40vw"
                className="object-contain drop-shadow-[0_12px_10px_rgb(46_38_32/0.18)]"
              />
            </span>
            <span className="relative font-serif text-lg font-semibold leading-tight">{c.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

async function ProductList({ order }: { order: "newest" | "popular" }) {
  // "Paling diminati" tidak mengulang barang yang sudah tampil di "Baru masuk".
  const newest =
    order === "popular"
      ? await db.product.findMany({ where: { status: "ACTIVE" }, orderBy: { createdAt: "desc" }, take: 4, select: { id: true } })
      : [];
  const products = await db.product.findMany({
    where: { status: "ACTIVE", id: { notIn: newest.map((n) => n.id) } },
    orderBy: order === "newest" ? { createdAt: "desc" } : { popularity: "desc" },
    take: 4,
    include: { category: { select: { name: true } } },
  });
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} p={p} />
      ))}
    </div>
  );
}
