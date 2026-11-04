"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { resolveVillage } from "@/lib/wilayah";

const text = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : "");

const profile = z.object({ name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(80) });
const address = z.object({
  recipient: z.string().trim().min(2).max(80),
  phone: z.string().transform((v) => v.replace(/[\s-]/g, "")).pipe(z.string().regex(/^(0|\+62)\d{8,13}$/)),
  street: z.string().trim().min(5).max(200),
  zip: z.string().trim().regex(/^\d{5}$/),
});

export async function saveProfile(formData: FormData) {
  const user = await requireUser("/akun");
  if ((user as { role?: string }).role === "ADMIN") redirect("/admin");

  const p = profile.safeParse({ name: text(formData.get("name")) });
  if (!p.success) redirect("/akun?galat=nama");
  await db.user.update({ where: { id: user.id }, data: { name: p.data.name } });

  // Alamat bersifat opsional di sini: kosong semua berarti tidak diubah.
  const raw = Object.fromEntries(["recipient", "phone", "street", "villageCode", "zip"].map((k) => [k, text(formData.get(k))]));
  if (Object.values(raw).some((v) => v.trim())) {
    const { villageCode, ...rest } = raw;
    const a = address.safeParse(rest);
    // Nama wilayah diturunkan dari kode desa di server.
    const place = await resolveVillage(villageCode);
    if (!a.success || !place) redirect("/akun?galat=alamat");
    const data = {
      ...a.data,
      province: place.province,
      city: place.city,
      district: place.district,
      village: place.village,
      villageCode: place.villageCode,
    };
    const existing = await db.address.findFirst({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });
    if (existing) await db.address.update({ where: { id: existing.id }, data });
    else await db.address.create({ data: { userId: user.id, ...data } });
  }
  redirect("/akun?tersimpan=1");
}
