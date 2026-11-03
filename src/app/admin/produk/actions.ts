"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAllowedImage } from "@/lib/image-url";
import { requireAdmin } from "@/lib/session";
import { slugify } from "@/lib/slug";
import { MAX_IMAGES_PER_PRODUCT, deleteStoredImages, saveProductImage } from "@/lib/storage";

const text = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : "");

const schema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(120),
  slug: z.string().trim().max(80).optional(),
  categoryId: z.string().min(1, "Pilih kategori."),
  price: z.coerce.number().int("Harga harus bilangan bulat.").min(100, "Harga minimal Rp100.").max(100_000_000),
  condition: z.enum(["BARU", "SEPERTI_BARU", "BEKAS_BAIK"], "Pilih kondisi."),
  size: z.string().trim().min(1, "Ukuran wajib diisi.").max(60),
  stock: z.coerce.number().int("Stok harus bilangan bulat.").min(0, "Stok tidak boleh negatif.").max(1000),
  description: z.string().trim().min(10, "Deskripsi minimal 10 karakter.").max(2000),
  status: z.enum(["ACTIVE", "ARCHIVED"]),
});

function back(path: string, error: string): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}galat=${encodeURIComponent(error)}`);
}

async function save(formData: FormData, id: string | null) {
  await requireAdmin();
  const here = id ? `/admin/produk/${id}` : "/admin/produk/baru";

  const parsed = schema.safeParse({
    name: text(formData.get("name")),
    slug: text(formData.get("slug")) || undefined,
    categoryId: text(formData.get("categoryId")),
    price: text(formData.get("price")),
    condition: text(formData.get("condition")),
    size: text(formData.get("size")),
    stock: text(formData.get("stock")),
    description: text(formData.get("description")),
    status: text(formData.get("status")) || "ACTIVE",
  });
  if (!parsed.success) back(here, parsed.error.issues[0].message);
  const d = parsed.data;

  const slug = slugify(d.slug || d.name);
  if (!slug) back(here, "Slug tidak valid.");

  // Foto yang dipertahankan (urutan = urutan di form). Nilainya divalidasi ulang: permintaan bisa dipalsukan.
  const kept = formData.getAll("images").map((v) => text(v).trim()).filter(Boolean);
  const bad = kept.find((u) => !isAllowedImage(u));
  if (bad) back(here, `Foto tidak diizinkan: ${bad}`);

  const uploads = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (kept.length + uploads.length > MAX_IMAGES_PER_PRODUCT) back(here, `Maksimal ${MAX_IMAGES_PER_PRODUCT} foto per produk.`);
  if (kept.length + uploads.length === 0) back(here, "Tambahkan minimal satu foto.");

  const uploaded: string[] = [];
  try {
    for (const f of uploads) uploaded.push(await saveProductImage(f));
  } catch (e) {
    await deleteStoredImages(uploaded); // jangan tinggalkan foto yatim bila salah satu file ditolak
    back(here, e instanceof Error ? e.message : "Gagal mengunggah foto.");
  }
  const images = [...kept, ...uploaded];

  const clash = await db.product.findUnique({ where: { slug }, select: { id: true } });
  if (clash && clash.id !== id) {
    await deleteStoredImages(uploaded);
    back(here, `Slug "${slug}" sudah dipakai produk lain.`);
  }

  const data = {
    name: d.name,
    slug,
    categoryId: d.categoryId,
    price: d.price,
    condition: d.condition,
    size: d.size,
    stock: d.stock,
    description: d.description,
    images,
    isPhoto: formData.get("isPhoto") === "on",
    status: d.status,
  };

  let previous: string[] = [];
  if (id) previous = (await db.product.findUnique({ where: { id }, select: { images: true } }))?.images ?? [];
  const product = id ? await db.product.update({ where: { id }, data }) : await db.product.create({ data });

  // Foto yang dibuang dari produk ikut dihapus dari database bila memang disimpan di sana.
  await deleteStoredImages(previous.filter((u) => !images.includes(u)));
  redirect(`/admin/produk/${product.id}?tersimpan=1`);
}

export async function createProduct(formData: FormData) {
  await save(formData, null);
}

export async function updateProduct(formData: FormData) {
  const id = text(formData.get("id"));
  if (!id) redirect("/admin/produk");
  await save(formData, id);
}

/** Arsip/aktifkan cepat dari daftar. Produk yang pernah dipesan tidak dihapus agar riwayat tetap utuh. */
export async function toggleArchive(formData: FormData) {
  await requireAdmin();
  const id = text(formData.get("id"));
  const p = await db.product.findUnique({ where: { id }, select: { status: true } });
  if (p) await db.product.update({ where: { id }, data: { status: p.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE" } });
  redirect("/admin/produk");
}
