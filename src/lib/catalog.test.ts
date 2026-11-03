import { describe, expect, it } from "vitest";
import { buildWhere, parseCatalogQuery } from "./catalog";

describe("parseCatalogQuery", () => {
  it("memakai nilai bawaan saat kosong", () => {
    expect(parseCatalogQuery({})).toEqual({ q: "", kategori: "", kondisi: [], ukuran: [], min: undefined, max: undefined, urut: "terbaru" });
  });

  it("menerima satu atau banyak nilai untuk kondisi dan ukuran", () => {
    const q = parseCatalogQuery({ kondisi: ["baru", "bekas-baik"], ukuran: "M" });
    expect(q.kondisi).toEqual(["BARU", "BEKAS_BAIK"]);
    expect(q.ukuran).toEqual(["M"]);
  });

  it("mengabaikan nilai yang tidak dikenal", () => {
    const q = parseCatalogQuery({ kondisi: "rusak", urut: "acak", min: "-5", max: "abc" });
    expect(q.kondisi).toEqual([]);
    expect(q.urut).toBe("terbaru");
    expect(q.min).toBeUndefined();
    expect(q.max).toBeUndefined();
  });

  it("membatasi panjang kata kunci", () => {
    expect(parseCatalogQuery({ q: "a".repeat(500) }).q).toHaveLength(80);
  });
});

describe("buildWhere", () => {
  it("selalu hanya produk aktif", () => {
    expect(buildWhere(parseCatalogQuery({}))).toEqual({ status: "ACTIVE" });
  });

  it("menggabungkan filter harga, kategori, dan kondisi", () => {
    const where = buildWhere(parseCatalogQuery({ kategori: "dekorasi", min: "10000", max: "50000", kondisi: "baru" }));
    expect(where).toMatchObject({
      status: "ACTIVE",
      category: { slug: "dekorasi" },
      condition: { in: ["BARU"] },
      price: { gte: 10000, lte: 50000 },
    });
  });

  it("pencarian mencakup nama, deskripsi, dan kategori", () => {
    const where = buildWhere(parseCatalogQuery({ q: "vas" }));
    expect(where.OR).toHaveLength(3);
  });
});
