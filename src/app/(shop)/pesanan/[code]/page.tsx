import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { OrderTimeline, StatusBadge } from "@/components/order-timeline";
import { db } from "@/lib/db";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { paymentTarget } from "@/lib/payment";
import { requireUser } from "@/lib/session";
import { PAYMENT_METHODS } from "@/lib/shipping";
import { SITE } from "@/lib/site";
import { confirmReceived } from "../actions";

export const metadata: Metadata = { title: "Pesanan", robots: { index: false } };

export default function PesananPage(props: PageProps<"/pesanan/[code]">) {
  return (
    <div className="mx-auto w-[min(820px,100%-32px)] py-8">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-card bg-header" aria-label="Memuat pesanan" />}>
        <Detail params={props.params} />
      </Suspense>
    </div>
  );
}

async function Detail({ params }: Pick<PageProps<"/pesanan/[code]">, "params">) {
  const { code } = await params;
  const user = await requireUser(`/pesanan/${code}`);
  // Pembeli hanya bisa melihat pesanannya sendiri (F-15): kode milik orang lain tampil sebagai "tidak ditemukan".
  const order = await db.order.findFirst({
    where: { code, userId: user.id },
    include: {
      items: { include: { product: { select: { slug: true, images: true, isPhoto: true } } } },
      events: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!order) notFound();

  const method = PAYMENT_METHODS[order.paymentMethod];
  const wa = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
    `Halo sekenkos.id, saya sudah membayar pesanan ${order.code} sebesar ${formatRupiah(order.total)} via ${method.label}. Bukti pembayaran saya lampirkan di chat ini.`,
  )}`;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Pesanan {order.code}</h1>
          <p className="text-sm text-muted">Dibuat {formatDateTime(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {order.status === "PENDING_PAYMENT" && (
        <section className="mb-6 rounded-card border-2 border-brand bg-header p-5" aria-labelledby="bayar">
          <h2 id="bayar" className="text-xl font-bold">
            Selesaikan pembayaran
          </h2>
          <p className="mt-2">
            Total yang harus dibayar: <b className="text-2xl">{formatRupiah(order.total)}</b>
          </p>
          <p className="mt-1">
            {method.label}: <b>{paymentTarget(order.paymentMethod)}</b>
          </p>
          <ol className="mt-3 list-decimal pl-5 text-sm">
            <li>Transfer sesuai nominal di atas, tepat sampai rupiah terakhir.</li>
            <li>Simpan bukti pembayaran.</li>
            <li>Tekan tombol di bawah dan kirim bukti lewat WhatsApp. Pesan sudah terisi kode pesanan dan nominal.</li>
          </ol>
          <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex rounded-full bg-success px-6 py-3 font-bold text-white hover:opacity-90">
            Konfirmasi lewat WhatsApp
          </a>
          <p className="mt-3 text-xs text-muted">
            Bayar sebelum {formatDateTime(order.expiresAt)}. Setelah itu pesanan dibatalkan otomatis dan stok dikembalikan. Status berubah menjadi Dibayar
            setelah admin memverifikasi buktimu.
          </p>
        </section>
      )}

      {order.status === "SHIPPED" && (
        <form action={confirmReceived} className="mb-6">
          <input type="hidden" name="code" value={order.code} />
          <button className="rounded-full bg-foreground px-6 py-3 font-bold text-white hover:bg-black">Pesanan sudah saya terima</button>
        </form>
      )}

      <section className="mb-6 rounded-card border border-line p-5">
        <h2 className="mb-4 text-xl font-bold">Status</h2>
        <OrderTimeline events={order.events} status={order.status} resi={order.trackingNumber} courier={order.courier} />
        {order.status === "RECEIVED" && <p className="mt-4 text-sm">Terima kasih sudah berbelanja!</p>}
      </section>

      <section className="mb-6 rounded-card border border-line p-5">
        <h2 className="mb-3 text-xl font-bold">Rincian</h2>
        <ul className="grid gap-3">
          {order.items.map((i) => (
            <li key={i.id} className="flex items-center gap-3">
              <div className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg ${i.product.isPhoto ? "" : "bg-brand-soft/40"}`}>
                <Image src={i.product.images[0]} alt="" fill sizes="56px" className={i.product.isPhoto ? "object-cover" : "object-contain p-1"} />
              </div>
              <span className="flex-1">
                {i.nameSnapshot} × {i.qty}
              </span>
              <span>{formatRupiah(i.priceSnapshot * i.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 grid gap-1 border-t border-line pt-3 text-sm">
          <Line label="Subtotal" value={formatRupiah(order.subtotal)} />
          {order.discount > 0 && <Line label="Diskon" value={`−${formatRupiah(order.discount)}`} />}
          <Line label={`Ongkir (${order.courier})`} value={order.shippingCost ? formatRupiah(order.shippingCost) : "Gratis"} />
          <Line label="Total" value={formatRupiah(order.total)} strong />
        </dl>
        <p className="mt-3 text-sm text-muted">
          Dikirim ke {order.shipName} ({order.shipPhone}) — {order.shipStreet}, {order.shipCity} {order.shipZip}
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/akun/pesanan" className="rounded-full border border-foreground px-5 py-2.5 font-bold hover:bg-header">
          Riwayat pembelian
        </Link>
        <Link href="/lacak" className="rounded-full border border-foreground px-5 py-2.5 font-bold hover:bg-header">
          Lacak pesanan
        </Link>
      </div>
    </>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "text-lg font-bold" : ""}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
