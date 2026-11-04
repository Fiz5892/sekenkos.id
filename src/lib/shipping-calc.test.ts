import { describe, expect, it } from "vitest";
import { applyMargin, estimateOptions, packageWeight, parseBiteshipRates, zoneByRegion } from "./shipping-calc";

const NO_MARGIN = { markupPercent: 0, packingFee: 0, roundTo: 500 };

describe("packageWeight", () => {
  it("menjumlah berat barang × jumlah, menambah kemasan, dan membulatkan ke atas per 50 g", () => {
    expect(packageWeight([{ weightGrams: 300, qty: 2 }, { weightGrams: 120, qty: 1 }], 200)).toBe(950); // 920 → 950
  });

  it("tidak pernah di bawah 100 g dan mengabaikan nilai negatif", () => {
    expect(packageWeight([], 0)).toBe(100);
    expect(packageWeight([{ weightGrams: -50, qty: 3 }], 0)).toBe(100);
  });
});

describe("applyMargin", () => {
  it("membulatkan ke atas ke kelipatan yang diminta", () => {
    expect(applyMargin(10100, NO_MARGIN)).toBe(10500);
    expect(applyMargin(10000, NO_MARGIN)).toBe(10000);
  });

  it("menambah markup persen dan biaya packing sebelum pembulatan", () => {
    // 10.000 × 1,10 + 2.000 = 13.000
    expect(applyMargin(10000, { markupPercent: 10, packingFee: 2000, roundTo: 500 })).toBe(13000);
    expect(applyMargin(9990, { markupPercent: 5, packingFee: 0, roundTo: 1000 })).toBe(11000);
  });

  it("tidak pernah lebih kecil dari tarif kurir (nilai negatif diabaikan)", () => {
    expect(applyMargin(12345, { markupPercent: -50, packingFee: -999, roundTo: 500 })).toBeGreaterThanOrEqual(12345);
  });
});

describe("estimateOptions", () => {
  it("makin jauh kode pos tujuan makin mahal, dan makin berat makin mahal", () => {
    const price = (dest: string, g = 1000) => estimateOptions("65141", dest, g)[0].price;
    expect(price("65145")).toBeLessThan(price("60111")); // sama wilayah < sepulau
    expect(price("60111")).toBeLessThan(price("12345")); // sepulau < beda pulau
    expect(price("65145", 3000)).toBeGreaterThan(price("65145", 1000));
  });

  it("memakai wilayah asli bila diketahui, bukan tebakan dari awalan kode pos", () => {
    // Jakarta (kode pos 1xxxx) dan Malang (6xxxx) sama-sama di Jawa: bukan "beda pulau".
    const price = (dest: string) => estimateOptions("65141", "10110", 1000, { origin: "35.73", dest })[0].price;
    expect(price("35.73")).toBeLessThan(price("31.74")); // satu kota < satu pulau
    expect(price("31.74")).toBeLessThan(price("73.71")); // Jakarta < Makassar
    expect(price("31.74")).toBeLessThan(estimateOptions("65141", "10110", 1000)[0].price); // tebakan kode pos menyebut Jakarta "jauh"
  });

  it("zoneByRegion: satu kota, satu pulau, beda pulau, dan kode asing dianggap jauh", () => {
    expect(zoneByRegion("35.73", "35.73")).toBe(0);
    expect(zoneByRegion("35.73", "32.73")).toBe(1);
    expect(zoneByRegion("35.73", "51.71")).toBe(2);
    expect(zoneByRegion("35.73", "99.99")).toBe(2);
  });

  it("menandai hasil sebagai estimasi dan menyediakan opsi kilat yang lebih mahal", () => {
    const [reg, kilat] = estimateOptions("65141", "65145", 800);
    expect(reg.estimate && kilat.estimate).toBe(true);
    expect(kilat.price).toBeGreaterThan(reg.price);
  });
});

describe("parseBiteshipRates", () => {
  const json = {
    pricing: [
      { courier_code: "jne", courier_name: "JNE", courier_service_code: "reg", courier_service_name: "Reguler", duration: "2 - 3 days", price: 15000 },
      { courier_code: "jnt", courier_name: "J&T", courier_service_code: "ez", courier_service_name: "EZ", duration: "1 - 2 days", price: 12100 },
      { courier_code: "jne", courier_name: "JNE", courier_service_code: "reg", price: 99999 }, // duplikat id
      { courier_code: "sicepat", courier_service_code: "best", price: 0 }, // tanpa harga
      { courier_service_code: "x", price: 5000 }, // tanpa kode kurir
    ],
  };

  it("memetakan, menerapkan margin, mengurutkan termurah, dan membuang entri tak valid", () => {
    const r = parseBiteshipRates(json, NO_MARGIN);
    expect(r.map((o) => o.id)).toEqual(["jnt:ez", "jne:reg"]);
    expect(r[0]).toMatchObject({ name: "J&T EZ", eta: "1–2 hari", cost: 12500 });
    expect(r[1].cost).toBe(15000);
  });

  it("menghasilkan daftar kosong untuk respons yang tidak dikenal", () => {
    expect(parseBiteshipRates(null, NO_MARGIN)).toEqual([]);
    expect(parseBiteshipRates({ pricing: "x" }, NO_MARGIN)).toEqual([]);
  });
});
