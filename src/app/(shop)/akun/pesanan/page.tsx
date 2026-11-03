import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AccountTabs } from "@/components/account-tabs";
import { StatusBadge } from "@/components/order-timeline";
import { db } from "@/lib/db";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Riwayat Pembelian", robots: { index: false } };

export default function RiwayatPage() {
  return (
    <div className="mx-auto w-[min(820px,100%-32px)] py-8">
      <h1 className="mb-4 text-3xl font-bold">Akun Saya</h1>
      <AccountTabs active="pesanan" />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-card bg-header" aria-label="Memuat" />}>
        <Riwayat />
      </Suspense>
    </div>
  );
}

async function Riwayat() {
  const user = await requireUser("/akun/pesanan");
  if ((user as { role?: string }).role === "ADMIN") redirect("/admin");
  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { items: { select: { nameSnapshot: true, qty: true } } },
  });

  if (orders.length === 0)
    return (
      <div className="rounded-card bg-header p-10 text-center text-muted">
        Belum ada pembelian.{" "}
        <Link href="/produk" className="text-brand underline">
          Mulai belanja
        </Link>
      </div>
    );

  return (
    <ul className="grid gap-3">
      {orders.map((o) => (
        <li key={o.id} className="rounded-card border border-line p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <b>{o.code}</b> <span className="text-sm text-muted">· {formatDateTime(o.createdAt)}</span>
            </div>
            <StatusBadge status={o.status} />
          </div>
          <p className="mt-2 text-sm">{o.items.map((i) => `${i.nameSnapshot} × ${i.qty}`).join(", ")}</p>
          <p className="text-sm text-muted">
            {formatRupiah(o.total)} · {o.courier}
            {o.trackingNumber ? ` · Resi ${o.trackingNumber}` : ""}
          </p>
          <Link href={`/pesanan/${o.code}`} className="mt-3 inline-flex rounded-full border border-foreground px-4 py-1.5 text-sm font-bold hover:bg-header">
            {o.status === "PENDING_PAYMENT" ? "Bayar sekarang" : "Detail & lacak"}
          </Link>
        </li>
      ))}
    </ul>
  );
}
