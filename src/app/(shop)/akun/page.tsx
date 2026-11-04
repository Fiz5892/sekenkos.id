import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AccountTabs } from "@/components/account-tabs";
import { AddressPicker } from "@/components/address-picker";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { chainFor, listProvinces } from "@/lib/wilayah";
import { saveProfile } from "./actions";

export const metadata: Metadata = { title: "Akun Saya", robots: { index: false } };

const input = "w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-brand";

export default function AkunPage(props: PageProps<"/akun">) {
  return (
    <div className="mx-auto w-[min(720px,100%-32px)] py-8">
      <h1 className="mb-4 text-3xl font-bold">Akun Saya</h1>
      <AccountTabs active="profil" />
      <Suspense fallback={<div className="h-80 animate-pulse rounded-card bg-header" aria-label="Memuat" />}>
        <Profil searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Profil({ searchParams }: Pick<PageProps<"/akun">, "searchParams">) {
  const user = await requireUser("/akun");
  if ((user as { role?: string }).role === "ADMIN") redirect("/admin");
  const params = await searchParams;
  const address = await db.address.findFirst({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });
  // Alamat lama (sebelum alamat terstruktur) tidak punya kode desa: wilayahnya perlu dipilih ulang.
  const chain = address?.villageCode ? await chainFor(address.villageCode) : null;
  const initialPlace = address && chain ? { villageCode: address.villageCode, zip: address.zip, ...chain } : null;

  return (
    <form action={saveProfile} className="grid gap-4 rounded-card border border-line p-5">
      {params.tersimpan && (
        <p role="status" className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
          Perubahan disimpan.
        </p>
      )}
      {params.galat && (
        <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {params.galat === "nama" ? "Nama minimal 2 karakter." : "Alamat belum lengkap atau tidak valid: periksa nomor HP, pilihan wilayah sampai desa / kelurahan, dan kode pos (5 digit)."}
        </p>
      )}
      <label className="grid gap-1 text-sm">
        <span className="font-bold">Nama</span>
        <input name="name" defaultValue={user.name} required className={input} />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-bold">Email</span>
        <input value={user.email} disabled className={`${input} bg-header`} />
      </label>

      <h2 className="mt-2 text-lg font-bold">Alamat pengiriman tersimpan</h2>
      <p className="-mt-3 text-sm text-muted">Dipakai untuk mengisi otomatis saat checkout. Kosongkan semua kolom bila tidak ingin mengubah.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-bold">Nama penerima</span>
          <input name="recipient" defaultValue={address?.recipient} className={input} />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-bold">Nomor HP</span>
          <input name="phone" defaultValue={address?.phone} type="tel" className={input} />
        </label>
      </div>
      {address && !initialPlace && (
        <p className="rounded-lg bg-header px-3 py-2 text-sm">
          Alamat tersimpan ({address.city}) dibuat sebelum alamat terstruktur. Pilih ulang wilayahnya agar ongkir lebih akurat.
        </p>
      )}
      <AddressPicker provinces={listProvinces()} initial={initialPlace} required={false} />
      <label className="grid gap-1 text-sm">
        <span className="font-bold">Detail alamat</span>
        <textarea name="street" defaultValue={address?.street} rows={2} placeholder="Nama jalan, nomor rumah, RT/RW, patokan" className={input} />
      </label>
      <button className="w-fit rounded-full bg-foreground px-6 py-2.5 font-bold text-white hover:bg-black">Simpan</button>
    </form>
  );
}
