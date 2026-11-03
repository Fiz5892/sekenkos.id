import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminSkeleton } from "@/components/admin-skeleton";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { requireAdmin } from "@/lib/session";
import { createPromo, togglePromo } from "./actions";

export const metadata: Metadata = { title: "Promo" };

const input = "w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-brand";

export default function AdminPromoPage(props: PageProps<"/admin/promo">) {
  return (
    <>
      <h1 className="mb-4 text-3xl font-bold">Promo</h1>
      <Suspense fallback={<AdminSkeleton />}>
        <Isi searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function Isi({ searchParams }: Pick<PageProps<"/admin/promo">, "searchParams">) {
  await requireAdmin();
  const { galat } = await searchParams;
  const promos = await db.promo.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="overflow-x-auto rounded-card border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-header">
            <tr>
              <th className="p-3">Kode</th>
              <th className="p-3">Diskon</th>
              <th className="p-3">Terpakai</th>
              <th className="p-3">Berlaku s/d</th>
              <th className="p-3">Syarat</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {promos.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="p-3 font-bold">{p.code}</td>
                <td className="p-3">{p.percent}%</td>
                <td className="p-3">
                  {p.usedCount}
                  {p.quota !== null ? ` / ${p.quota}` : ""}
                </td>
                <td className="p-3">{p.validUntil ? formatDateTime(p.validUntil) : "Tanpa batas"}</td>
                <td className="p-3">{p.firstPurchaseOnly ? "Pembelian pertama" : "Semua pembeli"}</td>
                <td className="p-3">
                  <form action={togglePromo}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="text-brand hover:underline">{p.active ? "Aktif — nonaktifkan" : "Nonaktif — aktifkan"}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form action={createPromo} className="grid h-fit gap-3 rounded-card border border-line p-5">
        <h2 className="text-xl font-bold">Kode baru</h2>
        {typeof galat === "string" && (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {galat}
          </p>
        )}
        <label className="grid gap-1 text-sm">
          <span className="font-bold">Kode</span>
          <input name="code" required maxLength={20} className={`${input} uppercase`} />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-bold">Diskon (%)</span>
          <input name="percent" type="number" min={1} max={90} required className={input} />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-bold">Kuota pemakaian (opsional)</span>
          <input name="quota" type="number" min={1} className={input} />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-bold">Berlaku sampai (opsional)</span>
          <input name="validUntil" type="date" className={input} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="firstPurchaseOnly" /> Hanya untuk pembelian pertama
        </label>
        <button className="w-fit rounded-full bg-foreground px-6 py-2.5 font-bold text-white hover:bg-black">Buat kode</button>
      </form>
    </div>
  );
}
