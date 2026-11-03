import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getSession, safeNext } from "@/lib/session";

export const metadata: Metadata = { title: "Login" };

export default function MasukPage(props: PageProps<"/masuk">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse bg-header" aria-label="Memuat" />}>
      <Masuk searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Masuk({ searchParams }: Pick<PageProps<"/masuk">, "searchParams">) {
  const params = await searchParams;
  const next = safeNext(params.next);
  const session = await getSession();
  if (session) {
    if ((session.user as { role?: string }).role === "ADMIN") redirect("/admin");
    redirect(next);
  }

  const qs = next === "/" ? "" : `?next=${encodeURIComponent(next)}`;
  return (
    <AuthShell
      title="Login"
      subtitle="Selamat datang kembali di sekenkos.id"
      footer={
        <>
          Belum punya akun?{" "}
          <Link href={`/daftar${qs}`} className="font-bold text-brand hover:underline">
            Daftar
          </Link>
        </>
      }
    >
      {params.reset && (
        <p role="status" className="mb-4 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
          Password berhasil diubah. Silakan login dengan password baru.
        </p>
      )}
      <LoginForm next={next} />
    </AuthShell>
  );
}
