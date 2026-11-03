import Image from "next/image";
import Link from "next/link";
import { formatRupiah } from "@/lib/format";
import { CONDITION_LABEL } from "@/lib/site";
import type { ProductCondition } from "@/generated/prisma/enums";

export type ProductCardData = {
  slug: string;
  name: string;
  price: number;
  condition: ProductCondition;
  size: string;
  stock: number;
  images: string[];
  isPhoto: boolean;
  category: { name: string };
};

export function ProductCard({ p }: { p: ProductCardData }) {
  const soldOut = p.stock === 0;
  return (
    <article className="reveal lift group relative flex flex-col rounded-card border border-line bg-white transition-transform duration-200 hover:-translate-y-1">
      <span
        className={`absolute left-2.5 top-2.5 z-10 rounded-full px-2.5 py-0.5 text-xs font-bold ${
          soldOut ? "bg-foreground text-white" : "bg-header-contrast text-foreground"
        }`}
      >
        {soldOut ? "Terjual" : CONDITION_LABEL[p.condition]}
      </span>
      {/* Tautan gambar hanya pelengkap visual; tautan judul di bawah (stretched link) yang diakses keyboard/pembaca layar. */}
      <Link href={`/produk/${p.slug}`} tabIndex={-1} aria-hidden="true" className={`relative block aspect-square overflow-hidden rounded-t-card ${p.isPhoto ? "" : "bg-brand-soft/40"}`}>
        <Image
          src={p.images[0]}
          alt={p.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className={`transition-transform duration-300 group-hover:scale-[1.03] ${p.isPhoto ? "object-cover" : "object-contain p-6"} ${soldOut ? "opacity-50 grayscale" : ""}`}
        />
      </Link>
      <div className="grid gap-1 p-3.5">
        <h3 className="line-clamp-2 font-sans text-base font-semibold leading-snug">
          <Link href={`/produk/${p.slug}`} className="after:absolute after:inset-0 hover:underline">
            {p.name}
          </Link>
        </h3>
        <div className="text-lg font-bold">{formatRupiah(p.price)}</div>
        <div className="text-[13px] text-muted">
          {p.category.name} · {p.size}
        </div>
      </div>
    </article>
  );
}
