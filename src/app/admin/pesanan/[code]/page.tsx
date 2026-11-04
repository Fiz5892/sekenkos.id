import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminSkeleton } from "@/components/admin-skeleton";
import { OrderTimeline, StatusBadge } from "@/components/order-timeline";
import { formatAddress } from "@/lib/address";
import { db } from "@/lib/db";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { canCancel, nextStep } from "@/lib/order-status";
import { requireAdmin } from "@/lib/session";
import { PAYMENT_METHODS } from "@/lib/shipping";
import { advance, cancel } from "../actions";

export const metadata: Metadata = { title: "Detail pesanan" };

export default function AdminPesananDetailPage(props: PageProps<"/admin/pesanan/[code]">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Detail params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Detail({ params, searchParams }: Pick<PageProps<"/admin/pesanan/[code]">, "params" | "searchParams">) {
  await requireAdmin();
  const { code } = await params;
  const galat = (await searchParams).galat;
  const order = await db.order.findUnique({
    where: { code },
    include: {
      user: { select: { name: true, email: true } },
      promo: { select: { code: true } },
      items: true,
      events: { orderBy: { createdAt: "asc" }, include: { actor: { select: { name: true } } } },
    },
  });
  if (!order) notFound();

  const step = nextStep(order.status);
  // Pesanan bayar online lunas otomatis lewat webhook; tombol manual disembunyikan agar tidak salah tandai.
  const autoPay = order.paymentMethod === "GATEWAY" && order.status === "PENDING_PAYMENT";
  const input = "rounded-lg border border-line px-3 py-2 outline-none focus:border-brand";

  return (
    <>
      <Link href="/admin/pesanan" className="text-sm text-brand hover:underline">
        ← Semua pesanan
      </Link>
      <div className="mb-6 mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{order.code}</h1>
          <p className="text-sm text-muted">
            {order.user.name} · {order.user.email} · dibuat {formatDateTime(order.createdAt)}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {typeof galat === "string" && (
        <p role="alert" className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {galat}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-6">
          <section className="rounded-card border border-line p-5">
            <h2 className="mb-3 text-xl font-bold">Isi pesanan</h2>
            <ul className="grid gap-1 text-sm">
              {order.items.map((i) => (
                <li key={i.id} className="flex justify-between">
                  <span>
                    {i.nameSnapshot} × {i.qty}
                  </span>
                  <span>{formatRupiah(i.priceSnapshot * i.qty)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 grid gap-1 border-t border-line pt-3 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatRupiah(order.subtotal)}</dd></div>
              {order.discount > 0 && <div className="flex justify-between"><dt>Diskon {order.promo?.code}</dt><dd>−{formatRupiah(order.discount)}</dd></div>}
              <div className="flex justify-between"><dt>Ongkir ({order.courier})</dt><dd>{formatRupiah(order.shippingCost)}</dd></div>
              <div className="flex justify-between text-lg font-bold"><dt>Total</dt><dd>{formatRupiah(order.total)}</dd></div>
            </dl>
            <p className="mt-3 text-sm text-muted">
              Pembayaran: {PAYMENT_METHODS[order.paymentMethod].label}
              {order.paymentChannel ? ` (${order.paymentChannel})` : ""}. Batas bayar {formatDateTime(order.expiresAt)}.
              {order.paymentMethod === "GATEWAY" && order.gatewayInvoiceId && <> Transaksi Midtrans: {order.gatewayInvoiceId}.</>}
            </p>
          </section>

          <section className="rounded-card border border-line p-5">
            <h2 className="mb-3 text-xl font-bold">Pengiriman</h2>
            <p className="text-sm">
              {order.shipName} · {order.shipPhone}
              <br />
              {formatAddress({ street: order.shipStreet, village: order.shipVillage, district: order.shipDistrict, city: order.shipCity, province: order.shipProvince, zip: order.shipZip })}
            </p>
            <p className="mt-2 text-sm text-muted">
              {order.courier} · berat paket {(order.totalWeight / 1000).toLocaleString("id-ID", { maximumFractionDigits: 2 })} kg · ongkir ditagih {formatRupiah(order.shippingCost)}
            </p>
            {order.trackingNumber && <p className="mt-2 text-sm">Resi: <b>{order.trackingNumber}</b></p>}
          </section>

          <section className="rounded-card border border-line p-5">
            <h2 className="mb-3 text-xl font-bold">Riwayat perubahan</h2>
            <ul className="grid gap-1 text-sm">
              {order.events.map((e) => (
                <li key={e.id}>
                  <b>{e.status}</b> · {formatDateTime(e.createdAt)} · {e.actor?.name ?? "Sistem"}
                  {e.note ? ` — ${e.note}` : ""}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="grid h-fit gap-6">
          <section className="rounded-card border border-line p-5">
            <h2 className="mb-3 text-xl font-bold">Tindakan</h2>
            {autoPay && (
              <p className="mb-3 rounded-lg bg-header px-3 py-2 text-sm">Menunggu pembayaran online. Status berubah otomatis begitu Midtrans mengonfirmasi pembayaran.</p>
            )}
            {step && !autoPay ? (
              <form action={advance} className="grid gap-3">
                <input type="hidden" name="code" value={order.code} />
                <input type="hidden" name="to" value={step.to} />
                {step.to === "SHIPPED" && (
                  <label className="grid gap-1 text-sm">
                    <span className="font-bold">Nomor resi (wajib)</span>
                    <input name="resi" required maxLength={60} className={input} />
                  </label>
                )}
                {step.to === "PAID" && <p className="text-sm text-muted">Pastikan bukti transfer cocok dengan mutasi rekening sebelum menandai dibayar.</p>}
                <button className="rounded-full bg-foreground px-5 py-2.5 font-bold text-white hover:bg-black">{step.label}</button>
              </form>
            ) : (
              !autoPay && <p className="text-sm text-muted">Tidak ada tindakan lanjutan.</p>
            )}

            {canCancel(order.status) && (
              <form action={cancel} className="mt-5 grid gap-2 border-t border-line pt-4">
                <input type="hidden" name="code" value={order.code} />
                <label className="grid gap-1 text-sm">
                  <span className="font-bold">Batalkan pesanan</span>
                  <input name="alasan" placeholder="Alasan (opsional)" maxLength={200} className={input} />
                </label>
                <button className="rounded-full border border-danger px-5 py-2 font-bold text-danger hover:bg-danger/10">Batalkan &amp; kembalikan stok</button>
              </form>
            )}
          </section>

          <section className="rounded-card border border-line p-5">
            <h2 className="mb-3 text-xl font-bold">Lini masa</h2>
            <OrderTimeline events={order.events} status={order.status} resi={order.trackingNumber} courier={order.courier} />
          </section>
        </aside>
      </div>
    </>
  );
}
