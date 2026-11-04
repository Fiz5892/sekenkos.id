import { describe, expect, it } from "vitest";
import { formatAddress } from "./address";

describe("formatAddress", () => {
  it("menyusun alamat dari yang paling spesifik ke umum", () => {
    expect(
      formatAddress({ street: "Jl. Veteran 9, RT 1/2", village: "Ketawanggede", district: "Lowokwaru", city: "Kota Malang", province: "Jawa Timur", zip: "65145" }),
    ).toBe("Jl. Veteran 9, RT 1/2, Ketawanggede, Kec. Lowokwaru, Kota Malang, Jawa Timur 65145");
  });

  it("tetap rapi untuk pesanan lama yang belum punya desa, kecamatan, dan provinsi", () => {
    expect(formatAddress({ street: "Jl. Soekarno Hatta No. 9", village: "", district: "", city: "Malang", province: "", zip: "65141" })).toBe("Jl. Soekarno Hatta No. 9, Malang 65141");
    expect(formatAddress({ street: "Jl. A", city: "Malang", zip: "" })).toBe("Jl. A, Malang");
  });
});
