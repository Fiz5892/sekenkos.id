-- Alamat terstruktur (provinsi > kota/kabupaten > kecamatan > desa/kelurahan). Kolom lama `city` tetap
-- berisi kabupaten/kota. Baris yang sudah ada mendapat nilai kosong dan tetap tampil apa adanya.
ALTER TABLE "addresses"
  ADD COLUMN "province" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "district" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "village" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "villageCode" TEXT NOT NULL DEFAULT '';

ALTER TABLE "orders"
  ADD COLUMN "shipVillage" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "shipDistrict" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "shipProvince" TEXT NOT NULL DEFAULT '';
