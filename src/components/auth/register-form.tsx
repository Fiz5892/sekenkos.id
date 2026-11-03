"use client";

import { useState } from "react";
import { mergeGuestCart } from "@/app/(shop)/keranjang/actions";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { Field, FormError, SubmitButton } from "./field";

export function RegisterForm({ next }: { next: string }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name")).trim();
    const email = String(form.get("email")).trim().toLowerCase();
    const password = String(form.get("password"));
    if (!name) return setError("Nama wajib diisi.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Format email tidak valid.");
    if (password.length < 8) return setError("Password minimal 8 karakter.");
    if (password !== form.get("password2")) return setError("Konfirmasi password tidak sama.");

    setPending(true);
    const { error } = await authClient.signUp.email({ name, email, password });
    setPending(false);
    if (error) return setError(authErrorMessage(error));
    // Pindahkan keranjang pengunjung ke akun; kegagalan tidak boleh menghalangi login.
    await mergeGuestCart().catch(() => {});
    // Navigasi penuh agar semua bagian halaman (mis. header) dirender ulang dengan sesi baru.
    window.location.assign(next);
  }

  return (
    <form method="post" onSubmit={onSubmit} noValidate>
      <FormError message={error} />
      <Field id="name" label="Nama lengkap" autoComplete="name" />
      <Field id="email" label="Email" type="email" autoComplete="email" />
      <Field id="password" label="Password" type="password" autoComplete="new-password" minLength={8} hint="Minimal 8 karakter" />
      <Field id="password2" label="Ulangi password" type="password" autoComplete="new-password" />
      <SubmitButton pending={pending}>Daftar</SubmitButton>
    </form>
  );
}
