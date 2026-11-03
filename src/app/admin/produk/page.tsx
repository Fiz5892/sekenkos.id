import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { AdminSkeleton } from "@/components/admin-skeleton";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/format";
import { requireAdmin } from "@/lib/session";
import { toggleArchive } from "./actions";

export const metadata: Metadata = { title: "Produk" };

export default function AdminProdukPage() {
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Produk</h1>
        <Link href="/admin/produk/baru" className="rounded-full bg-foreground px-5 py-2 text-sm font-bold text-white hover:bg-black">
          + Produk baru
        </Link>
      </div>
      <Suspense fallback={<AdminSkeleton />}>
        <Daftar />
      </Suspense>
    </>
  );
}

async function Daftar() {
  await requireAdmin();
  const products = await db.product.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 200, include: { category: { select: { name: true } } } });

  return (
    <div className="overflow-x-auto rounded-card border border-line">
      <table className="w-full text-left text-sm">
        <thead className="bg-header">
          <tr>
            <th className="p-3">Produk</th>
            <th className="p-3">Kategori</th>
            <th className="p-3">Harga</th>
            <th className="p-3">Stok</th>
            <th className="p-3">Status</th>
            <th className="p-3">
              <span className="sr-only">Tindakan</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-t border-line">
              <td className="p-3">
                <div className="flex items-center gap-3">
                  <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-header">
                    <Image src={p.images[0]} alt="" fill sizes="40px" className="object-cover" />
                  </span>
                  <span>
                    <Link href={`/admin/produk/${p.id}`} className="font-bold text-brand hover:underline">
                      {p.name}
                    </Link>
                    <span className="block text-xs text-muted">{p.images.length} foto</span>
                  </span>
                </div>
              </td>
              <td className="p-3">{p.category.name}</td>
              <td className="p-3">{formatRupiah(p.price)}</td>
              <td className={`p-3 ${p.stock === 0 ? "font-bold text-danger" : ""}`}>{p.stock}</td>
              <td className="p-3">{p.status === "ACTIVE" ? "Aktif" : "Diarsipkan"}</td>
              <td className="p-3">
                <form action={toggleArchive}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="text-brand hover:underline">{p.status === "ACTIVE" ? "Arsipkan" : "Aktifkan"}</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
