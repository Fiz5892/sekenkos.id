"use server";

import { listDistricts, listRegencies, listVillages, type Option, type VillageOption } from "@/lib/wilayah";

// Data wilayah bersifat publik, jadi tidak perlu login. Dipanggil dari pemilih alamat bertingkat.
export async function getRegencies(provinceCode: string): Promise<Option[]> {
  return listRegencies(String(provinceCode));
}

export async function getDistricts(regencyCode: string): Promise<Option[]> {
  return listDistricts(String(regencyCode));
}

export async function getVillages(districtCode: string): Promise<VillageOption[]> {
  return listVillages(String(districtCode));
}
