import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { IMAGE_EXT, sniffImage } from "@/lib/image-sniff";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export { MAX_IMAGES_PER_PRODUCT } from "@/lib/storage-limits";

const supabaseConfigured = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * Menyimpan foto produk dan mengembalikan alamat yang dipakai di halaman.
 *  - Supabase Storage (bila SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY diisi): file di bucket publik, service
 *    role key hanya ada di server.
 *  - Tanpa itu: disimpan di database (tabel product_images) dan disajikan lewat /img/[id]. Cukup untuk toko
 *    kecil; pindah ke Supabase Storage bila fotonya banyak.
 * Jenis file ditentukan dari isinya, bukan dari klaim browser. Melempar Error berpesan Indonesia bila ditolak.
 */
export async function saveProductImage(file: File): Promise<string> {
  if (file.size === 0) throw new Error("File foto kosong.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error(`Ukuran foto "${file.name}" melebihi 5 MB.`);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffImage(bytes);
  if (!type) throw new Error(`"${file.name}" bukan foto JPG, PNG, atau WebP yang valid.`);

  if (supabaseConfigured()) {
    const base = process.env.SUPABASE_URL!.replace(/\/$/, "");
    const bucket = process.env.SUPABASE_BUCKET ?? "products";
    const path = `${randomUUID()}.${IMAGE_EXT[type]}`;
    const res = await fetch(`${base}/storage/v1/object/${bucket}/${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": type, "x-upsert": "false" },
      body: Buffer.from(bytes),
    });
    if (!res.ok) throw new Error(`Gagal mengunggah foto ke penyimpanan (${res.status}).`);
    return `${base}/storage/v1/object/public/${bucket}/${path}`;
  }

  const row = await db.productImage.create({ data: { data: Buffer.from(bytes), contentType: type, size: bytes.length }, select: { id: true } });
  return `/img/${row.id}`;
}

/** Menghapus foto yang disimpan di database bila sudah tidak dipakai produk (foto di Supabase dibiarkan). */
export async function deleteStoredImages(urls: string[]) {
  const ids = urls.map((u) => /^\/img\/([a-z0-9]+)$/.exec(u)?.[1]).filter((id): id is string => Boolean(id));
  if (ids.length) await db.productImage.deleteMany({ where: { id: { in: ids } } });
}
