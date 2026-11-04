"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

const ITEMS = [
  { href: "/admin", label: "Dashboard", exact: true, icon: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" },
  { href: "/admin/pesanan", label: "Pesanan", icon: "M6 2l-3 4v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6zm0 4h12M9 10a3 3 0 006 0" },
  { href: "/admin/produk", label: "Produk", icon: "M20 7l-8-4-8 4v10l8 4 8-4V7zM4 7l8 4m0 10V11m8-4l-8 4" },
  { href: "/admin/kategori", label: "Kategori", icon: "M20 12l-8 8-9-9V3h8l9 9zM7.5 7.5h.01" },
  { href: "/admin/pesan", label: "Pesan masuk", icon: "M4 4h16v12H8l-4 4V4z" },
];

type Orientation = "row" | "column";

function NavLinks({ orientation, pathname }: { orientation: Orientation; pathname: string }) {
  return (
    <nav aria-label="Menu admin" className={orientation === "row" ? "flex gap-1 overflow-x-auto" : "grid gap-1"}>
      {ITEMS.map((it) => {
        const on = it.exact ? pathname === it.href : pathname === it.href || pathname.startsWith(`${it.href}/`);
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={on ? "page" : undefined}
            className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${on ? "bg-brand text-white" : "hover:bg-header"}`}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={it.icon} />
            </svg>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Active({ orientation }: { orientation: Orientation }) {
  return <NavLinks orientation={orientation} pathname={usePathname()} />;
}

/**
 * Navigasi admin. `row` = bilah mendatar untuk layar kecil, `column` = sidebar.
 * usePathname() membaca URL saat request, jadi dibungkus <Suspense>; fallback-nya tautan yang sama tanpa sorotan.
 */
export function AdminNav({ orientation }: { orientation: Orientation }) {
  return (
    <Suspense fallback={<NavLinks orientation={orientation} pathname="" />}>
      <Active orientation={orientation} />
    </Suspense>
  );
}
