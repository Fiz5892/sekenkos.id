"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { slugify } from "@/lib/slug";
import { deleteStoredImages, saveProductImage } from "@/lib/storage";

const text = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : "");

// Gambar bawaan untuk kategori tanpa foto; beranda memakai ilustrasi sendiri bila slug-nya dikenal.
const DEFAULT_ICON = "/assets/bucket.png";

const schema = z.object({
  name: z.string().trim().min(2, "Nama kategori minimal 2 karakter.").max(40, "Nama kategori maksimal 40 karakter."),
  slug: z.string().trim().max(40).optional(),
});

function back(error: string, id?: string, hapus?: string): never {
  redirect(`/admin/kategori?galat=${encodeURIComponent(error)}${id ? `&ubah=${id}` : ""}${hapus ? `&hapus=${hapus}` : ""}`);
}

async function parse(formData: FormData, id?: string) {
  const parsed = schema.safeParse({ name: text(formData.get("name")), slug: text(formData.get("slug")) || undefined });
  if (!parsed.success) back(parsed.error.issues[0].message, id);
  const slug = slugify(parsed.data.slug || parsed.data.name);
  if (!slug) back("Slug tidak valid.", id);
  const clash = await db.category.findUnique({ where: { slug }, select: { id: true } });
  if (clash && clash.id !== id) back(`Slug "${slug}" sudah dipakai kategori lain.`, id);
  return { name: parsed.data.name, slug };
}

async function upload(formData: FormData, id?: string): Promise<string | null> {
  const file = formData.get("icon");
  if (!(file instanceof File) || file.size === 0) return null;
  try {
    return await saveProductImage(file);
  } catch (e) {
    back(e instanceof Error ? e.message : "Gagal mengunggah gambar.", id);
  }
}

export async function createCategory(formData: FormData) {
  await requireAdmin();
  const data = await parse(formData);
  const icon = await upload(formData);
  await db.category.create({ data: { ...data, icon: icon ?? DEFAULT_ICON } });
  redirect("/admin/kategori?tersimpan=1");
}

export async function updateCategory(formData: FormData) {
  await requireAdmin();
  const id = text(formData.get("id"));
  const current = await db.category.findUnique({ where: { id }, select: { icon: true } });
  if (!current) redirect("/admin/kategori");
  const data = await parse(formData, id);
  const icon = await upload(formData, id);
  await db.category.update({ where: { id }, data: { ...data, ...(icon ? { icon } : {}) } });
  if (icon) await deleteStoredImages([current.icon]);
  redirect("/admin/kategori?tersimpan=1");
}

/**
 * Menghapus kategori. Bila masih punya produk, produknya harus dipindahkan ke kategori lain (moveTo) dalam satu
 * transaksi yang sama, supaya tidak ada produk tanpa kategori.
 */
export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = text(formData.get("id"));
  const moveTo = text(formData.get("moveTo"));
  const cat = await db.category.findUnique({ where: { id }, select: { icon: true, name: true, _count: { select: { products: true } } } });
  if (!cat) redirect("/admin/kategori");

  const count = cat._count.products;
  if (count > 0) {
    if (!moveTo || moveTo === id) back(`Pilih kategori tujuan untuk ${count} produk di "${cat.name}".`, undefined, id);
    if (!(await db.category.findUnique({ where: { id: moveTo }, select: { id: true } }))) back("Kategori tujuan tidak ditemukan.", undefined, id);
    await db.$transaction([db.product.updateMany({ where: { categoryId: id }, data: { categoryId: moveTo } }), db.category.delete({ where: { id } })]);
  } else {
    await db.category.delete({ where: { id } });
  }
  await deleteStoredImages([cat.icon]);
  redirect("/admin/kategori?terhapus=1");
}
