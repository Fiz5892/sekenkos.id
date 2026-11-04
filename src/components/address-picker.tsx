"use client";

import { useRef, useState } from "react";
import { getDistricts, getRegencies, getVillages } from "@/lib/wilayah-actions";
import type { Option, VillageOption } from "@/lib/wilayah";

export type PickerInitial = {
  villageCode: string;
  zip: string;
  regencies: Option[];
  districts: Option[];
  villages: VillageOption[];
};
export type PickerValue = { villageCode: string; zip: string };

const input = "w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-brand disabled:bg-header disabled:text-muted";

/**
 * Pilihan alamat bertingkat: provinsi > kota/kabupaten > kecamatan > desa/kelurahan. Kode pos terisi dari
 * desa yang dipilih dan masih bisa diubah. Yang dikirim form hanya `villageCode` dan `zip`; server menurunkan
 * nama wilayah dari kode desa.
 */
export function AddressPicker({
  provinces,
  initial,
  required = true,
  onChange,
}: {
  provinces: Option[];
  initial?: PickerInitial | null;
  required?: boolean;
  onChange?: (v: PickerValue) => void;
}) {
  const [province, setProvince] = useState(initial ? initial.villageCode.slice(0, 2) : "");
  const [regency, setRegency] = useState(initial ? initial.villageCode.slice(0, 5) : "");
  const [district, setDistrict] = useState(initial ? initial.villageCode.slice(0, 8) : "");
  const [village, setVillage] = useState(initial?.villageCode ?? "");
  const [regencies, setRegencies] = useState<Option[]>(initial?.regencies ?? []);
  const [districts, setDistricts] = useState<Option[]>(initial?.districts ?? []);
  const [villages, setVillages] = useState<VillageOption[]>(initial?.villages ?? []);
  const [zip, setZip] = useState(initial?.zip ?? "");
  const [loading, setLoading] = useState<"regency" | "district" | "village" | null>(null);
  const [failed, setFailed] = useState(false);
  const seq = useRef(0); // jawaban untuk pilihan yang sudah diganti diabaikan

  const emit = (villageCode: string, z: string) => onChange?.({ villageCode, zip: z });

  async function fetchList<T>(kind: "regency" | "district" | "village", run: () => Promise<T[]>, set: (v: T[]) => void) {
    const mine = ++seq.current;
    setLoading(kind);
    setFailed(false);
    try {
      const list = await run();
      if (mine === seq.current) set(list);
    } catch {
      if (mine === seq.current) setFailed(true);
    } finally {
      if (mine === seq.current) setLoading(null);
    }
  }

  const clearFrom = (level: "regency" | "district" | "village") => {
    if (level === "regency") {
      setRegency("");
      setRegencies([]);
    }
    if (level !== "village") {
      setDistrict("");
      setDistricts([]);
    }
    setVillage("");
    setVillages([]);
    setZip("");
    emit("", "");
  };

  const pickProvince = (code: string) => {
    setProvince(code);
    clearFrom("regency");
    if (code) void fetchList("regency", () => getRegencies(code), setRegencies);
  };
  const pickRegency = (code: string) => {
    setRegency(code);
    clearFrom("district");
    if (code) void fetchList("district", () => getDistricts(code), setDistricts);
  };
  const pickDistrict = (code: string) => {
    setDistrict(code);
    clearFrom("village");
    if (code) void fetchList("village", () => getVillages(code), setVillages);
  };
  const pickVillage = (code: string) => {
    setVillage(code);
    const z = villages.find((v) => v.code === code)?.zip ?? "";
    setZip(z);
    emit(code, z);
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Provinsi">
          <select value={province} onChange={(e) => pickProvince(e.target.value)} required={required} className={input}>
            <option value="">Pilih provinsi</option>
            {provinces.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Kota / Kabupaten">
          <select value={regency} onChange={(e) => pickRegency(e.target.value)} required={required} disabled={!province} className={input}>
            <option value="">{loading === "regency" ? "Memuat…" : "Pilih kota / kabupaten"}</option>
            {regencies.map((r) => (
              <option key={r.code} value={r.code}>
                {r.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Kecamatan">
          <select value={district} onChange={(e) => pickDistrict(e.target.value)} required={required} disabled={!regency} className={input}>
            <option value="">{loading === "district" ? "Memuat…" : "Pilih kecamatan"}</option>
            {districts.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Desa / Kelurahan">
          <select name="villageCode" value={village} onChange={(e) => pickVillage(e.target.value)} required={required} disabled={!district} className={input}>
            <option value="">{loading === "village" ? "Memuat…" : "Pilih desa / kelurahan"}</option>
            {villages.map((v) => (
              <option key={v.code} value={v.code}>
                {v.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Kode pos">
        <input
          name="zip"
          value={zip}
          onChange={(e) => {
            const z = e.target.value.replace(/\D/g, "").slice(0, 5);
            setZip(z);
            emit(village, z);
          }}
          required={required}
          inputMode="numeric"
          maxLength={5}
          autoComplete="postal-code"
          className={input}
        />
        {village && <span className="text-xs text-muted">Terisi otomatis dari desa yang dipilih. Ubah bila kode posnya berbeda.</span>}
      </Field>
      {failed && (
        <p role="status" className="text-sm text-danger">
          Daftar wilayah belum bisa dimuat. Coba pilih ulang.
        </p>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-bold">{label}</span>
      {children}
    </label>
  );
}
