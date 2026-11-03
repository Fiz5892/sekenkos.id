"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function markHandled(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await db.message.updateMany({ where: { id }, data: { handled: formData.get("handled") === "1" } });
  redirect("/admin/pesan");
}
