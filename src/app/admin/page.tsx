import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { Suspense } from "react";
import { AdminSkeleton } from "@/components/admin-skeleton";
import { StatusBadge } from "@/components/order-timeline";
import { db } from "@/lib/db";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { runExpiry } from "@/lib/maintenance";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

const DAY = 24 * 60 * 60 * 1000;
// Dipisah dari komponen: waktu sekarang memang berubah tiap permintaan (halaman ini dinamis, di balik requireAdmin).
const currentTime = () => Date.now();
const PAID_STATUSES = ["PAID", "PACKED", "SHIPPED", "RECEIVED"] as const;
const dayKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }); // YYYY-MM-DD (WIB)
const dayLabel = (d: Date) => d.toLocaleDateString("id-ID", { weekday: "short", timeZone: "Asia/Jakarta" });

export default function AdminPage() {
  return (
    <>
      <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>
      <Suspense fallback={<AdminSkeleton />}>
        <Ringkasan />
      </Suspense>
    </>
  );
}

async function Ringkasan() {
  await requireAdmin();
  after(() => runExpiry());

  const now = currentTime();
  const since30 = new Date(now - 30 * DAY);
  const since7 = new Date(now - 6 * DAY);

  const [waiting, toPack, toShip, messages, activeProducts, soldOut, revenue30, orders30, paid7, needAction] = await Promise.all([
    db.order.count({ where: { status: "PENDING_PAYMENT" } }),
    db.order.count({ where: { status: "PAID" } }),
    db.order.count({ where: { status: "PACKED" } }),
    db.message.count({ where: { handled: false } }),
    db.product.count({ where: { status: "ACTIVE" } }),
    db.product.findMany({ where: { status: "ACTIVE", stock: 0 }, select: { id: true, name: true }, take: 8 }),
    db.order.aggregate({ _sum: { total: true }, where: { status: { in: [...PAID_STATUSES] }, paidAt: { gte: since30 } } }),
    db.order.count({ where: { status: { not: "CANCELLED" }, createdAt: { gte: since30 } } }),
    db.order.findMany({ where: { status: { in: [...PAID_STATUSES] }, paidAt: { gte: since7 } }, select: { paidAt: true, total: true } }),
    db.order.findMany({ where: { status: { in: ["PENDING_PAYMENT", "PAID", "PACKED"] } }, orderBy: { createdAt: "asc" }, take: 8, include: { user: { select: { name: true } } } }),
  ]);

  // Pendapatan per hari selama 7 hari terakhir (WIB), hari ini paling kanan.
  const days = Array.from({ length: 7 }, (_, i) => new Date(now - (6 - i) * DAY));
  const perDay = new Map(days.map((d) => [dayKey(d), 0]));
  for (const o of paid7) if (o.paidAt) perDay.set(dayKey(o.paidAt), (perDay.get(dayKey(o.paidAt)) ?? 0) + o.total);
  const max = Math.max(1, ...perDay.values());

  const todo = [
    { label: "Menunggu pembayaran", n: waiting, href: "/admin/pesanan?status=PENDING_PAYMENT" },
    { label: "Perlu dikemas", n: toPack, href: "/admin/pesanan?status=PAID" },
    { label: "Perlu dikirim", n: toShip, href: "/admin/pesanan?status=PACKED" },
    { label: "Pesan belum dibaca", n: messages, href: "/admin/pesan" },
  ];

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Pendapatan 30 hari" value={formatRupiah(revenue30._sum.total ?? 0)} note="dari pesanan yang sudah dibayar" />
        <Stat label="Pesanan 30 hari" value={String(orders30)} note="tidak termasuk yang dibatalkan" />
        <Stat label="Produk aktif" value={String(activeProducts)} note={soldOut.length ? `${soldOut.length} stok habis` : "semua ada stok"} />
      </div>

      <section aria-labelledby="todo" className="rounded-card border border-line bg-white p-5">
        <h2 id="todo" className="mb-3 text-lg font-bold">Perlu tindakan</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {todo.map((c) => (
            <Link key={c.label} href={c.href} className={`rounded-lg border p-4 hover:border-brand ${c.n ? "border-brand bg-header/60" : "border-line"}`}>
              <div className="text-3xl font-bold">{c.n}</div>
              <div className="text-sm text-muted">{c.label}</div>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="chart" className="rounded-card border border-line bg-white p-5">
          <h2 id="chart" className="mb-4 text-lg font-bold">Pendapatan 7 hari terakhir</h2>
          <ol className="flex h-44 items-end gap-2">
            {days.map((d) => {
              const v = perDay.get(dayKey(d)) ?? 0;
              return (
                <li key={dayKey(d)} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${dayKey(d)}: ${formatRupiah(v)}`}>
                  <span className="text-[10px] text-muted">{v ? formatRupiah(v) : ""}</span>
                  <span className="w-full rounded-t bg-brand" style={{ height: `${Math.max(v ? 4 : 1, (v / max) * 100)}%`, opacity: v ? 1 : 0.25 }} />
                  <span className="text-xs text-muted">{dayLabel(d)}</span>
                </li>
              );
            })}
          </ol>
        </section>

        <section aria-labelledby="stok" className="rounded-card border border-line bg-white p-5">
          <h2 id="stok" className="mb-3 text-lg font-bold">Stok habis</h2>
          {soldOut.length === 0 ? (
            <p className="text-sm text-muted">Semua produk aktif masih ada stok.</p>
          ) : (
            <ul className="grid gap-1 text-sm">
              {soldOut.map((p) => (
                <li key={p.id} className="flex justify-between gap-3 border-b border-line py-1.5">
                  <span>{p.name}</span>
                  <Link href={`/admin/produk/${p.id}`} className="text-brand hover:underline">
                    Ubah stok
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section aria-labelledby="terbaru" className="rounded-card border border-line bg-white p-5">
        <h2 id="terbaru" className="mb-3 text-lg font-bold">Pesanan yang menunggu</h2>
        {needAction.length === 0 ? (
          <p className="text-sm text-muted">Tidak ada pesanan yang menunggu tindakan.</p>
        ) : (
          <ul className="grid gap-2">
            {needAction.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/pesanan/${o.code}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line p-3 hover:border-brand">
                  <span>
                    <b>{o.code}</b> · {o.user.name} · {formatRupiah(o.total)}
                    <span className="text-sm text-muted"> · {formatDateTime(o.createdAt)}</span>
                  </span>
                  <StatusBadge status={o.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-card border border-line bg-white p-5">
      <div className="text-sm text-muted">{label}</div>
      <div className="mt-1 text-3xl font-bold">{value}</div>
      <div className="mt-1 text-xs text-muted">{note}</div>
    </div>
  );
}
