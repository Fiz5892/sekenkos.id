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
  BANK_TRANSFER: { label: "Transfer Bank", note: "Transfer ke rekening toko, lalu kirim bukti lewat WhatsApp" },
  EWALLET: { label: "E-Wallet", note: "Bayar ke nomor dompet digital toko, lalu kirim bukti lewat WhatsApp" },
  QRIS: { label: "QRIS", note: "Scan kode QRIS dengan nominal otomatis sesuai pesanan, lalu kirim bukti lewat WhatsApp" },
  // Payment gateway (Midtrans) dinonaktifkan. Label tetap ada agar pesanan lama tetap tampil.
  GATEWAY: { label: "Bayar online", note: "Virtual account bank, QRIS, dompet digital, atau kartu." },
} as const;

export type PaymentMethodKey = keyof typeof PAYMENT_METHODS;

/** Metode yang bisa dipilih di checkout (semuanya dikonfirmasi lewat WhatsApp). */
export const CHECKOUT_PAYMENTS = ["BANK_TRANSFER", "EWALLET", "QRIS"] as const satisfies readonly PaymentMethodKey[];
