import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderTimeline, StatusBadge } from "@/components/order-timeline";
import { db } from "@/lib/db";
import { normalizeOrderCode } from "@/lib/order-code";

export const metadata: Metadata = {
  title: "Lacak Pesanan",
  description: "Pantau status pesananmu dengan nomor pesanan atau nomor resi.",
};

export default function LacakPage(props: PageProps<"/lacak">) {
  return (
    <div className="mx-auto w-[min(760px,100%-32px)] py-8">
      <h1 className="text-3xl font-bold">Lacak Pesanan</h1>
      <p className="mt-1 text-sm text-muted">Masukkan nomor pesanan (contoh: PLY-7K3M9Q) atau nomor resi.</p>
      <Suspense fallback={<div className="mt-6 h-40 animate-pulse rounded-card bg-header" aria-label="Memuat" />}>
        <Lacak searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Lacak({ searchParams }: Pick<PageProps<"/lacak">, "searchParams">) {
  const raw = (await searchParams).kode;
  const query = (Array.isArray(raw) ? raw[0] : raw)?.trim().slice(0, 40) ?? "";

  // Hanya status dan kurir yang ditampilkan; nama, alamat, dan isi pesanan tidak pernah dibuka ke publik.
  const code = query ? normalizeOrderCode(query) : null;
  const order = query
    ? await db.order.findFirst({
        where: code ? { code } : { trackingNumber: { equals: query, mode: "insensitive" } },
        select: { code: true, status: true, courier: true, trackingNumber: true, events: { orderBy: { createdAt: "asc" }, select: { status: true, createdAt: true, note: true } } },
      })
    : null;

  return (
    <>
      <form action="/lacak" className="my-6 flex gap-2" role="search">
        <input name="kode" defaultValue={query} placeholder="Nomor pesanan / resi" aria-label="Nomor pesanan atau resi" className="w-full rounded-full border border-line px-4 py-2.5 outline-none focus:border-brand" />
        <button className="rounded-full bg-foreground px-6 font-bold text-white hover:bg-black">Lacak</button>
      </form>

      {query && !order && (
        <div role="status" className="rounded-card bg-header p-8 text-center text-muted">
          Pesanan tidak ditemukan. Periksa kembali nomornya.
        </div>
      )}
      {order && (
        <section className="rounded-card border border-line p-5">
          <div className="mb-4 flex items-center justify-between">
            <b>{order.code}</b>
            <StatusBadge status={order.status} />
          </div>
          <OrderTimeline events={order.events} status={order.status} resi={order.trackingNumber} courier={order.courier} />
        </section>
      )}
    </>
  );
}
