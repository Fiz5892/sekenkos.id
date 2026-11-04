"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Memuat ulang data halaman tiap beberapa detik (maks. `minutes` menit) agar status bayar online muncul tanpa reload manual. */
export function AutoRefresh({ everySeconds = 5, minutes = 3 }: { everySeconds?: number; minutes?: number }) {
  const router = useRouter();
  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(() => {
      if (Date.now() - started > minutes * 60_000) return clearInterval(timer);
      if (!document.hidden) router.refresh();
    }, everySeconds * 1000);
    return () => clearInterval(timer);
  }, [router, everySeconds, minutes]);
  return null;
}
