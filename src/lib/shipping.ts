// Tarif tetap per kurir (asumsi MVP, sama dengan website lama). Ganti di sini bila tarif berubah.
export const COURIERS = [
  { id: "jne", name: "JNE Reguler", eta: "2–3 hari", cost: 10000 },
  { id: "jnt", name: "J&T Express", eta: "2–3 hari", cost: 12000 },
  { id: "sicepat", name: "SiCepat REG", eta: "1–2 hari", cost: 9000 },
  { id: "pickup", name: "Ambil di tempat (COD kampus)", eta: "Janjian via chat", cost: 0 },
] as const;

export type CourierId = (typeof COURIERS)[number]["id"];

export const getCourier = (id: string) => COURIERS.find((c) => c.id === id);

export const PAYMENT_METHODS = {
  BANK_TRANSFER: { label: "Transfer Bank", note: "Transfer ke rekening toko, lalu kirim bukti lewat WhatsApp" },
  EWALLET: { label: "Dompet Digital / QRIS", note: "Bayar ke nomor dompet digital toko, lalu kirim bukti lewat WhatsApp" },
} as const;

export type PaymentMethodKey = keyof typeof PAYMENT_METHODS;
