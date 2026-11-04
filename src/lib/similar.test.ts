import { describe, expect, it } from "vitest";
import { editDistance, queryTokens, rankSimilar, suggestSpelling, tokenize, wordMatch, type SimilarCandidate } from "./similar";

const item = (name: string, category: string, extra: Partial<SimilarCandidate> = {}): SimilarCandidate => ({
  id: name,
  name,
  description: "",
  popularity: 50,
  stock: 1,
  category: { slug: category.toLowerCase(), name: category },
  ...extra,
});

const CATALOG = [
  item("Kemeja Polo Hijau", "Pakaian"),
  item("Kipas Angin Meja", "Elektronik"),
  item("Sunglasses", "Aksesori"),
  item("Handmade Vase", "Dekorasi", { description: "Vas keramik buatan tangan." }),
  item("Rak Sepatu 2 Susun", "Perabot"),
  item("Ember Merah", "Kebersihan", { popularity: 90 }),
  item("Pengki Gagang Panjang", "Kebersihan"),
];

const names = (r: { items: SimilarCandidate[] }) => r.items.map((i) => i.name);

describe("tokenize & queryTokens", () => {
  it("menyatukan frasa dan membuang kata umum", () => {
    expect(tokenize("Rice Cooker mini")).toEqual(["ricecooker", "mini"]);
    expect(queryTokens("kipas murah yang bagus")).toEqual(["kipas"]);
  });
});

describe("editDistance & wordMatch", () => {
  it("menghitung salah ketik dan pertukaran huruf", () => {
    expect(editDistance("kemja", "kemeja")).toBe(1);
    expect(editDistance("kipsa", "kipas")).toBe(1);
    expect(editDistance("meja", "sepatu", 2)).toBe(3);
  });

  it("membedakan persis, awalan, sinonim, dan salah ketik", () => {
    expect(wordMatch("kemeja", "kemeja")).toBe(1);
    expect(wordMatch("kemej", "kemeja")).toBe(0.85);
    expect(wordMatch("fan", "kipas")).toBe(0.8);
    expect(wordMatch("kemja", "kemeja")).toBe(0.7);
    expect(wordMatch("meja", "ember")).toBe(0);
    expect(wordMatch("kacamata", "kaca")).toBe(0);
  });
});

describe("rankSimilar", () => {
  it("menemukan barang walau kata kuncinya salah ketik", () => {
    const r = rankSimilar("kemja", CATALOG);
    expect(r.kind).toBe("similar");
    expect(names(r)[0]).toBe("Kemeja Polo Hijau");
    expect(r.suggestion).toBe("kemeja");
  });

  it("memakai sinonim lintas bahasa", () => {
    expect(names(rankSimilar("kacamata", CATALOG))[0]).toBe("Sunglasses");
    expect(names(rankSimilar("vas bunga", CATALOG))[0]).toBe("Handmade Vase");
  });

  it("menawarkan barang sekategori untuk barang yang belum ada", () => {
    // Tidak ada jaket, tapi jaket termasuk pakaian.
    expect(names(rankSimilar("jaket", CATALOG))).toEqual(["Kemeja Polo Hijau"]);
    // Sapu tidak ada, pengki satu kelompok dengannya; barang kebersihan lain menyusul.
    expect(names(rankSimilar("sapu", CATALOG)).slice(0, 2)).toEqual(["Pengki Gagang Panjang", "Ember Merah"]);
  });

  it("mengembalikan barang populer bila tidak ada yang mirip", () => {
    const r = rankSimilar("xyzzy", CATALOG, 2);
    expect(r.kind).toBe("popular");
    expect(names(r)[0]).toBe("Ember Merah");
  });

  it("mendahulukan barang yang masih ada stoknya saat skor seri", () => {
    const r = rankSimilar("kebersihan", [item("Ember A", "Kebersihan", { stock: 0, popularity: 99 }), item("Ember B", "Kebersihan")]);
    expect(names(r)).toEqual(["Ember B", "Ember A"]);
  });
});

describe("suggestSpelling", () => {
  it("tidak menyarankan apa pun untuk kata yang sudah dikenal", () => {
    expect(suggestSpelling("kipas", ["kipas", "angin"])).toBeUndefined();
    expect(suggestSpelling("kpas angn", ["kipas", "angin"])).toBe("kipas angin");
  });
});
