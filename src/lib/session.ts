import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/** Sesi saat ini (atau null). Membaca header/cookie, jadi pemanggilnya harus di dalam <Suspense>. */
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

export async function requireUser(next: string) {
  const session = await getSession();
  if (!session) redirect(`/masuk?next=${encodeURIComponent(next)}`);
  // Admin tidak boleh mengakses halaman/aksi user/pembeli
  if (!next.startsWith("/admin") && (session.user as { role?: string }).role === "ADMIN") {
    redirect("/admin");
  }
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser("/admin");
  if ((user as { role?: string }).role !== "ADMIN") redirect("/");
  return user;
}

/** Hanya menerima jalur internal agar tidak jadi open redirect (mis. //evil.com atau https://...). */
export function safeNext(next: string | string[] | undefined): string {
  const v = Array.isArray(next) ? next[0] : next;
  return v && v.startsWith("/") && !v.startsWith("//") && !v.includes("\\") ? v : "/";
}
