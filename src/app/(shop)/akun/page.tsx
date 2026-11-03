import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AccountTabs } from "@/components/account-tabs";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
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

  return (
    <form action={saveProfile} className="grid gap-4 rounded-card border border-line p-5">
      {params.tersimpan && (
        <p role="status" className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
          Perubahan disimpan.
        </p>
      )}
      {params.galat && (
        <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {params.galat === "nama" ? "Nama minimal 2 karakter." : "Alamat belum lengkap atau tidak valid: periksa nomor HP dan kode pos (5 digit)."}
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
      <label className="grid gap-1 text-sm">
        <span className="font-bold">Alamat lengkap</span>
        <textarea name="street" defaultValue={address?.street} rows={2} className={input} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-bold">Kota / Kabupaten</span>
          <input name="city" defaultValue={address?.city} className={input} />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-bold">Kode pos</span>
          <input name="zip" defaultValue={address?.zip} inputMode="numeric" maxLength={5} className={input} />
        </label>
      </div>
      <button className="w-fit rounded-full bg-foreground px-6 py-2.5 font-bold text-white hover:bg-black">Simpan</button>
    </form>
  );
}
