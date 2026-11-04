export const SITE = {
  name: "sekenkos.id",
  tagline: "Secondhand, First Choice",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  // Data kontak contoh dari website lama; ganti lewat .env / panel admin saat go-live.
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "6281357022860",
  instagram: "@sekenkos.id",
  email: "hello@sekenkos.id",
  address: "Malang, Jawa Timur",
} as const;

export const CONDITION_LABEL = {
  BARU: "Baru",
  SEPERTI_BARU: "Seperti Baru",
  BEKAS_BAIK: "Bekas - Baik",
} as const;

// Penjelasan singkat tiap kondisi agar pembeli tahu maksudnya sebelum memutuskan.
export const CONDITION_HINT = {
  BARU: "Belum pernah dipakai.",
  SEPERTI_BARU: "Dipakai sangat jarang, nyaris tanpa tanda pemakaian.",
  BEKAS_BAIK: "Sudah dipakai dan berfungsi baik; bisa ada tanda pemakaian ringan.",
} as const;
