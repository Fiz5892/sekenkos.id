# sekenkos.id

Toko barang preloved (*Secondhand, First Choice*). Next.js + TypeScript + Tailwind, PostgreSQL via Prisma, Better Auth.
Pembayaran manual: pembeli transfer lalu konfirmasi lewat WhatsApp; admin memverifikasi dan menandai pesanan dibayar.

## Fitur

- **Pembeli:** katalog dengan filter/urutan, keranjang, checkout (alamat, kurir, kode promo), instruksi bayar + tautan WhatsApp, riwayat dan lacak pesanan, profil dan alamat tersimpan.
- **Admin** (`/admin`): ringkasan, pesanan (dibayar → dikemas → dikirim dengan resi → diterima, batalkan + kembalikan stok), produk (tambah/ubah/arsip, unggah foto), kode promo, pesan masuk.
- **Sistem:** stok dikunci atomik saat pesanan dibuat; pesanan tak dibayar 24 jam dibatalkan otomatis (cron harian + oportunistik); email transaksional lewat Resend.

Website statis versi lama disimpan di [`legacy/`](legacy/) sebagai referensi dan tidak ikut build.

## Menjalankan di lokal

Butuh Node 24 dan sebuah database PostgreSQL (mis. proyek gratis di Supabase).

```bash
npm install
cp .env.example .env        # isi DATABASE_URL, DATABASE_CA, BETTER_AUTH_SECRET, nomor WhatsApp
npm run db:deploy           # terapkan migrasi (lihat catatan Supabase di bawah)
npm run db:seed             # isi 6 kategori, 13 produk, dan kode PRELOVED10
npm run dev                 # http://localhost:3000
```

Menjadikan akun sebagai admin (daftar dulu lewat /daftar): `npm run admin:make -- email@contoh.com`.

### Catatan Supabase

- **Aplikasi** memakai pooler mode transaksi (port 6543, `?pgbouncer=true`).
- **Migrasi** harus lewat koneksi mode sesi (host yang sama, **port 5432**, tanpa `pgbouncer`). Di port 6543
  `prisma migrate` tertahan karena advisory lock.
- Supabase memakai CA sendiri. Isi `DATABASE_CA` dengan sertifikat dari dashboard (Database > SSL Configuration).
  Untuk migrasi, simpan sertifikat itu ke sebuah file dan tambahkan `sslmode=require&sslcert=/jalur/ke/file.pem` pada URL.

## Perintah

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Server pengembangan |
| `npm run build` | Build produksi |
| `npm run lint` | ESLint |
| `npm run typecheck` | Tipe rute Next + `tsc --noEmit` |
| `npm test` | Tes unit (Vitest) |
| `npm run test:e2e` | Tes alur di browser (Playwright); membangun dan menjalankan aplikasi, butuh database berisi seed |
| `npm run admin:make -- <email>` | Jadikan akun sebagai admin |
| `npm run db:migrate` | Buat/terapkan migrasi di lokal |
| `npm run db:deploy` | Terapkan migrasi di produksi |
| `npm run db:seed` | Isi data awal (aman diulang) |
| `npm run db:studio` | Lihat isi database di browser |

## Variabel lingkungan

Lihat `.env.example`. Yang wajib di produksi: `DATABASE_URL`, `DATABASE_CA`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`,
`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `PAYMENT_BANK` / `PAYMENT_EWALLET`, `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`.
Opsional: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET` (default `products`, harus bucket publik) untuk unggah foto produk. Setelah mengisinya, jalankan `npm run storage:setup`: skrip membuat bucket publik (hanya JPG/PNG/WebP, maks 2 MB) dan memindahkan foto yang sudah ada ke sana.

## Deploy ke Vercel

1. Impor repo, isi semua variabel di atas (`BETTER_AUTH_SECRET` dan `CRON_SECRET`: nilai acak baru, mis. `openssl rand -base64 32`).
2. Terapkan migrasi ke database produksi dari komputer lokal (port 5432, lihat catatan Supabase): `npm run db:deploy`, lalu `npm run db:seed` bila perlu data awal.
3. Daftar akun lewat `/daftar`, lalu jadikan admin: `npm run admin:make -- email@contoh.com`.
4. `vercel.json` sudah mendaftarkan cron harian `/api/cron/expire-orders` (Vercel mengirim `CRON_SECRET` otomatis).
5. Ganti data contoh: nomor WhatsApp, Instagram, email, alamat di `src/lib/site.ts`; tinjau teks `/syarat` dan `/privasi` (draf, belum ditinjau ahli hukum).

## Struktur

- `src/app` — halaman (App Router, Cache Components aktif)
- `src/components` — komponen UI bersama
- `src/lib` — database, format, konfigurasi situs
- `prisma/` — skema, data awal, migrasi
- `src/generated/prisma` — Prisma Client hasil generate (tidak di-commit; dibuat saat `npm install`)

## Catatan

- Versi Next.js ini punya perubahan besar dari yang umum dikenal. Baca `node_modules/next/dist/docs/` sebelum menulis kode baru.
- Kontak toko di `src/lib/site.ts` dan nomor WhatsApp di `.env` masih contoh dari website lama.
- Tes e2e menulis ke database yang ditunjuk `DATABASE_URL` (data uji dihapus setelah selesai). Jangan arahkan ke database produksi.
