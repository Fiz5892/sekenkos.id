// Tipe dan konstanta ongkir/pembayaran yang aman dipakai di server maupun klien.
// Perhitungan tarifnya ada di shipping-calc.ts (murni) dan shipping-quote.ts (memanggil Biteship).

export type ShippingOption = {
  /** Kunci stabil, mis. "jne:reg". Dikirim dari form dan dicocokkan ulang di server. */
  id: string;
  name: string;
  eta: string;
  /** Ongkir yang ditagihkan ke pembeli (rupiah), sudah termasuk margin pengaman toko. */
  cost: number;
  /** true bila tarif berupa perkiraan (tanpa kunci Biteship). */
  estimate?: boolean;
};

export const PICKUP_ID = "pickup";
export const PICKUP_OPTION: ShippingOption = { id: PICKUP_ID, name: "Ambil di tempat (COD kampus)", eta: "Janjian via chat", cost: 0 };

export const PAYMENT_METHODS = {
  GATEWAY: { label: "Bayar online", note: "Virtual account bank, QRIS, dompet digital, atau kartu. Langsung terkonfirmasi otomatis." },
  BANK_TRANSFER: { label: "Transfer Bank", note: "Transfer ke rekening toko, lalu kirim bukti lewat WhatsApp" },
  EWALLET: { label: "Dompet Digital / QRIS", note: "Bayar ke nomor dompet digital toko, lalu kirim bukti lewat WhatsApp" },
} as const;

export type PaymentMethodKey = keyof typeof PAYMENT_METHODS;
