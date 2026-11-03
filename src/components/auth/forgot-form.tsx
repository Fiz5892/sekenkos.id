"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { Field, FormError, SubmitButton } from "./field";

export function ForgotForm() {
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setPending(true);
    const email = String(new FormData(e.currentTarget).get("email")).trim().toLowerCase();
    const { error } = await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
    setPending(false);
    if (error) return setError(authErrorMessage(error));
    setSent(true);
  }

  // Pesan sama untuk email terdaftar maupun tidak, agar tidak bisa dipakai menebak akun yang ada.
  if (sent)
    return (
      <p role="status" className="rounded-lg bg-header p-4 text-sm">
        Jika email itu terdaftar, tautan untuk membuat password baru sudah dikirim. Tautannya berlaku 1 jam.
      </p>
    );

  return (
    <form method="post" onSubmit={onSubmit} noValidate>
      <FormError message={error} />
      <Field id="email" label="Email terdaftar" type="email" autoComplete="email" />
      <SubmitButton pending={pending}>Kirim tautan reset</SubmitButton>
    </form>
  );
}
