import { describe, expect, it } from "vitest";
import { CART_MAX_LINES, CART_MAX_QTY, addLine, cartCount, parseCart, removeLine, serializeCart, setLineQty } from "./cart";

describe("parseCart", () => {
  it("kosong atau rusak menghasilkan keranjang kosong", () => {
    expect(parseCart(undefined)).toEqual([]);
    expect(parseCart("bukan json")).toEqual([]);
    expect(parseCart('{"id":"a"}')).toEqual([]);
  });

  it("membuang entri tidak valid dan menggabungkan id kembar", () => {
    const raw = JSON.stringify([
      { id: "a", qty: 1 },
      { id: "a", qty: 2 },
      { id: "", qty: 1 },
      { id: "b", qty: 0 },
      { id: "c", qty: "2" },
      null,
      { id: "d", qty: 3 },
    ]);
    expect(parseCart(raw)).toEqual([
      { id: "a", qty: 3 },
      { id: "d", qty: 3 },
    ]);
  });

  it("membatasi jumlah per barang dan jumlah baris", () => {
    expect(parseCart(JSON.stringify([{ id: "a", qty: 9999 }]))).toEqual([{ id: "a", qty: CART_MAX_QTY }]);
    const many = Array.from({ length: 100 }, (_, i) => ({ id: `p${i}`, qty: 1 }));
    expect(parseCart(JSON.stringify(many))).toHaveLength(CART_MAX_LINES);
  });

  it("serialize lalu parse mengembalikan isi yang sama", () => {
    const lines = [{ id: "a", qty: 2 }];
    expect(parseCart(serializeCart(lines))).toEqual(lines);
  });
});

describe("operasi keranjang", () => {
  it("addLine menambah dan tidak melewati stok", () => {
    expect(addLine([], "a", 1, 1)).toEqual([{ id: "a", qty: 1 }]);
    expect(addLine([{ id: "a", qty: 1 }], "a", 1, 1)).toEqual([{ id: "a", qty: 1 }]);
    expect(addLine([{ id: "a", qty: 1 }], "a", 2, 5)).toEqual([{ id: "a", qty: 3 }]);
  });

  it("addLine menolak barang bila stok 0", () => {
    expect(addLine([], "a", 1, 0)).toEqual([]);
  });

  it("setLineQty mengubah dan menghapus bila 0", () => {
    expect(setLineQty([{ id: "a", qty: 1 }], "a", 3, 5)).toEqual([{ id: "a", qty: 3 }]);
    expect(setLineQty([{ id: "a", qty: 1 }], "a", 9, 2)).toEqual([{ id: "a", qty: 2 }]);
    expect(setLineQty([{ id: "a", qty: 1 }], "a", 0)).toEqual([]);
  });

  it("removeLine dan cartCount", () => {
    const lines = [
      { id: "a", qty: 2 },
      { id: "b", qty: 1 },
    ];
    expect(removeLine(lines, "a")).toEqual([{ id: "b", qty: 1 }]);
    expect(cartCount(lines)).toBe(3);
  });
});
