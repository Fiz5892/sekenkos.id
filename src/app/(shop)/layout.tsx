import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { getSession } from "@/lib/session";

// Admin hanya boleh memakai dashboard (/admin), bukan halaman toko. Membaca sesi berarti membaca cookie,
// jadi pengecekannya dibungkus <Suspense> agar kerangka halaman tetap bisa di-prerender.
async function AdminBoundary() {
  const session = await getSession();
  if ((session?.user as { role?: string } | undefined)?.role === "ADMIN") redirect("/admin");
  return null;
}

export default function ShopLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={null}>
        <AdminBoundary />
      </Suspense>
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
