"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";

const text = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : "");

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().max(120),
  body: z.string().trim().min(5).max(2000),
});

export async function sendMessage(formData: FormData) {
  // Kolom "website" disembunyikan dari manusia; bot yang mengisinya diam-diam diabaikan.
  if (text(formData.get("website"))) redirect("/kontak?terkirim=1");

  const parsed = schema.safeParse({ name: text(formData.get("name")), email: text(formData.get("email")), body: text(formData.get("body")) });
  if (!parsed.success) redirect("/kontak?galat=1#form");

  // Batasi 3 pesan per email per 10 menit agar formulir tidak dipakai membanjiri admin.
  const recent = await db.message.count({ where: { email: parsed.data.email.toLowerCase(), createdAt: { gt: new Date(Date.now() - 10 * 60 * 1000) } } });
  if (recent >= 3) redirect("/kontak?galat=batas#form");

  await db.message.create({ data: { ...parsed.data, email: parsed.data.email.toLowerCase() } });
  redirect("/kontak?terkirim=1#form");
}
