// Menyiapkan Supabase Storage untuk foto produk:  npm run storage:setup
//  1. Membuat bucket publik (default "products") bila belum ada: hanya JPG/PNG/WebP, maksimal 2 MB per file.
//  2. Memindahkan foto yang sudah terpasang ke bucket dan memperbarui alamatnya di database:
//     file /assets/produk/*.jpg (foto contoh bawaan) dan foto unggahan admin yang tersimpan di tabel product_images.
// Aman dijalankan berulang. Butuh SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env (kunci ini hanya untuk server).
import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { databaseSsl } from "../src/lib/db-ssl";

const base = process.env.SUPABASE_URL?.replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_BUCKET ?? "products";
if (!base || !key) {
  console.error("Isi SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env dulu (Supabase > Project Settings > API).");
  process.exit(1);
}

const auth = { Authorization: `Bearer ${key}`, apikey: key };
const publicUrl = (name: string) => `${base}/storage/v1/object/public/${bucket}/${name}`;

async function ensureBucket() {
  const res = await fetch(`${base}/storage/v1/bucket`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({
      id: bucket,
      name: bucket,
      public: true,
      file_size_limit: 2 * 1024 * 1024,
      allowed_mime_types: ["image/jpeg", "image/png", "image/webp"],
    }),
  });
  if (res.ok) return console.log(`Bucket "${bucket}" dibuat (publik).`);
  const body = await res.text();
  if (res.status === 409 || /already exists/i.test(body)) return console.log(`Bucket "${bucket}" sudah ada.`);
  throw new Error(`Gagal membuat bucket (${res.status}): ${body}`);
}

async function upload(name: string, bytes: Uint8Array, type: string) {
  const res = await fetch(`${base}/storage/v1/object/${bucket}/${name}`, {
    method: "POST",
    headers: { ...auth, "Content-Type": type, "x-upsert": "true", "Cache-Control": "max-age=31536000" },
    body: Buffer.from(bytes),
  });
  if (!res.ok) throw new Error(`Gagal mengunggah ${name} (${res.status}): ${await res.text()}`);
  return publicUrl(name);
}

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, ssl: databaseSsl() }),
  });
  try {
    await ensureBucket();
    const products = await prisma.product.findMany({ select: { id: true, slug: true, images: true } });
    let moved = 0;
    for (const p of products) {
      const next: string[] = [];
      let changed = false;
      for (const [i, url] of p.images.entries()) {
        const asset = /^\/assets\/produk\/([\w-]+\.jpg)$/.exec(url);
        const stored = /^\/img\/([a-z0-9]+)$/.exec(url);
        if (asset) {
          const file = await readFile(path.join(process.cwd(), "public", "assets", "produk", asset[1]));
          next.push(await upload(`seed/${asset[1]}`, file, "image/jpeg"));
          changed = true;
        } else if (stored) {
          const row = await prisma.productImage.findUnique({ where: { id: stored[1] } });
          if (!row) {
            next.push(url);
            continue;
          }
          const ext = row.contentType === "image/png" ? "png" : row.contentType === "image/webp" ? "webp" : "jpg";
          next.push(await upload(`${p.slug}-${i + 1}-${row.id}.${ext}`, row.data, row.contentType));
          changed = true;
        } else {
          next.push(url);
        }
      }
      if (changed) {
        await prisma.product.update({ where: { id: p.id }, data: { images: next } });
        moved++;
        console.log(`  ${p.slug}: ${next.length} foto dipindahkan`);
      }
    }
    // Baris product_images yang sudah tidak dipakai produk mana pun boleh dihapus.
    await prisma.$executeRaw`delete from product_images pi where not exists (select 1 from products p where '/img/' || pi.id = any(p.images))`;
    console.log(`Selesai. ${moved} produk diperbarui.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
