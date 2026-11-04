/**
 * Kurir yang dipakai toko dan halaman pelacakan resminya (gratis, dibuka di situs kurir).
 * Situs kurir tidak menerima resi lewat URL secara resmi, jadi pelanggan menyalin resi lalu menempelkannya di sana.
 */
export const CARRIERS = [
  { code: "jne", name: "JNE", trackUrl: "https://www.jne.co.id/tracking-package", match: /\bjne\b/i },
  { code: "jnt", name: "J&T Express", trackUrl: "https://jet.co.id/track", match: /j\s*&\s*t|\bjnt\b/i },
  { code: "sicepat", name: "SiCepat", trackUrl: "https://www.sicepat.com/checkAwb", match: /sicepat/i },
  { code: "anteraja", name: "AnterAja", trackUrl: "https://anteraja.id/tracking", match: /anteraja/i },
] as const;

export type Carrier = (typeof CARRIERS)[number];

/** Mengenali kurir dari nama layanan yang tersimpan di pesanan, mis. "JNE Reguler" atau "J&T EZ". */
export function detectCarrier(courierName: string | null | undefined): Carrier | null {
  if (!courierName) return null;
  return CARRIERS.find((c) => c.match.test(courierName)) ?? null;
}

export const carrierByCode = (code: string) => CARRIERS.find((c) => c.code === code) ?? null;
