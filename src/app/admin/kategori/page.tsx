import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { AdminSkeleton } from "@/components/admin-skeleton";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { createCategory, deleteCategory, updateCategory } from "./actions";

export const metadata: Metadata = { title: "Kategori" };

const input = "h-11 w-full rounded-lg border border-line bg-white px-3 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15";
const ghost = "rounded-full border border-foreground px-4 py-1.5 text-xs font-bold hover:bg-header";

export default function AdminKategoriPage(props: PageProps<"/admin/kategori">) {
  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Kategori</h1>
          <p className="text-sm text-muted">Kelompok barang yang tampil di “Cari per kategori” dan filter produk.</p>
        </div>
        <Link href="/admin/kategori" className="rounded-full bg-foreground px-5 py-2 text-sm font-bold text-white hover:bg-black">
          + Kategori baru
        </Link>
      </div>
      <Suspense fallback={<AdminSkeleton />}>
        <Isi searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function Isi({ searchParams }: Pick<PageProps<"/admin/kategori">, "searchParams">) {
  await requireAdmin();
  const { galat, tersimpan, terhapus, ubah, hapus } = await searchParams;
  const categories = await db.category.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { products: true } } } });
  const editing = typeof ubah === "string" ? categories.find((c) => c.id === ubah) : undefined;
  const deleting = typeof hapus === "string" ? categories.find((c) => c.id === hapus) : undefined;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
      <div className="overflow-hidden rounded-card border border-line">
        <ul className="divide-y divide-line">
          {categories.map((c) => {
            const active = c.id === editing?.id || c.id === deleting?.id;
            return (
              <li key={c.id} className={`flex flex-wrap items-center gap-4 p-4 ${active ? "bg-header/60" : ""}`}>
                <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-header">
                  <Image src={c.icon} alt="" fill sizes="56px" className="object-contain p-1" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-bold">{c.name}</div>
                  <div className="text-xs text-muted">
                    /produk?kategori={c.slug} · {c._count.products} produk
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/kategori?ubah=${c.id}`} className={ghost}>
                    Ubah
                  </Link>
                  <Link href={`/admin/kategori?hapus=${c.id}`} className={`${ghost} border-danger text-danger hover:bg-danger/10`}>
                    Hapus
                  </Link>
                </div>
              </li>
            );
          })}
          {categories.length === 0 && <li className="p-6 text-center text-sm text-muted">Belum ada kategori.</li>}
        </ul>
      </div>

      <div className="grid gap-4 lg:sticky lg:top-6">
        {tersimpan && (
          <p role="status" className="rounded-lg bg-success/10 px-4 py-3 text-sm font-bold text-success">
            Kategori disimpan.
          </p>
        )}
        {terhapus && (
          <p role="status" className="rounded-lg bg-success/10 px-4 py-3 text-sm font-bold text-success">
            Kategori dihapus.
          </p>
        )}
        {typeof galat === "string" && (
          <p role="alert" className="rounded-lg bg-danger/10 px-4 py-3 text-sm font-bold text-danger">
            {galat}
          </p>
        )}

        {deleting ? (
          <form action={deleteCategory} className="grid gap-3 rounded-card border border-danger/40 p-5">
            <h2 className="text-xl font-bold">Hapus kategori</h2>
            <input type="hidden" name="id" value={deleting.id} />
            <p className="text-sm">
              Hapus <b>{deleting.name}</b>? Tindakan ini tidak bisa dibatalkan.
            </p>
            {deleting._count.products > 0 && (
              <label className="grid gap-1.5 text-sm">
                <span className="font-bold">Pindahkan {deleting._count.products} produk ke</span>
                <select name="moveTo" required defaultValue="" className={input}>
                  <option value="" disabled>
                    Pilih kategori tujuan…
                  </option>
                  {categories
                    .filter((c) => c.id !== deleting.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </label>
            )}
            <div className="flex items-center gap-4">
              <button className="rounded-full bg-danger px-6 py-2.5 font-bold text-white hover:opacity-90">Ya, hapus</button>
              <Link href="/admin/kategori" className="text-sm font-bold text-brand hover:underline">
                Batal
              </Link>
            </div>
          </form>
        ) : (
          <form key={editing?.id ?? "baru"} action={editing ? updateCategory : createCategory} className="grid gap-4 rounded-card border border-line p-5">
            <h2 className="text-xl font-bold">{editing ? "Ubah kategori" : "Kategori baru"}</h2>
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <label className="grid gap-1.5 text-sm">
              <span className="font-bold">Nama kategori</span>
              <input name="name" defaultValue={editing?.name} required minLength={2} maxLength={40} placeholder="mis. Buku" className={input} />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-bold">Slug (URL)</span>
              <input name="slug" defaultValue={editing?.slug} maxLength={40} placeholder="buku" className={input} />
              <span className="text-xs text-muted">Kosongkan agar dibuat dari nama.{editing ? " Mengubah slug mengubah alamat filter kategori." : ""}</span>
            </label>
            <div className="grid gap-1.5 text-sm">
              <span className="font-bold">Gambar{editing ? " (kosongkan bila tidak diganti)" : " (opsional)"}</span>
              {editing && (
                <span className="relative size-20 overflow-hidden rounded-lg bg-header">
                  <Image src={editing.icon} alt={`Gambar ${editing.name} saat ini`} fill sizes="80px" className="object-contain p-1" />
                </span>
              )}
              <input
                name="icon"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                aria-label="Gambar kategori"
                className="w-full rounded-lg border-2 border-dashed border-line bg-header/50 p-3 text-sm text-muted file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-foreground file:px-4 file:py-1.5 file:text-sm file:font-bold file:text-white hover:file:bg-black"
              />
              <span className="text-xs text-muted">Foto barang tanpa latar (PNG/WebP) paling bagus, maks 5 MB.</span>
            </div>
            <div className="flex items-center gap-4">
              <button className="rounded-full bg-foreground px-6 py-2.5 font-bold text-white hover:bg-black">{editing ? "Simpan perubahan" : "Tambah kategori"}</button>
              {editing && (
                <Link href="/admin/kategori" className="text-sm font-bold text-brand hover:underline">
                  Batal
                </Link>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
