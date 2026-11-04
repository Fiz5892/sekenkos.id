// Membangun src/data/wilayah/*.json dari dua berkas SQL sumber (MIT, github.com/cahyadsn):
//   wilayah.sql          kode & nama wilayah (Kepmendagri 300.2.2-2138 Tahun 2025)
//   wilayah_kodepos.sql  kode pos per desa/kelurahan
// Pemakaian: node scripts/build-wilayah.mjs <wilayah.sql> <wilayah_kodepos.sql>
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const [, , wilayahPath, kodeposPath] = process.argv;
if (!wilayahPath || !kodeposPath) {
  console.error("Pemakaian: node scripts/build-wilayah.mjs <wilayah.sql> <wilayah_kodepos.sql>");
  process.exit(1);
}
const OUT = new URL("../src/data/wilayah/", import.meta.url);

const unescape = (s) => s.replace(/\\(.)/g, "$1").replace(/''/g, "'");
const names = new Map();
for (const line of readFileSync(wilayahPath, "utf8").split(/\r?\n/)) {
  const m = line.match(/^\('([\d.]+)',\s*'((?:[^'\\]|\\.|'')*)'\)[,;]?\s*$/);
  if (m) names.set(m[1], unescape(m[2]).trim());
}
const zips = new Map();
for (const line of readFileSync(kodeposPath, "utf8").split(/\r?\n/)) {
  const m = line.match(/^\('([\d.]+)',\s*'(\d{5})'\)/);
  if (m) zips.set(m[1], m[2]);
}

const level = (k) => k.split(".").length; // 1 provinsi, 2 kab/kota, 3 kecamatan, 4 desa
const provinces = new Map(); // kode -> { n, regencies: Map }
for (const [k, n] of [...names].sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true }))) {
  const parts = k.split(".");
  const reg = parts.slice(0, 2).join(".");
  const dist = parts.slice(0, 3).join(".");
  if (level(k) === 1) provinces.set(k, { n, regencies: new Map() });
  else if (level(k) === 2) provinces.get(parts[0])?.regencies.set(k, { n, districts: new Map() });
  else if (level(k) === 3) provinces.get(parts[0])?.regencies.get(reg)?.districts.set(k, { n, villages: [] });
  else provinces.get(parts[0])?.regencies.get(reg)?.districts.get(dist)?.villages.push([k, n, zips.get(k) ?? ""]);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const index = [];
let villages = 0;
let withoutZip = 0;
for (const [pk, p] of provinces) {
  index.push([pk, p.n]);
  // [[kodeKab, nama, [[kodeKec, nama, [[kodeDesa, nama, kodepos], ...]], ...]], ...]
  const regencies = [...p.regencies].map(([rk, r]) => [
    rk,
    r.n,
    [...r.districts].map(([dk, d]) => {
      villages += d.villages.length;
      withoutZip += d.villages.filter((v) => !v[2]).length;
      return [dk, d.n, d.villages];
    }),
  ]);
  writeFileSync(new URL(`${pk}.json`, OUT), JSON.stringify(regencies));
}
const loaders = index
  .map(([k]) => `  "${k}": () => import("./${k}.json") as unknown as Promise<{ default: RawRegency[] }>,`)
  .join("\n");
writeFileSync(
  new URL("loaders.ts", OUT),
  `// Dibuat oleh scripts/build-wilayah.mjs; jangan disunting manual.
export type RawVillage = [kode: string, nama: string, kodepos: string];
export type RawDistrict = [kode: string, nama: string, villages: RawVillage[]];
export type RawRegency = [kode: string, nama: string, districts: RawDistrict[]];

export const provinces = ${JSON.stringify(index)} as [kode: string, nama: string][];

export const loaders: Record<string, () => Promise<{ default: RawRegency[] }>> = {
${loaders}
};
`,
);
console.log(`${provinces.size} provinsi, ${villages} desa/kelurahan (${withoutZip} tanpa kode pos)`);
