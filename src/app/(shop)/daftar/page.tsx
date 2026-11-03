import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { getSession, safeNext } from "@/lib/session";

export const metadata: Metadata = { title: "Daftar" };

export default function DaftarPage(props: PageProps<"/daftar">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse bg-header" aria-label="Memuat" />}>
      <Daftar searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Daftar({ searchParams }: Pick<PageProps<"/daftar">, "searchParams">) {
  const next = safeNext((await searchParams).next);
  const session = await getSession();
  if (session) {
    if ((session.user as { role?: string }).role === "ADMIN") redirect("/admin");
    redirect(next);
  }

  const qs = next === "/" ? "" : `?next=${encodeURIComponent(next)}`;
  return (
    <AuthShell
      title="Daftar"
      subtitle="Buat akun untuk mulai belanja"
      footer={
        <>
          Sudah punya akun?{" "}
          <Link href={`/masuk${qs}`} className="font-bold text-brand hover:underline">
            Login
          </Link>
        </>
      }
    >
      <RegisterForm next={next} />
    </AuthShell>
  );
}
