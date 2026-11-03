import type { OrderStatus } from "@/generated/prisma/enums";
import { formatDateTime } from "@/lib/format";
import { FLOW, STATUS_LABEL } from "@/lib/order-status";

type Event = { status: OrderStatus; createdAt: Date; note?: string | null };

const DESC: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Pesanan dibuat, menunggu pembayaran",
  PAID: "Pembayaran terverifikasi",
  PACKED: "Penjual sedang mengemas barang",
  SHIPPED: "Barang dalam pengiriman",
  RECEIVED: "Pesanan sudah diterima",
  CANCELLED: "Pesanan dibatalkan",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const tone =
    status === "CANCELLED" ? "bg-danger/10 text-danger" : status === "RECEIVED" ? "bg-success/10 text-success" : status === "PENDING_PAYMENT" ? "bg-hero/40 text-foreground" : "bg-header text-foreground";
  return <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-bold ${tone}`}>{STATUS_LABEL[status]}</span>;
}

/** Lini masa dari catatan status. Pesanan batal menampilkan jalur yang sempat dilalui lalu "Dibatalkan". */
export function OrderTimeline({ events, status, resi, courier }: { events: Event[]; status: OrderStatus; resi?: string | null; courier?: string }) {
  const at = new Map(events.map((e) => [e.status, e]));
  const steps: OrderStatus[] = status === "CANCELLED" ? [...FLOW.filter((s) => at.has(s)), "CANCELLED"] : FLOW;

  return (
    <ol className="relative grid gap-4 border-l-2 border-line pl-6" aria-label="Status pesanan">
      {steps.map((s) => {
        const ev = at.get(s);
        const done = Boolean(ev);
        return (
          <li key={s} className="relative" aria-current={s === status ? "step" : undefined}>
            <span
              aria-hidden="true"
              className={`absolute -left-[33px] top-1 h-3.5 w-3.5 rounded-full border-2 ${s === "CANCELLED" ? "border-danger bg-danger" : done ? "border-brand bg-brand" : "border-line bg-white"}`}
            />
            <b className={done ? "" : "text-muted"}>{STATUS_LABEL[s]}</b>
            <div className={`text-sm ${done ? "" : "text-muted"}`}>
              {DESC[s]}
              {s === "SHIPPED" && done && (courier || resi) ? ` — ${courier ?? ""}${resi ? ` · Resi ${resi}` : ""}` : ""}
              {ev && <span className="text-muted"> · {formatDateTime(ev.createdAt)}</span>}
            </div>
            {ev?.note && s === "CANCELLED" && <div className="text-sm text-muted">{ev.note}</div>}
          </li>
        );
      })}
    </ol>
  );
}
