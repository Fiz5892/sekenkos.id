import Link from "next/link";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

// 404 global (URL yang tidak cocok dengan rute mana pun) dirender di luar layout (shop), jadi kerangkanya dipasang di sini.
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main" className="flex-1">
        <div className="mx-auto grid w-[min(640px,100%-32px)] justify-items-center gap-4 py-24 text-center">
          <h1 className="text-2xl font-bold">Halaman tidak ditemukan</h1>
          <p className="text-muted">Barang atau halaman yang kamu cari tidak ada, atau barangnya sudah tidak dijual.</p>
          <Link href="/produk" className="rounded-full bg-foreground px-6 py-2.5 font-bold text-white hover:bg-black">
            Lihat semua produk
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
