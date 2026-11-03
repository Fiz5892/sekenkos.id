"use client";

import { authClient } from "@/lib/auth-client";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <button
      className={className}
      onClick={async () => {
        await authClient.signOut();
        // Navigasi penuh sengaja dipakai: memastikan seluruh halaman dirender ulang tanpa sesi.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/");
      }}
    >
      Keluar
    </button>
  );
}
