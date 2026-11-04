import { describe, expect, it } from "vitest";
import { chainFor, listDistricts, listProvinces, listRegencies, listVillages, resolveVillage } from "./wilayah";

describe("daftar wilayah", () => {
  it("memuat 38 provinsi, termasuk Jawa Timur", () => {
    const p = listProvinces();
    expect(p).toHaveLength(38);
    expect(p).toContainEqual({ code: "35", name: "Jawa Timur" });
  });

  it("menurun dari provinsi sampai desa beserta kode pos", async () => {
    const regencies = await listRegencies("35");
    expect(regencies).toContainEqual({ code: "35.73", name: "Kota Malang" });
    const districts = await listDistricts("35.73");
    expect(districts.map((d) => d.name)).toContain("Lowokwaru");
    const lowokwaru = districts.find((d) => d.name === "Lowokwaru")!;
    const villages = await listVillages(lowokwaru.code);
    expect(villages).toContainEqual(expect.objectContaining({ name: "Tlogomas", zip: "65144" }));
  });

  it("mengembalikan daftar kosong untuk kode yang tidak dikenal atau berbentuk aneh", async () => {
    expect(await listRegencies("99")).toEqual([]);
    expect(await listRegencies("__proto__")).toEqual([]);
    expect(await listDistricts("35.99")).toEqual([]);
    expect(await listDistricts("abc")).toEqual([]);
    expect(await listVillages("35.73.99")).toEqual([]);
  });
});

describe("resolveVillage", () => {
  it("menurunkan nama provinsi, kota, kecamatan, desa, dan kode pos dari kode desa", async () => {
    const lowokwaru = (await listDistricts("35.73")).find((d) => d.name === "Lowokwaru")!;
    const tlogomas = (await listVillages(lowokwaru.code)).find((v) => v.name === "Tlogomas")!;
    expect(await resolveVillage(tlogomas.code)).toEqual({
      provinceCode: "35",
      province: "Jawa Timur",
      regencyCode: "35.73",
      city: "Kota Malang",
      districtCode: lowokwaru.code,
      district: "Lowokwaru",
      villageCode: tlogomas.code,
      village: "Tlogomas",
      zip: "65144",
    });
  });

  it("menolak kode yang tidak ada atau bukan kode desa", async () => {
    expect(await resolveVillage("")).toBeNull();
    expect(await resolveVillage("35.73")).toBeNull();
    expect(await resolveVillage("35.73.01.9999")).toBeNull();
    expect(await resolveVillage("99.99.99.9999")).toBeNull();
  });
});

describe("chainFor", () => {
  it("memberi daftar pilihan tiap tingkat untuk mengisi ulang form", async () => {
    const lowokwaru = (await listDistricts("35.73")).find((d) => d.name === "Lowokwaru")!;
    const village = (await listVillages(lowokwaru.code))[0];
    const chain = await chainFor(village.code);
    expect(chain?.regencies.some((r) => r.code === "35.73")).toBe(true);
    expect(chain?.districts.some((d) => d.code === lowokwaru.code)).toBe(true);
    expect(chain?.villages.some((v) => v.code === village.code)).toBe(true);
    expect(await chainFor("bukan-kode")).toBeNull();
  });
});
