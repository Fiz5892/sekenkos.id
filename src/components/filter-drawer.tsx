"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// Di mobile filter disembunyikan dan dibuka sebagai panel dengan latar blur; di desktop tampil seperti sidebar biasa.
export function FilterDrawer({ activeCount, children }: { activeCount: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const params = useSearchParams().toString();

  // Tutup panel setelah filter diterapkan atau kategori dipilih (URL berubah).
  useEffect(() => setOpen(false), [params]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="filter-panel"
        className="inline-flex items-center gap-2 justify-self-start rounded-full bg-white px-5 py-2 text-sm font-bold ring-1 ring-sandstone hover:bg-header lg:hidden"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
        Filter
        {activeCount > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] text-white">{activeCount}</span>
        )}
      </button>

      {open && (
        <div
          aria-hidden="true"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[60] bg-foreground/30 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        id="filter-panel"
        aria-label="Filter produk"
        className={`${
          open
            ? "fixed inset-y-0 left-0 z-[70] block w-[min(320px,85vw)] overflow-y-auto bg-background p-5 shadow-2xl"
            : "hidden"
        } custom-scrollbar lg:z-auto lg:block lg:max-h-[calc(100vh-6.5rem)] lg:w-auto lg:self-start lg:overflow-y-auto lg:bg-transparent lg:p-0 lg:pr-3 lg:shadow-none lg:sticky lg:top-24`}
      >
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <span className="text-lg font-bold">Filter</span>
          <button type="button" onClick={() => setOpen(false)} aria-label="Tutup filter" className="grid h-9 w-9 place-items-center rounded-full hover:bg-header">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {children}
      </aside>
    </>
  );
}
