import type { Prisma } from "@/generated/prisma/client";
import type { ProductCondition } from "@/generated/prisma/enums";

export const CONDITION_PARAM: Record<string, ProductCondition> = {
  baru: "BARU",
  "seperti-baru": "SEPERTI_BARU",
  "bekas-baik": "BEKAS_BAIK",
};

export const SORTS = {
  terbaru: { label: "Terbaru", orderBy: { createdAt: "desc" } },
  populer: { label: "Popularitas", orderBy: { popularity: "desc" } },
  termurah: { label: "Harga terendah", orderBy: { price: "asc" } },
  termahal: { label: "Harga tertinggi", orderBy: { price: "desc" } },
} as const satisfies Record<string, { label: string; orderBy: Prisma.ProductOrderByWithRelationInput }>;

export type SortKey = keyof typeof SORTS;

export type CatalogQuery = {
  q: string;
  kategori: string;
  kondisi: ProductCondition[];
  ukuran: string[];
  min?: number;
  max?: number;
  urut: SortKey;
};

type RawParams = Record<string, string | string[] | undefined>;

const list = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);
const first = (v: string | string[] | undefined) => list(v)[0]?.trim() ?? "";

function rupiah(v: string | string[] | undefined): number | undefined {
  const s = first(v);
  if (!/^\d{1,9}$/.test(s)) return undefined;
  return Number(s);
}

/** Membaca query string URL secara defensif: nilai tak dikenal diabaikan, bukan menimbulkan error. */
export function parseCatalogQuery(raw: RawParams): CatalogQuery {
  const urut = first(raw.urut);
  return {
    q: first(raw.q).slice(0, 80),
    kategori: first(raw.kategori),
    kondisi: [...new Set(list(raw.kondisi).map((k) => CONDITION_PARAM[k]).filter(Boolean))],
    ukuran: list(raw.ukuran).map((s) => s.trim()).filter(Boolean).slice(0, 20),
    min: rupiah(raw.min),
    max: rupiah(raw.max),
    urut: urut in SORTS ? (urut as SortKey) : "terbaru",
  };
}

export function buildWhere(q: CatalogQuery): Prisma.ProductWhereInput {
  const price: Prisma.IntFilter = {};
  if (q.min !== undefined) price.gte = q.min;
  if (q.max !== undefined) price.lte = q.max;

  return {
    status: "ACTIVE",
    ...(q.kategori && { category: { slug: q.kategori } }),
    ...(q.kondisi.length && { condition: { in: q.kondisi } }),
    ...(q.ukuran.length && { size: { in: q.ukuran } }),
    ...(Object.keys(price).length && { price }),
    ...(q.q && {
      OR: [
        { name: { contains: q.q, mode: "insensitive" } },
        { description: { contains: q.q, mode: "insensitive" } },
        { category: { name: { contains: q.q, mode: "insensitive" } } },
      ],
    }),
  };
}
