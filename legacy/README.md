# Preloveyou.store

Website toko barang preloved, dibangun ulang dari source code Hostinger Website Builder di Manual Book
menjadi website statis (HTML + CSS + JavaScript murni, tanpa framework, tanpa server).

## Cara menjalankan
- Buka `index.html` langsung di browser, atau
- Jalankan server lokal: `python -m http.server 8000` lalu buka http://localhost:8000
- Untuk online: upload seluruh folder ke Hostinger / GitHub Pages / Netlify.

## Struktur
- `index.html` — kerangka halaman (header, footer, chat)
- `style.css`  — tampilan (palet warna dari source code asli: #fff0ff, #ffb3ff, dst.)
- `app.js`     — data produk, routing halaman, keranjang, akun, checkout, pesanan
- `assets/`    — foto produk & ilustrasi dari website asli

## Fitur (sesuai Manual Book)
1. Login, Daftar/Register, Lupa Password (kode reset)
2. Halaman utama, kategori, pencarian, filter (kategori, harga, kondisi, ukuran), urutkan (harga, popularitas, terbaru), detail produk + info penjual + ulasan
3. Keranjang, checkout (detail pengiriman), metode pembayaran (transfer bank, kartu, dompet digital), konfirmasi + notifikasi, Riwayat Pembelian di Akun Saya, Lacak Pesanan dengan nomor resi
4. About Us + Contact Us, chat customer service, FAQ

## Catatan
- Data akun, keranjang, dan pesanan disimpan di localStorage browser (demo, belum ada database/server).
  Pembayaran dan email konfirmasi disimulasikan.
- Status pesanan berjalan otomatis: Dibayar → Dikemas (1 menit) → Dikirim + resi (2 menit) → Diterima (5 menit).
- Ganti kontak toko di `app.js` bagian `CONTACT`, dan produk di bagian `PRODUCTS`.
- Kode promo: PRELOVED10 (diskon 10%).
