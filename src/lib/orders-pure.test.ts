import { describe, expect, it } from "vitest";
import { generateOrderCode, normalizeOrderCode } from "./order-code";
import { canAdvance, canCancel, nextStep } from "./order-status";
import { calcTotals } from "./pricing";
import { COURIERS, getCourier } from "./shipping";

describe("calcTotals", () => {
  it("menghitung diskon persen, ongkir, dan total", () => {
    expect(calcTotals(100000, 10000, 10)).toEqual({ subtotal: 100000, discount: 10000, shipping: 10000, total: 100000 });
  });

  it("tanpa promo diskonnya nol", () => {
    expect(calcTotals(35000, 9000)).toEqual({ subtotal: 35000, discount: 0, shipping: 9000, total: 44000 });
  });

  it("membulatkan diskon ke rupiah dan tidak pernah melebihi subtotal", () => {
    expect(calcTotals(12345, 0, 10).discount).toBe(1235);
    expect(calcTotals(5000, 0, 250).discount).toBe(5000);
    expect(calcTotals(5000, 0, -5).discount).toBe(0);
  });
});

describe("status pesanan", () => {
  it("hanya maju satu langkah sesuai urutan", () => {
    expect(canAdvance("PENDING_PAYMENT", "PAID")).toBe(true);
    expect(canAdvance("PENDING_PAYMENT", "SHIPPED")).toBe(false);
    expect(canAdvance("PAID", "PAID")).toBe(false);
    expect(canAdvance("CANCELLED", "PAID")).toBe(false);
  });

  it("pembatalan hanya sebelum dikirim", () => {
    expect(canCancel("PENDING_PAYMENT")).toBe(true);
    expect(canCancel("PACKED")).toBe(true);
    expect(canCancel("SHIPPED")).toBe(false);
    expect(canCancel("RECEIVED")).toBe(false);
  });

  it("nextStep menawarkan langkah berikutnya, dan tidak ada setelah selesai", () => {
    expect(nextStep("PAID")?.to).toBe("PACKED");
    expect(nextStep("RECEIVED")).toBeNull();
    expect(nextStep("CANCELLED")).toBeNull();
  });
});

describe("kode pesanan", () => {
  it("berbentuk PLY- diikuti 6 karakter tanpa huruf/angka ambigu", () => {
    for (let i = 0; i < 200; i++) expect(generateOrderCode()).toMatch(/^PLY-[A-HJ-NP-Z2-9]{6}$/);
  });

  it("normalisasi input pengguna", () => {
    expect(normalizeOrderCode(" ply-7k3m9q ")).toBe("PLY-7K3M9Q");
    expect(normalizeOrderCode("PLY7K3M9Q")).toBe("PLY-7K3M9Q");
    expect(normalizeOrderCode("7k3m9q")).toBe("PLY-7K3M9Q");
    expect(normalizeOrderCode("PLY-0O1I2")).toBeNull();
    expect(normalizeOrderCode("")).toBeNull();
  });
});

describe("kurir", () => {
  it("pengambilan di tempat gratis, kurir tak dikenal ditolak", () => {
    expect(getCourier("pickup")?.cost).toBe(0);
    expect(getCourier("rahasia")).toBeUndefined();
    expect(COURIERS.length).toBeGreaterThan(0);
  });
});
