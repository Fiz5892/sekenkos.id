import { describe, expect, it } from "vitest";
import { isAllowedImage } from "./image-url";
import { slugify } from "./slug";

describe("slugify", () => {
  it("mengubah judul menjadi slug URL", () => {
    expect(slugify("Kemeja Polo Hijau!")).toBe("kemeja-polo-hijau");
    expect(slugify("  Rak Sepatu 2 Susun  ")).toBe("rak-sepatu-2-susun");
    expect(slugify("Café ÉLÉGANT")).toBe("cafe-elegant");
    expect(slugify("!!!")).toBe("");
  });
});

describe("isAllowedImage", () => {
  const host = "abc.supabase.co";
  it("menerima aset lokal dan file publik Supabase proyek ini", () => {
    expect(isAllowedImage("/assets/vase.jpg", host)).toBe(true);
    expect(isAllowedImage("/img/cm3x9k2l0000abcd1234efgh", host)).toBe(true);
    expect(isAllowedImage("https://abc.supabase.co/storage/v1/object/public/products/a.jpg", host)).toBe(true);
  });

  it("menolak host lain, protokol non-https, path traversal, dan bukan URL", () => {
    expect(isAllowedImage("https://evil.example/a.jpg", host)).toBe(false);
    expect(isAllowedImage("http://abc.supabase.co/storage/v1/object/public/p/a.jpg", host)).toBe(false);
    expect(isAllowedImage("https://abc.supabase.co/other/a.jpg", host)).toBe(false);
    expect(isAllowedImage("/assets/../secret.txt", host)).toBe(false);
    expect(isAllowedImage("javascript:alert(1)", host)).toBe(false);
    expect(isAllowedImage("sembarang", host)).toBe(false);
    expect(isAllowedImage("/img/../../etc/passwd", host)).toBe(false);
    expect(isAllowedImage("/img/ABC", host)).toBe(false);
  });

  it("tanpa Supabase terkonfigurasi hanya aset lokal yang diterima", () => {
    expect(isAllowedImage("https://abc.supabase.co/storage/v1/object/public/p/a.jpg", undefined)).toBe(false);
    expect(isAllowedImage("/assets/mat.png", undefined)).toBe(true);
  });
});
