import { describe, expect, it } from "vitest";
import { formatRupiah } from "./format";

describe("formatRupiah", () => {
  it("memakai titik sebagai pemisah ribuan tanpa spasi", () => {
    expect(formatRupiah(25000)).toBe("Rp25.000");
    expect(formatRupiah(1250000)).toBe("Rp1.250.000");
  });

  it("menampilkan nol", () => {
    expect(formatRupiah(0)).toBe("Rp0");
  });
});
