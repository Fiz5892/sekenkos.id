import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetForm } from "@/components/auth/reset-form";

export const metadata: Metadata = { title: "Password Baru", robots: { index: false } };

export default function ResetPasswordPage(props: PageProps<"/reset-password">) {
  return (
    <AuthShell title="Password baru" subtitle="Buat password baru untuk akunmu">
      <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-header" aria-label="Memuat" />}>
        <Reset searchParams={props.searchParams} />
      </Suspense>
    </AuthShell>
  );
}

async function Reset({ searchParams }: Pick<PageProps<"/reset-password">, "searchParams">) {
  const { token } = await searchParams;
  return <ResetForm token={typeof token === "string" ? token : ""} />;
}
