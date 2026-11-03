import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminNav } from "@/components/admin-nav";
import { LogoutButton } from "@/components/auth/logout-button";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Admin sekenkos.id" }, robots: { index: false, follow: false } };

// Kerangka admin berdiri sendiri (tanpa header/footer toko). Pemeriksaan peran dilakukan di setiap halaman dan
// setiap aksi (requireAdmin), karena layout tidak dirender ulang pada setiap navigasi.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="font-ui min-h-screen bg-[#F4F1EA] lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-white p-4 lg:flex">
        <Brand />
        <div className="mt-6 flex-1">
          <AdminNav orientation="column" />
        </div>
        <Suspense fallback={null}>
          <AdminUser />
        </Suspense>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 border-b border-line bg-white px-4 py-3 lg:hidden">
          <div className="mb-2 flex items-center justify-between">
            <Brand />
          </div>
          <AdminNav orientation="row" />
        </header>
        <main id="main" className="mx-auto w-full max-w-6xl p-4 sm:p-8 [&_.rounded-card]:bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link href="/admin" className="flex items-baseline gap-2" aria-label="Dashboard admin sekenkos.id">
      <span className="font-serif text-xl text-brand">
        sekenkos<span className="text-rock">.id</span>
      </span>
      <span className="rounded bg-header-contrast px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide">Admin</span>
    </Link>
  );
}

async function AdminUser() {
  const session = await getSession();
  if (!session) return null;
  return (
    <div className="grid gap-2 border-t border-line pt-4 text-sm">
      <div className="px-3">
        <div className="truncate font-bold">{session.user.name}</div>
        <div className="truncate text-xs text-muted">{session.user.email}</div>
      </div>
      <LogoutButton className="rounded-lg px-3 py-2 text-left hover:bg-header" />
    </div>
  );
}
