import type { OrderStatus } from "@/generated/prisma/enums";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Menunggu Pembayaran",
  PAID: "Dibayar",
  PACKED: "Dikemas",
  SHIPPED: "Dikirim",
  RECEIVED: "Diterima",
  CANCELLED: "Dibatalkan",
};

/** Urutan tahap normal (tanpa Dibatalkan) untuk ditampilkan sebagai lini masa. */
export const FLOW: OrderStatus[] = ["PENDING_PAYMENT", "PAID", "PACKED", "SHIPPED", "RECEIVED"];

/** Status asal yang sah untuk setiap status tujuan (alur maju satu langkah). */
export const PREVIOUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PAID: "PENDING_PAYMENT",
  PACKED: "PAID",
  SHIPPED: "PACKED",
  RECEIVED: "SHIPPED",
};

/** Pesanan baru boleh dibatalkan sebelum dikirim; setelah dikirim tidak lagi. */
export const CANCELLABLE: OrderStatus[] = ["PENDING_PAYMENT", "PAID", "PACKED"];

export const canAdvance = (from: OrderStatus, to: OrderStatus) => PREVIOUS[to] === from;
export const canCancel = (from: OrderStatus) => CANCELLABLE.includes(from);

/** Langkah berikutnya yang ditawarkan ke admin pada sebuah pesanan. */
export function nextStep(status: OrderStatus): { to: OrderStatus; label: string } | null {
  switch (status) {
    case "PENDING_PAYMENT":
      return { to: "PAID", label: "Tandai Dibayar" };
    case "PAID":
      return { to: "PACKED", label: "Tandai Dikemas" };
    case "PACKED":
      return { to: "SHIPPED", label: "Tandai Dikirim" };
    case "SHIPPED":
      return { to: "RECEIVED", label: "Tandai Diterima" };
    default:
      return null;
  }
}
