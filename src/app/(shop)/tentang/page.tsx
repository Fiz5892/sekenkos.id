import { PHOTO_CREDITS } from "@/lib/photo-credits";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tentang kami",
  description: "sekenkos.id adalah toko online barang preloved yang sudah dicek dan dibersihkan, dengan harga bersahabat.",
};

const VALUES = [
  { title: "Kualitas terkurasi", body: "Hanya barang yang masih berfungsi baik yang kami jual, lengkap dengan keterangan kondisi yang jujur." },
  { title: "Harga terjangkau", body: "Harga barang preloved jauh di bawah harga baru — cocok untuk mahasiswa dan keluarga muda." },
  { title: "Ramah lingkungan", body: "Setiap barang yang dipakai ulang berarti satu barang lebih sedikit di tempat sampah." },
];

export default function TentangPage() {
  return (
    <>
      <section className="bg-header">
        <div className="mx-auto grid w-[min(1224px,100%-32px)] items-center gap-8 py-14 md:grid-cols-2">
          <div>
            <h1 className="text-4xl font-semibold">Tentang kami</h1>
            <p className="mt-4">
              sekenkos.id adalah toko online barang <i>preloved</i> — barang bekas layak pakai yang sudah kami cek dan bersihkan. Kami lahir dari
              kebiasaan anak kos: setiap akhir semester banyak barang bagus yang ditinggal, padahal masih sangat berguna bagi orang lain.
            </p>
            <p className="mt-3">
              Lewat sekenkos.id, barang-barang itu mendapat rumah baru dengan harga yang bersahabat. <b>Secondhand, First Choice.</b>
            </p>
            <Link href="/produk" className="mt-6 inline-flex rounded-full bg-foreground px-7 py-3 font-bold text-white hover:bg-black">
              Lihat produk
            </Link>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-card">
            <Image src="/assets/room.jpg" alt="Kamar kos dengan barang preloved" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          </div>
        </div>
      </section>
      <section className="mx-auto w-[min(1224px,100%-32px)] py-12">
        <div className="grid gap-6 md:grid-cols-3">
          {VALUES.map((v) => (
            <div key={v.title} className="rounded-card border border-line p-6">
              <h2 className="text-xl font-bold">{v.title}</h2>
              <p className="mt-2 text-muted">{v.body}</p>
            </div>
          ))}
        </div>
        <details className="mt-10 text-sm text-muted">
          <summary className="cursor-pointer font-bold text-foreground">Kredit foto</summary>
          <p className="mt-2">Beberapa foto contoh berasal dari Wikimedia Commons:</p>
          <ul className="mt-1 grid gap-1">
            {PHOTO_CREDITS.map((c) => (
              <li key={c.product}>
                {c.product}: <a href={c.source} target="_blank" rel="noopener noreferrer" className="underline">foto</a> oleh {c.author} ({c.license})
              </li>
            ))}
          </ul>
        </details>
      </section>
    </>
  );
}
