import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { databaseSsl } from "../src/lib/db-ssl";
import { WEIGHTS, categories, products, promo } from "./seed-data";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, ssl: databaseSsl() }),
});

// Aman dijalankan berulang: memakai upsert berdasarkan slug/kode. Kategori yang sudah ada tidak ditimpa (nama dan gambar bisa diubah admin).
async function main() {
  const catIds = new Map<string, string>();
  for (const c of categories) {
    const row = await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
    catIds.set(c.slug, row.id);
  }

  for (const p of products) {
    const data = {
      name: p.name,
      categoryId: catIds.get(p.category)!,
      price: p.price,
      condition: p.condition,
      size: p.size,
      description: p.description,
      images: [p.image],
      isPhoto: p.isPhoto ?? false,
      popularity: p.popularity,
      weightGrams: WEIGHTS[p.slug] ?? 500,
      createdAt: new Date(p.createdAt),
    };
    // Stok dan foto hanya diisi saat produk pertama dibuat, agar seed ulang tidak menimpa stok berjalan
    // maupun foto yang sudah diganti admin / dipindah ke Supabase Storage.
    const rest: Partial<typeof data> = { ...data };
    delete rest.images;
    delete rest.isPhoto;
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: rest,
      create: { slug: p.slug, stock: p.stock, ...data },
    });
  }

  await prisma.promo.upsert({ where: { code: promo.code }, update: promo, create: promo });

  console.log(`Seed selesai: ${categories.length} kategori, ${products.length} produk, 1 promo.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
