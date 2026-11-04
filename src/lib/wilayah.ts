import "server-only";
import { loaders, provinces, type RawRegency } from "@/data/wilayah/loaders";

/*
 * Data wilayah Indonesia (provinsi > kabupaten/kota > kecamatan > desa/kelurahan beserta kode pos) dari
 * Kepmendagri 300.2.2-2138 Tahun 2025, disimpan per provinsi di src/data/wilayah (lihat scripts/build-wilayah.mjs).
 * Pembeli memilih wilayah lewat server action; server menurunkan nama & kode pos dari kode desa yang dipilih,
 * jadi kota/kecamatan yang dikirim klien tidak pernah dipercaya begitu saja.
 */
export type Option = { code: string; name: string };
export type VillageOption = Option & { zip: string };
export type Resolved = {
  provinceCode: string;
  province: string;
  regencyCode: string;
  city: string;
  districtCode: string;
  district: string;
  villageCode: string;
  village: string;
  zip: string;
};

const VILLAGE_CODE = /^\d{2}\.\d{2}\.\d{2}\.\d{4}$/;
const DISTRICT_CODE = /^\d{2}\.\d{2}\.\d{2}$/;
const REGENCY_CODE = /^\d{2}\.\d{2}$/;

async function load(provinceCode: string): Promise<RawRegency[]> {
  const loader = Object.hasOwn(loaders, provinceCode) ? loaders[provinceCode] : undefined;
  return loader ? (await loader()).default : [];
}

export const listProvinces = (): Option[] => provinces.map(([code, name]) => ({ code, name }));

export async function listRegencies(provinceCode: string): Promise<Option[]> {
  return (await load(provinceCode)).map(([code, name]) => ({ code, name }));
}

export async function listDistricts(regencyCode: string): Promise<Option[]> {
  if (!REGENCY_CODE.test(regencyCode)) return [];
  const regency = (await load(regencyCode.slice(0, 2))).find((r) => r[0] === regencyCode);
  return (regency?.[2] ?? []).map(([code, name]) => ({ code, name }));
}

export async function listVillages(districtCode: string): Promise<VillageOption[]> {
  if (!DISTRICT_CODE.test(districtCode)) return [];
  const regency = (await load(districtCode.slice(0, 2))).find((r) => r[0] === districtCode.slice(0, 5));
  const district = regency?.[2].find((d) => d[0] === districtCode);
  return (district?.[2] ?? []).map(([code, name, zip]) => ({ code, name, zip }));
}

/** Nama dan kode pos dari kode desa/kelurahan; null bila kodenya tidak ada. */
export async function resolveVillage(villageCode: string): Promise<Resolved | null> {
  if (!VILLAGE_CODE.test(villageCode)) return null;
  const regencyCode = villageCode.slice(0, 5);
  const districtCode = villageCode.slice(0, 8);
  const provinceCode = villageCode.slice(0, 2);
  const province = provinces.find(([k]) => k === provinceCode);
  const regency = (await load(provinceCode)).find((r) => r[0] === regencyCode);
  const district = regency?.[2].find((d) => d[0] === districtCode);
  const village = district?.[2].find((v) => v[0] === villageCode);
  if (!province || !regency || !district || !village) return null;
  return {
    provinceCode,
    province: province[1],
    regencyCode,
    city: regency[1],
    districtCode,
    district: district[1],
    villageCode,
    village: village[1],
    zip: village[2],
  };
}

export type Chain = { regencies: Option[]; districts: Option[]; villages: VillageOption[] };

/** Daftar pilihan untuk mengisi ulang form dari desa yang tersimpan (satu pilihan per tingkat). */
export async function chainFor(villageCode: string): Promise<Chain | null> {
  const r = await resolveVillage(villageCode);
  if (!r) return null;
  const [regencies, districts, villages] = await Promise.all([listRegencies(r.provinceCode), listDistricts(r.regencyCode), listVillages(r.districtCode)]);
  return { regencies, districts, villages };
}
