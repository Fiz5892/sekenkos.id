import "server-only";
import { DEFAULT_SETTINGS, applyMargin, estimateOptions, parseBiteshipRates, type ShippingSettings } from "@/lib/shipping-calc";
import { PICKUP_ID, PICKUP_OPTION, type ShippingOption } from "@/lib/shipping";

/** Kesalahan yang aman ditampilkan ke pembeli. */
export class ShippingError extends Error {}

const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return v !== undefined && v !== "" && Number.isFinite(n) && n >= 0 ? n : fallback;
};

/**
 * Pengaturan ongkir dari env (semua opsional kecuali kunci Biteship dan kode pos asal untuk tarif asli):
 *   BITESHIP_API_KEY        kunci API Biteship; kosong = pakai perkiraan tarif (lihat shipping-calc.ts)
 *   SHIPPING_ORIGIN_ZIP     kode pos tempat barang dikirim dari toko
 *   BITESHIP_COURIERS       kurir yang ditawarkan, mis. "jne,jnt,sicepat,anteraja"
 *   SHIPPING_MARKUP_PERCENT tambahan persen di atas tarif kurir
 *   SHIPPING_PACKING_FEE    biaya packing tetap per pesanan (rupiah)
 *   SHIPPING_PACKING_GRAMS  berat kemasan yang ditambahkan ke berat barang
 *   SHIPPING_ROUND_TO       pembulatan ke atas (rupiah)
 */
export function shippingSettings(): ShippingSettings {
  return {
    markupPercent: num(process.env.SHIPPING_MARKUP_PERCENT, DEFAULT_SETTINGS.markupPercent),
    packingFee: num(process.env.SHIPPING_PACKING_FEE, DEFAULT_SETTINGS.packingFee),
    packingGrams: num(process.env.SHIPPING_PACKING_GRAMS, DEFAULT_SETTINGS.packingGrams),
    roundTo: Math.max(1, num(process.env.SHIPPING_ROUND_TO, DEFAULT_SETTINGS.roundTo)),
  };
}

const originZip = () => process.env.SHIPPING_ORIGIN_ZIP?.replace(/\D/g, "") || "65141";
/** Kode kabupaten/kota toko (Kepmendagri) untuk perkiraan tarif; bawaan Kota Malang. */
const originRegency = () => process.env.SHIPPING_ORIGIN_REGENCY?.trim() || "35.73";
export const biteshipEnabled = () => Boolean(process.env.BITESHIP_API_KEY);

// Cache singkat agar tarif yang dilihat pembeli sama dengan yang dihitung saat pesanan dibuat,
// dan agar tidak memanggil API berulang untuk tujuan & berat yang sama.
const CACHE_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; options: ShippingOption[] }>();

async function fetchBiteship(destZip: string, weightGrams: number, itemValue: number): Promise<ShippingOption[]> {
  let res: Response;
  try {
    res = await fetch("https://api.biteship.com/v1/rates/couriers", {
      method: "POST",
      headers: { Authorization: process.env.BITESHIP_API_KEY!, "Content-Type": "application/json" },
      body: JSON.stringify({
        origin_postal_code: Number(originZip()),
        destination_postal_code: Number(destZip),
        couriers: process.env.BITESHIP_COURIERS || "jne,jnt,sicepat,anteraja",
        items: [{ name: "Paket barang preloved", value: Math.max(1, itemValue), weight: weightGrams, quantity: 1 }],
      }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
  } catch {
    throw new ShippingError("Tarif ongkir belum bisa diambil. Coba lagi sebentar lagi.");
  }
  if (!res.ok) {
    const text = (await res.text()).slice(0, 300);
    console.error(`Biteship ${res.status}:`, text);
    // Saldo habis juga berstatus 400, tapi bukan salah pembeli: jangan disebut kode pos salah.
    const zipProblem = (res.status === 400 || res.status === 422) && !/balance|saldo|api.?key|unauthor/i.test(text);
    throw new ShippingError(
      zipProblem
        ? "Kode pos tujuan tidak ditemukan. Periksa kembali kode posnya."
        : "Tarif ongkir belum bisa diambil. Coba lagi sebentar lagi.",
    );
  }
  const options = parseBiteshipRates(await res.json(), shippingSettings());
  if (options.length === 0) throw new ShippingError("Belum ada kurir yang melayani kode pos tersebut.");
  return options;
}

/**
 * Pilihan ongkir untuk tujuan dan berat tertentu, termurah dulu, ditambah opsi ambil di tempat.
 * Dengan kunci Biteship tarifnya asli dan gagal bila API bermasalah (tidak menebak, supaya tidak nombok);
 * tanpa kunci dipakai perkiraan tarif yang diberi label "estimasi".
 */
export async function quoteShipping(destZip: string, weightGrams: number, itemValue = 0, destRegency = ""): Promise<ShippingOption[]> {
  const zip = destZip.replace(/\D/g, "");
  if (!/^\d{5}$/.test(zip)) throw new ShippingError("Kode pos harus 5 digit.");

  const key = `${zip}:${weightGrams}:${biteshipEnabled() ? "" : destRegency}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return [...hit.options, PICKUP_OPTION];

  let options: ShippingOption[];
  if (biteshipEnabled()) {
    options = await fetchBiteship(zip, weightGrams, itemValue);
  } else {
    const s = shippingSettings();
    options = estimateOptions(originZip(), zip, weightGrams, destRegency ? { origin: originRegency(), dest: destRegency } : undefined).map(({ price, ...o }) => ({ ...o, cost: applyMargin(price, s) }));
  }
  cache.set(key, { at: Date.now(), options });
  if (cache.size > 500) cache.delete(cache.keys().next().value!);
  return [...options, PICKUP_OPTION];
}

/** Mencari satu pilihan ongkir berdasarkan id-nya untuk tujuan & berat ini; selalu dihitung ulang di server. */
export async function resolveShipping(destZip: string, weightGrams: number, optionId: string, itemValue = 0, destRegency = ""): Promise<ShippingOption> {
  if (optionId === PICKUP_ID) return PICKUP_OPTION;
  const found = (await quoteShipping(destZip, weightGrams, itemValue, destRegency)).find((o) => o.id === optionId);
  if (!found) throw new ShippingError("Jasa pengiriman yang dipilih tidak tersedia untuk tujuan ini. Pilih ulang.");
  return found;
}
