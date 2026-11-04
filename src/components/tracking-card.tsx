import type { OrderStatus } from "@/generated/prisma/enums";
import { detectCarrier } from "@/lib/couriers";
import { FLOW, STATUS_LABEL } from "@/lib/order-status";
import { CopyButton } from "./copy-button";

/** Garis kemajuan horizontal: Menunggu Pembayaran → Dibayar → Dikemas → Dikirim → Diterima. */
export function OrderProgress({ status }: { status: OrderStatus }) {
  if (status === "CANCELLED") {
    return <p className="rounded-lg bg-danger/10 px-4 py-3 text-sm font-bold text-danger">Pesanan dibatalkan</p>;
  }
  const current = FLOW.indexOf(status);
  return (
    <ol className="grid grid-cols-5 gap-1" aria-label="Kemajuan pesanan">
      {FLOW.map((s, i) => {
        const done = i <= current;
        return (
          <li key={s} className="grid gap-1.5 text-center" aria-current={i === current ? "step" : undefined}>
            <span className={`h-2 rounded-full ${done ? "bg-brand" : "bg-line"}`} aria-hidden="true" />
            <span className={`text-[11px] leading-tight sm:text-xs ${i === current ? "font-bold text-foreground" : done ? "text-foreground" : "text-muted"}`}>{STATUS_LABEL[s]}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** Kurir + resi + tombol salin + tautan ke halaman lacak resmi kurir. Tampil setelah resi diisi. */
export function TrackingCard({ courier, resi }: { courier: string; resi: string | null }) {
  if (!resi) return null;
  const carrier = detectCarrier(courier);
  return (
    <div className="grid gap-3 rounded-xl border border-brand/30 bg-brand/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xs text-muted">Dikirim dengan {courier}</div>
          <div className="font-mono text-lg font-bold tracking-wide">{resi}</div>
        </div>
        <CopyButton text={resi} label="Salin resi" />
      </div>
      {carrier ? (
        <>
          <a
            href={carrier.trackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-brand px-5 py-2.5 text-center text-sm font-bold text-white hover:bg-foreground"
          >
            Lacak posisi paket di situs {carrier.name} ↗
          </a>
          <p className="text-xs text-muted">Salin resi, lalu tempel di kolom pencarian situs {carrier.name}.</p>
        </>
      ) : (
        <p className="text-xs text-muted">Salin resi dan cek di situs atau aplikasi kurir pengirim.</p>
      )}
    </div>
  );
}
