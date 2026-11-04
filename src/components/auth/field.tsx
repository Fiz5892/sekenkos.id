"use client";

import { useState, useSyncExternalStore, type ComponentProps } from "react";

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="m3 3 18 18" />}
    </svg>
  );
}

export function Field({ label, hint, id, type, ...props }: { label: string; hint?: string; id: string } & ComponentProps<"input">) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="mb-4 grid gap-1">
      <label htmlFor={id} className="text-sm font-bold">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          required
          type={isPassword && visible ? "text" : type}
          className={`w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-brand ${isPassword ? "pr-11" : ""}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted hover:text-foreground"
          >
            <EyeIcon off={visible} />
          </button>
        )}
      </div>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}

export function FormError({ message }: { message: string }) {
  return (
    <p role="alert" className={`mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger ${message ? "" : "hidden"}`}>
      {message}
    </p>
  );
}

// false saat render server/hydration, true setelah halaman interaktif. Mencegah form terkirim
// sebagai GET biasa (membawa password ke URL) bila diklik sebelum JavaScript siap.
const noop = () => () => {};
const useHydrated = () => useSyncExternalStore(noop, () => true, () => false);

export function SubmitButton({ pending, children }: { pending: boolean; children: string }) {
  const hydrated = useHydrated();
  return (
    <button disabled={pending || !hydrated} className="w-full rounded-full bg-foreground py-3 font-bold text-white hover:bg-black disabled:opacity-60">
      {pending ? "Memproses…" : children}
    </button>
  );
}
