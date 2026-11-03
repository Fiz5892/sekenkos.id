"use client";

import Link from "next/link";
import { useState } from "react";
import { mergeGuestCart } from "@/app/(shop)/keranjang/actions";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { Field, FormError, SubmitButton } from "./field";

export function LoginForm({ next }: { next: string }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(e.currentTarget);
    const { data, error } = await authClient.signIn.email({
      email: String(form.get("email")).trim().toLowerCase(),
      password: String(form.get("password")),
    });
    setPending(false);
    if (error) return setError(authErrorMessage(error));

    // Admin tidak memiliki halaman user, langsung redirect ke dashboard admin
    const userRole = (data?.user as { role?: string } | undefined)?.role;
    if (userRole === "ADMIN") {
      window.location.assign("/admin");
      return;
    }

    // Pindahkan keranjang pengunjung ke akun; kegagalan tidak boleh menghalangi login.
    await mergeGuestCart().catch(() => {});
    // Navigasi penuh agar semua bagian halaman (mis. header) dirender ulang dengan sesi baru.
    window.location.assign(next);
  }

  return (
    <form method="post" onSubmit={onSubmit} noValidate>
      <FormError message={error} />
      <Field id="email" label="Email" type="email" autoComplete="email" />
      <Field id="password" label="Password" type="password" autoComplete="current-password" />
      <div className="mb-4 text-right text-sm">
        <Link href="/lupa-password" className="text-brand hover:underline">
          Lupa Password?
        </Link>
      </div>
      <SubmitButton pending={pending}>Login</SubmitButton>
    </form>
  );
}
