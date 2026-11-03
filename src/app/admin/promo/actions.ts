"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

const text = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : "");

const schema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{3,20}$/, "Kode 3–20 karakter, hanya huruf dan angka."),
  percent: z.coerce.number().int().min(1, "Diskon minimal 1%.").max(90, "Diskon maksimal 90%."),
  quota: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.number().int().min(1).max(100000).optional()),
  validUntil: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.date().optional()),
});

export async function createPromo(formData: FormData) {
  await requireAdmin();
  const parsed = schema.safeParse({
    code: text(formData.get("code")),
    percent: text(formData.get("percent")),
    quota: text(formData.get("quota")),
    validUntil: text(formData.get("validUntil")),
  });
  if (!parsed.success) redirect(`/admin/promo?galat=${encodeURIComponent(parsed.error.issues[0].message)}`);
  const d = parsed.data;

  if (await db.promo.findUnique({ where: { code: d.code }, select: { id: true } })) {
    redirect(`/admin/promo?galat=${encodeURIComponent(`Kode ${d.code} sudah ada.`)}`);
  }
  // Berlaku sampai akhir hari yang dipilih (WIB).
  const validUntil = d.validUntil ? new Date(`${d.validUntil.toISOString().slice(0, 10)}T23:59:59+07:00`) : null;
  await db.promo.create({
    data: { code: d.code, percent: d.percent, quota: d.quota ?? null, validUntil, firstPurchaseOnly: formData.get("firstPurchaseOnly") === "on" },
  });
  redirect("/admin/promo");
}

export async function togglePromo(formData: FormData) {
  await requireAdmin();
  const id = text(formData.get("id"));
  const p = await db.promo.findUnique({ where: { id }, select: { active: true } });
  if (p) await db.promo.update({ where: { id }, data: { active: !p.active } });
  redirect("/admin/promo");
}
