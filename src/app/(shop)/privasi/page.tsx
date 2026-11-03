import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Kebijakan Privasi" };

export default function PrivasiPage() {
  return (
    <article className="mx-auto w-[min(760px,100%-32px)] py-10 [&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_li]:mb-1 [&_ul]:list-disc [&_ul]:pl-5">
      <h1 className="text-3xl font-bold">Kebijakan Privasi</h1>
      <p className="mt-1 text-sm text-muted">Terakhir diperbarui: 1 November 2026</p>

      <h2>Data yang kami kumpulkan</h2>
      <ul>
        <li>Akun: nama, alamat email, dan password (disimpan dalam bentuk hash, bukan teks asli).</li>
        <li>Pesanan: nama penerima, nomor HP, alamat pengiriman, dan isi pesanan.</li>
        <li>Pesan yang kamu kirim lewat formulir kontak.</li>
        <li>Cookie yang diperlukan untuk menjaga sesi login dan isi keranjang. Kami tidak memakai cookie iklan.</li>
      </ul>

      <h2>Untuk apa data dipakai</h2>
      <p>Hanya untuk memproses pesanan, mengirim barang, memberi notifikasi pesanan lewat email, dan menjawab pertanyaanmu. Data tidak dijual kepada pihak lain.</p>

      <h2>Dengan siapa data dibagikan</h2>
      <p>Nama, nomor HP, dan alamat dibagikan kepada kurir seperlunya untuk pengiriman. Kami memakai penyedia layanan infrastruktur (hosting, database, dan pengiriman email) yang memproses data atas nama kami.</p>

      <h2>Hak kamu</h2>
      <p>Kamu dapat meminta akses, perbaikan, atau penghapusan datamu dengan menghubungi kami di {SITE.email} atau WhatsApp +{SITE.whatsapp}. Data pesanan dapat kami simpan sesuai kebutuhan pencatatan transaksi.</p>

      <h2>Perubahan</h2>
      <p>Kebijakan ini dapat diperbarui. Versi terbaru selalu tersedia di halaman ini.</p>
    </article>
  );
}
