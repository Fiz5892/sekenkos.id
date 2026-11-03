import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotForm } from "@/components/auth/forgot-form";

export const metadata: Metadata = { title: "Lupa Password" };

export default function LupaPasswordPage() {
  return (
    <AuthShell
      title="Lupa Password"
      subtitle="Kami akan mengirim tautan untuk membuat password baru ke email kamu"
      footer={
        <Link href="/masuk" className="font-bold text-brand hover:underline">
          Kembali ke Login
        </Link>
      }
    >
      <ForgotForm />
    </AuthShell>
  );
}
