"use client";

import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { Field, FormError, SubmitButton } from "./field";

export function ResetForm({ token }: { token: string }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const newPassword = String(form.get("password"));
    if (newPassword.length < 8) return setError("Password minimal 8 karakter.");
    if (newPassword !== form.get("password2")) return setError("Konfirmasi password tidak sama.");

    setPending(true);
    const { error } = await authClient.resetPassword({ newPassword, token });
    setPending(false);
    if (error) return setError(authErrorMessage(error));
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- navigasi penuh, lihat login-form
    window.location.assign("/masuk?reset=1");
  }

  if (!token)
    return (
      <p role="alert" className="rounded-lg bg-danger/10 p-4 text-sm text-danger">
        Tautan reset tidak valid atau sudah kedaluwarsa.{" "}
        <Link href="/lupa-password" className="underline">
          Minta tautan baru
        </Link>
        .
      </p>
    );

  return (
    <form method="post" onSubmit={onSubmit} noValidate>
      <FormError message={error} />
      <Field id="password" label="Password baru" type="password" autoComplete="new-password" minLength={8} hint="Minimal 8 karakter" />
      <Field id="password2" label="Ulangi password baru" type="password" autoComplete="new-password" />
      <SubmitButton pending={pending}>Simpan password baru</SubmitButton>
    </form>
  );
}
