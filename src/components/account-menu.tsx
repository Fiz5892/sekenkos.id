"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LogoutButton } from "@/components/auth/logout-button";

const item = "block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-header";

/** Menu akun berbentuk ikon. Menutup saat klik di luar, tekan Escape, atau memilih menu. */
export function AccountMenu({ name, email, isAdmin }: { name: string; email: string; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label={`Menu akun ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="grid h-10 w-10 place-items-center rounded-full bg-brand font-bold text-white hover:opacity-90"
      >
        {name.trim().charAt(0).toUpperCase() || "?"}
      </button>
      {open && (
        <div role="menu" className="menu-in absolute right-0 top-full z-50 mt-2 w-56 rounded-xl bg-white p-2 shadow-lg ring-1 ring-line" onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}>
          <div className="border-b border-line px-3 pb-2 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-bold">{name}</span>
              {isAdmin && (
                <span className="rounded bg-brand/15 px-1.5 py-0.5 text-[10px] font-bold text-brand">ADMIN</span>
              )}
            </div>
            <div className="truncate text-xs text-muted">{email}</div>
          </div>
          {isAdmin ? (
            <Link role="menuitem" href="/admin" className={`${item} font-bold text-brand`}>
              Dashboard Admin
            </Link>
          ) : (
            <>
              <Link role="menuitem" href="/akun" className={item}>
                Akun Saya
              </Link>
              <Link role="menuitem" href="/akun/pesanan" className={item}>
                Riwayat Pembelian
              </Link>
              <Link role="menuitem" href="/lacak" className={item}>
                Lacak Pesanan
              </Link>
            </>
          )}
          <LogoutButton className={`${item} border-t border-line`} />
        </div>
      )}
    </div>
  );
}
