import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { SITE } from "@/lib/site";

const STATIC = ["", "/produk", "/tentang", "/faq", "/kontak", "/lacak", "/syarat", "/privasi"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Daftar produk berubah-ubah; dibaca saat diminta (bukan saat build) agar build tidak butuh database.
  await connection();
  const products = await db.product.findMany({ where: { status: "ACTIVE" }, select: { slug: true, updatedAt: true } });
  return [
    ...STATIC.map((p) => ({ url: `${SITE.url}${p}` })),
    ...products.map((p) => ({ url: `${SITE.url}/produk/${p.slug}`, lastModified: p.updatedAt })),
  ];
}
