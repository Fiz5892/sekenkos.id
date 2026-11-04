import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { AdminSkeleton } from "@/components/admin-skeleton";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { createCategory, deleteCategory, updateCategory } from "./actions";

export const metadata: Metadata = { title: "Kategori" };

const input = "w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-brand";

export default function AdminKategoriPage(props: PageProps<"/admin/kategori">) {
  return (
    <>
      <h1 className="mb-4 text-3xl font-bold">Kategori</h1>
      <Suspense fallback={<AdminSkeleton />}>
        <Isi searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function Isi({ searchParams }: Pick<PageProps<"/admin/kategori">, "searchParams">) {
  await requireAdmin();
  const { galat, tersimpan, ubah } = await searchParams;
  const categories = await db.category.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { products: true } } } });
  const editing = typeof ubah === "string" ? categories.find((c) => c.id === ubah) : undefined;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="overflow-x-auto rounded-card border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-header">
            <tr>
              <th className="p-3">Kategori</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Produk</th>
              <th className="p-3">
                <span className="sr-only">Tindakan</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-t border-line">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-header">
                      <Image src={c.icon} alt="" fill sizes="40px" className="object-contain p-0.5" />
                    </span>
                    <span className="font-bold">{c.name}</span>
                  </div>
                </td>
                <td className="p-3 text-muted">{c.slug}</td>
                <td className="p-3">{c._count.products}</td>
                <td className="p-3">
                  <div className="flex items-center gap-4">
                    <Link href={`/admin/kategori?ubah=${c.id}`} className="rounded-full border border-foreground px-3 py-1 text-xs font-bold hover:bg-header">
                      Ubah
                    </Link>
                    {c._count.products === 0 && (
                      <form action={deleteCategory}>
                        <input type="hidden" name="id" value={c.id} />
                        <button className="text-danger hover:underline">Hapus</button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form key={editing?.id ?? "baru"} action={editing ? updateCategory : createCategory} className="grid h-fit gap-3 rounded-card border border-line p-5">
        <h2 className="text-xl font-bold">{editing ? "Ubah kategori" : "Kategori baru"}</h2>
        {editing && <input type="hidden" name="id" value={editing.id} />}
        {tersimpan && (
          <p role="status" className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
            Kategori disimpan.
          </p>
        )}
        {typeof galat === "string" && (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {galat}
          </p>
        )}
        <label className="grid gap-1 text-sm">
          <span className="font-bold">Nama kategori</span>
          <input name="name" defaultValue={editing?.name} required minLength={2} maxLength={40} className={input} />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-bold">Slug (URL)</span>
          <input name="slug" defaultValue={editing?.slug} maxLength={40} className={input} />
          <span className="text-xs text-muted">Kosongkan agar dibuat dari nama. Mengubah slug mengubah alamat /produk?kategori=…</span>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-bold">Gambar{editing ? " (kosongkan bila tidak diganti)" : " (opsional)"}</span>
          <input name="icon" type="file" accept="image/png,image/jpeg,image/webp" className="text-sm" />
          <span className="text-xs text-muted">Sebaiknya foto barang tanpa latar (PNG/WebP), maks 5 MB. Tampil di bagian “Cari per kategori”.</span>
        </label>
        <div className="flex items-center gap-4">
          <button className="w-fit rounded-full bg-foreground px-6 py-2.5 font-bold text-white hover:bg-black">{editing ? "Simpan perubahan" : "Tambah kategori"}</button>
          {editing && (
            <Link href="/admin/kategori" className="text-sm text-brand hover:underline">
              Batal
            </Link>
          )}
        </div>
      </form>
    </div>
  );
}
