import type { Metadata } from "next";

export const metadata: Metadata = { title: "Syarat & Ketentuan" };

export default function SyaratPage() {
  return (
    <article className="mx-auto w-[min(760px,100%-32px)] py-10 [&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_li]:mb-1 [&_ul]:list-disc [&_ul]:pl-5">
      <h1 className="text-3xl font-bold">Syarat &amp; Ketentuan</h1>
      <p className="mt-1 text-sm text-muted">Terakhir diperbarui: 1 November 2026</p>

      <h2>1. Barang preloved</h2>
      <p>Semua barang adalah barang bekas atau sisa stok yang sudah kami periksa dan bersihkan. Kondisi dijelaskan pada setiap produk (Baru, Seperti Baru, Bekas - Baik). Bekas pemakaian yang wajar dapat ada dan tidak dianggap cacat.</p>

      <h2>2. Pemesanan dan stok</h2>
      <ul>
        <li>Umumnya setiap barang hanya tersedia 1 unit. Barang dianggap milik pembeli pertama yang menyelesaikan pembuatan pesanan.</li>
        <li>Stok ditahan selama 24 jam sejak pesanan dibuat. Bila belum dibayar, pesanan dibatalkan otomatis dan stok dikembalikan.</li>
      </ul>

      <h2>3. Pembayaran</h2>
      <ul>
        <li>Pembayaran dilakukan ke rekening atau dompet digital toko yang tercantum pada halaman pesanan, sebesar nominal total.</li>
        <li>Pembeli mengirim bukti pembayaran lewat WhatsApp. Pesanan diproses setelah admin memverifikasi pembayaran.</li>
        <li>Kami tidak pernah meminta data kartu, PIN, atau kode OTP.</li>
      </ul>

      <h2>4. Pengiriman</h2>
      <p>Pesanan dikemas maksimal 1×24 jam setelah pembayaran diverifikasi. Lama pengiriman bergantung pada kurir yang dipilih. Ongkos kirim mengikuti tarif tetap yang ditampilkan saat checkout.</p>

      <h2>5. Pengembalian</h2>
      <p>Pengembalian dapat diajukan maksimal 2×24 jam setelah barang diterima bila barang tidak sesuai deskripsi, dengan menyertakan video unboxing melalui WhatsApp atau email.</p>

      <h2>6. Akun</h2>
      <p>Pengguna bertanggung jawab menjaga kerahasiaan password. Kami berhak menonaktifkan akun yang disalahgunakan.</p>

      <h2>7. Perubahan</h2>
      <p>Syarat ini dapat diperbarui sewaktu-waktu. Versi terbaru selalu tersedia di halaman ini.</p>
    </article>
  );
}
