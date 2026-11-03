import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminSkeleton } from "@/components/admin-skeleton";
import { StatusBadge } from "@/components/order-timeline";
import type { OrderStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/order-status";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Pesanan" };

export default function AdminPesananPage(props: PageProps<"/admin/pesanan">) {
  return (
    <>
      <h1 className="mb-4 text-3xl font-bold">Pesanan</h1>
      <Suspense fallback={<AdminSkeleton />}>
        <Daftar searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function Daftar({ searchParams }: Pick<PageProps<"/admin/pesanan">, "searchParams">) {
  await requireAdmin();
  const raw = (await searchParams).status;
  const status = typeof raw === "string" && raw in STATUS_LABEL ? (raw as OrderStatus) : undefined;

  const orders = await db.order.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { name: true, email: true } }, _count: { select: { items: true } } },
  });

  const chip = (on: boolean) => `rounded-full px-3 py-1 text-sm ${on ? "bg-foreground text-white" : "bg-header hover:bg-header-contrast"}`;
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter status">
        <Link href="/admin/pesanan" className={chip(!status)}>
          Semua
        </Link>
        {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => (
          <Link key={s} href={`/admin/pesanan?status=${s}`} className={chip(status === s)}>
            {STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="rounded-card bg-header p-8 text-center text-muted">Tidak ada pesanan.</p>
      ) : (
        <div className="overflow-x-auto rounded-card border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-header">
              <tr>
                <th className="p-3">Kode</th>
                <th className="p-3">Pembeli</th>
                <th className="p-3">Total</th>
                <th className="p-3">Dibuat</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-line">
                  <td className="p-3">
                    <Link href={`/admin/pesanan/${o.code}`} className="font-bold text-brand hover:underline">
                      {o.code}
                    </Link>
                  </td>
                  <td className="p-3">
                    {o.user.name}
                    <div className="text-xs text-muted">{o.user.email}</div>
                  </td>
                  <td className="p-3">{formatRupiah(o.total)}</td>
                  <td className="p-3">{formatDateTime(o.createdAt)}</td>
                  <td className="p-3">
                    <StatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
