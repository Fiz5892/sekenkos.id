/*
 * Perhitungan ongkir yang murni (tanpa jaringan/database) agar mudah diuji.
 *
 * Prinsip: ongkir dibebankan penuh ke pembeli sesuai tarif kurir untuk berat dan tujuan paket,
 * lalu ditambah pengaman supaya toko tidak nombok:
 *   - berat paket = berat barang + berat kemasan (kardus/bubble wrap), dibulatkan ke atas;
 *   - markup persen (selisih timbang kurir, tarif naik) dan biaya packing tetap, keduanya opsional;
 *   - hasil dibulatkan ke atas ke kelipatan tertentu (bawaan Rp500).
 */
import type { ShippingOption } from "@/lib/shipping";

export type ShippingSettings = {
  /** Tambahan persen di atas tarif kurir. */
  markupPercent: number;
  /** Biaya packing tetap per pesanan (rupiah). */
  packingFee: number;
  /** Berat kemasan yang ditambahkan ke berat barang (gram). */
  packingGrams: number;
  /** Pembulatan ke atas (rupiah). */
  roundTo: number;
};

export const DEFAULT_SETTINGS: ShippingSettings = { markupPercent: 0, packingFee: 0, packingGrams: 200, roundTo: 500 };

/** Berat paket (gram): total berat barang + kemasan, dibulatkan ke atas per 50 g, minimal 100 g. */
export function packageWeight(lines: { weightGrams: number; qty: number }[], packingGrams = DEFAULT_SETTINGS.packingGrams): number {
  const items = lines.reduce((sum, l) => sum + Math.max(0, l.weightGrams) * Math.max(0, l.qty), 0);
  return Math.max(100, Math.ceil((items + packingGrams) / 50) * 50);
}

/** Tarif kurir → ongkir untuk pembeli (lihat prinsip di atas). Tidak pernah lebih kecil dari tarif kurir. */
export function applyMargin(price: number, s: Pick<ShippingSettings, "markupPercent" | "packingFee" | "roundTo">): number {
  const raw = price * (1 + Math.max(0, s.markupPercent) / 100) + Math.max(0, s.packingFee);
  const step = Math.max(1, s.roundTo);
  return Math.ceil(raw / step) * step;
}

const digits = (zip: string) => zip.replace(/\D/g, "");

/** Pulau/kepulauan dari 2 digit awal kode provinsi (Kemendagri). */
const ISLANDS: Record<string, string> = {
  ...Object.fromEntries(["11", "12", "13", "14", "15", "16", "17", "18", "19", "21"].map((p) => [p, "sumatera"])),
  ...Object.fromEntries(["31", "32", "33", "34", "35", "36"].map((p) => [p, "jawa"])),
  ...Object.fromEntries(["51", "52", "53"].map((p) => [p, "nusa-tenggara"])),
  ...Object.fromEntries(["61", "62", "63", "64", "65"].map((p) => [p, "kalimantan"])),
  ...Object.fromEntries(["71", "72", "73", "74", "75", "76"].map((p) => [p, "sulawesi"])),
  ...Object.fromEntries(["81", "82"].map((p) => [p, "maluku"])),
  ...Object.fromEntries(["91", "92", "93", "94", "95", "96"].map((p) => [p, "papua"])),
};

/** Zona tarif dari kode kabupaten/kota (mis. "35.73"): 0 satu kota/kabupaten, 1 satu pulau, 2 beda pulau. */
export function zoneByRegion(originRegency: string, destRegency: string): 0 | 1 | 2 {
  if (originRegency === destRegency) return 0;
  const a = ISLANDS[originRegency.slice(0, 2)];
  return a && a === ISLANDS[destRegency.slice(0, 2)] ? 1 : 2;
}

/**
 * Perkiraan tarif bila kunci Biteship belum diisi. Bila kode kabupaten/kota asal dan tujuan diketahui, zona
 * dihitung dari wilayah sebenarnya; jika tidak, dari kedekatan kode pos (3 digit sama = satu wilayah,
 * 1 digit sama = satu regional, selain itu jauh). Angkanya sengaja condong tinggi (lebih baik sedikit lebih
 * mahal daripada nombok).
 */
export function estimateOptions(
  originZip: string,
  destZip: string,
  weightGrams: number,
  regions?: { origin: string; dest: string },
): (Omit<ShippingOption, "cost"> & { price: number })[] {
  const o = digits(originZip);
  const d = digits(destZip);
  const zone = regions ? zoneByRegion(regions.origin, regions.dest) : o.slice(0, 3) === d.slice(0, 3) ? 0 : o.slice(0, 1) === d.slice(0, 1) ? 1 : 2;
  const firstKg = [9000, 15000, 32000][zone];
  const nextKg = [6000, 10000, 24000][zone];
  const kg = Math.max(1, Math.ceil(weightGrams / 1000));
  const reg = firstKg + (kg - 1) * nextKg;
  const eta = ["1–2 hari", "2–4 hari", "4–8 hari"][zone];
  return [
    { id: "estimasi:reg", name: "Reguler (estimasi)", eta, price: reg, estimate: true },
    { id: "estimasi:kilat", name: "Kilat (estimasi)", eta: ["1 hari", "1–2 hari", "2–4 hari"][zone], price: Math.round(reg * 1.5), estimate: true },
  ];
}

type BiteshipPricing = {
  courier_code?: string;
  courier_name?: string;
  courier_service_code?: string;
  courier_service_name?: string;
  duration?: string;
  price?: number;
};

const idDuration = (s?: string) => (s ? s.replace(/days?/i, "hari").replace(/hours?/i, "jam").replace(/\s*-\s*/g, "–").trim() : "—");

/** Mengubah respons Biteship `/v1/rates/couriers` menjadi pilihan ongkir; entri tanpa harga valid dibuang. */
export function parseBiteshipRates(json: unknown, s: Pick<ShippingSettings, "markupPercent" | "packingFee" | "roundTo">, limit = 8): ShippingOption[] {
  const list = (json as { pricing?: BiteshipPricing[] } | null)?.pricing;
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const options: ShippingOption[] = [];
  for (const p of list) {
    if (!p.courier_code || !p.courier_service_code || typeof p.price !== "number" || !(p.price > 0)) continue;
    const id = `${p.courier_code}:${p.courier_service_code}`;
    if (seen.has(id)) continue;
    seen.add(id);
    options.push({
      id,
      name: `${p.courier_name ?? p.courier_code.toUpperCase()} ${p.courier_service_name ?? p.courier_service_code}`.trim(),
      eta: idDuration(p.duration),
      cost: applyMargin(p.price, s),
    });
  }
  return options.sort((a, b) => a.cost - b.cost).slice(0, limit);
}
