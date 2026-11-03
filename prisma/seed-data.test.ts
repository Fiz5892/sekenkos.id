import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { categories, products } from "./seed-data";

const publicDir = path.resolve(__dirname, "../public");

describe("seed-data", () => {
  it("memuat 6 kategori dan 13 produk dari website lama", () => {
    expect(categories).toHaveLength(6);
    expect(products).toHaveLength(13);
  });

  it("slug kategori dan produk unik", () => {
    expect(new Set(categories.map((c) => c.slug)).size).toBe(categories.length);
    expect(new Set(products.map((p) => p.slug)).size).toBe(products.length);
  });

  it("setiap produk merujuk kategori yang ada", () => {
    const slugs = new Set(categories.map((c) => c.slug));
    for (const p of products) expect(slugs.has(p.category), p.slug).toBe(true);
  });

  it("harga dan stok valid", () => {
    for (const p of products) {
      expect(Number.isInteger(p.price) && p.price > 0, `${p.slug} price`).toBe(true);
      expect(Number.isInteger(p.stock) && p.stock >= 0, `${p.slug} stock`).toBe(true);
    }
  });

  it("file gambar ada di public/", () => {
    for (const file of [...products.map((p) => p.image), ...categories.map((c) => c.icon)]) {
      expect(existsSync(path.join(publicDir, file)), file).toBe(true);
    }
  });
});
