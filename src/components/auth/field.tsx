"use client";

import { useSyncExternalStore, type ComponentProps } from "react";
export function Field({ label, hint, id, ...props }: { label: string; hint?: string; id: string } & ComponentProps<"input">) {
  return (
    <div className="mb-4 grid gap-1">
      <label htmlFor={id} className="text-sm font-bold">
        {label}
      </label>
      <input id={id} name={id} required className="rounded-lg border border-line px-3 py-2.5 outline-none focus:border-brand" {...props} />
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
