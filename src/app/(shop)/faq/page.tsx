import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "FAQ", description: "Pertanyaan umum seputar belanja, pembayaran, pengiriman, dan pengembalian di sekenkos.id." };

const FAQ: [string, string][] = [
  ["Apa itu barang preloved?", "Barang bekas yang masih layak pakai. Setiap barang di sekenkos.id sudah kami periksa, bersihkan, dan beri keterangan kondisi: Baru, Seperti Baru, atau Bekas - Baik."],
  ["Bagaimana cara membeli?", "Pilih produk → Tambah ke Keranjang → Checkout → isi detail pengiriman → Buat Pesanan → bayar sesuai petunjuk lalu kirim bukti lewat WhatsApp."],
  ["Bagaimana cara membayar?", "Setelah pesanan dibuat, kamu mendapat nomor rekening (transfer bank) atau nomor e-wallet toko, atau kode QRIS dengan nominal yang sudah terisi otomatis. Bayar sesuai nominal, lalu tekan tombol Konfirmasi lewat WhatsApp dan kirim bukti pembayaran. Admin memverifikasi dan mengubah status pesananmu menjadi Dibayar."],
  ["Berapa lama batas pembayaran?", "24 jam sejak pesanan dibuat. Setelah itu pesanan dibatalkan otomatis dan stok barang dikembalikan agar bisa dibeli orang lain."],
  ["Berapa lama pengiriman?", "Pesanan dikemas maksimal 1×24 jam setelah pembayaran diverifikasi. Lama pengiriman tergantung kurir: 1–3 hari kerja untuk wilayah Jawa."],
  ["Bagaimana cara melacak pesanan?", "Buka menu Lacak Pesanan lalu masukkan nomor pesanan atau nomor resi. Status juga bisa dilihat di Akun Saya → Riwayat Pembelian."],
  ["Apakah barang bisa dikembalikan?", "Bisa, jika barang yang diterima tidak sesuai deskripsi. Ajukan pengembalian maksimal 2×24 jam setelah barang diterima dengan menyertakan video unboxing melalui WhatsApp atau email."],
  ["Kenapa stok setiap barang sedikit?", "Karena barang preloved umumnya hanya ada satu. Kalau suka, segera checkout sebelum didahului pembeli lain!"],
  ["Saya lupa password, bagaimana?", "Klik Lupa Password di halaman Login, masukkan email terdaftar, lalu ikuti tautan yang kami kirim ke emailmu untuk membuat password baru."],
];

export default function FaqPage() {
  return (
    <div className="mx-auto w-[min(820px,100%-32px)] py-10">
      <h1 className="mb-6 text-3xl font-bold">FAQ — Pertanyaan Umum</h1>
      <div className="grid gap-3">
        {FAQ.map(([q, a], i) => (
          <details key={q} open={i === 0} className="rounded-card border border-line p-4 open:bg-header/50">
            <summary className="cursor-pointer font-bold">{q}</summary>
            <p className="mt-2 text-muted">{a}</p>
          </details>
        ))}
      </div>
      <p className="mt-8">
        Masih ada pertanyaan?{" "}
        <Link href="/kontak" className="text-brand underline">
          Hubungi customer service
        </Link>{" "}
        atau WhatsApp {SITE.whatsapp}.
      </p>
    </div>
  );
}
