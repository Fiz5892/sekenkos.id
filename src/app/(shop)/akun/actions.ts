"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

const text = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : "");

const profile = z.object({ name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(80) });
const address = z.object({
  recipient: z.string().trim().min(2).max(80),
  phone: z.string().transform((v) => v.replace(/[\s-]/g, "")).pipe(z.string().regex(/^(0|\+62)\d{8,13}$/)),
  street: z.string().trim().min(5).max(200),
  city: z.string().trim().min(2).max(80),
  zip: z.string().trim().regex(/^\d{5}$/),
});

export async function saveProfile(formData: FormData) {
  const user = await requireUser("/akun");
  if ((user as { role?: string }).role === "ADMIN") redirect("/admin");

  const p = profile.safeParse({ name: text(formData.get("name")) });
  if (!p.success) redirect("/akun?galat=nama");
  await db.user.update({ where: { id: user.id }, data: { name: p.data.name } });

  // Alamat bersifat opsional di sini: kosong semua berarti tidak diubah.
  const raw = Object.fromEntries(["recipient", "phone", "street", "city", "zip"].map((k) => [k, text(formData.get(k))]));
  if (Object.values(raw).some((v) => v.trim())) {
    const a = address.safeParse(raw);
    if (!a.success) redirect("/akun?galat=alamat");
    const existing = await db.address.findFirst({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });
    if (existing) await db.address.update({ where: { id: existing.id }, data: a.data });
    else await db.address.create({ data: { userId: user.id, ...a.data } });
  }
  redirect("/akun?tersimpan=1");
}
