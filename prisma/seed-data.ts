// Data awal diambil dari katalog website statis lama (legacy/app.js).

export const categories = [
  { slug: "pakaian", name: "Pakaian", icon: "/assets/shirt.png" },
  { slug: "aksesori", name: "Aksesori", icon: "/assets/sunglasses.jpg" },
  { slug: "dekorasi", name: "Dekorasi", icon: "/assets/mirror.png" },
  { slug: "perabot", name: "Perabot", icon: "/assets/shoerack.png" },
  { slug: "elektronik", name: "Elektronik", icon: "/assets/fan.png" },
  { slug: "kebersihan", name: "Kebersihan", icon: "/assets/bucket.png" },
] as const;

type Condition = "BARU" | "SEPERTI_BARU" | "BEKAS_BAIK";

export const products: {
  slug: string;
  name: string;
  category: (typeof categories)[number]["slug"];
  price: number;
  condition: Condition;
  size: string;
  stock: number;
  popularity: number;
  createdAt: string;
  image: string;
  isPhoto?: boolean;
  description: string;
}[] = [
  { slug: "handmade-vase", name: "Handmade Vase", category: "dekorasi", price: 25000, condition: "SEPERTI_BARU", size: "Tinggi 25 cm", stock: 1, popularity: 92, createdAt: "2024-10-20", image: "/assets/vase.jpg", isPhoto: true,
    description: "Vas keramik buatan tangan dengan bentuk donat yang unik. Cocok sebagai pemanis meja belajar atau rak kamar kos. Material: Keramik. Warna: Putih." },
  { slug: "hand-soap", name: "Hand Soap", category: "kebersihan", price: 10000, condition: "BARU", size: "100 ml", stock: 3, popularity: 70, createdAt: "2024-10-18", image: "/assets/soap.jpg", isPhoto: true,
    description: "Sabun cuci tangan dalam botol pump elegan, sisa stok yang belum terpakai. Volume: 100 ml." },
  { slug: "sunglasses", name: "Sunglasses", category: "aksesori", price: 45000, condition: "BEKAS_BAIK", size: "One size", stock: 1, popularity: 88, createdAt: "2024-10-22", image: "/assets/sunglasses.jpg", isPhoto: true,
    description: "Kacamata hitam model bulat retro dengan side shield. Material: Stainless Steel. Warna: Hitam. Lensa bebas goresan." },
  { slug: "kemeja-polo-hijau", name: "Kemeja Polo Hijau", category: "pakaian", price: 35000, condition: "BEKAS_BAIK", size: "M", stock: 1, popularity: 64, createdAt: "2024-10-25", image: "/assets/produk/kemeja-polo-hijau.jpg", isPhoto: true,
    description: "Kemeja polo warna hijau mint dengan kerah krem. Bahan katun adem, dipakai beberapa kali saja." },
  { slug: "kipas-angin-meja", name: "Kipas Angin Meja", category: "elektronik", price: 85000, condition: "BEKAS_BAIK", size: "Diameter 30 cm", stock: 1, popularity: 95, createdAt: "2024-10-26", image: "/assets/produk/kipas-angin-meja.jpg", isPhoto: true,
    description: "Kipas angin meja 3 kecepatan, masih berfungsi normal dan tidak berisik. Pas untuk kamar kos." },
  { slug: "rak-sepatu-2-susun", name: "Rak Sepatu 2 Susun", category: "perabot", price: 60000, condition: "BEKAS_BAIK", size: "60 × 25 × 40 cm", stock: 1, popularity: 75, createdAt: "2024-10-15", image: "/assets/produk/rak-sepatu-2-susun.jpg", isPhoto: true,
    description: "Rak sepatu kayu dua tingkat, muat 6–8 pasang sepatu. Kokoh, ada sedikit baret pemakaian." },
  { slug: "cermin-dinding", name: "Cermin Dinding", category: "dekorasi", price: 40000, condition: "SEPERTI_BARU", size: "30 × 45 cm", stock: 1, popularity: 58, createdAt: "2024-10-27", image: "/assets/produk/cermin-dinding.jpg", isPhoto: true,
    description: "Cermin dinding dengan bingkai kayu tipis. Kaca jernih tanpa retak." },
  { slug: "keset-welcome", name: "Keset Welcome", category: "perabot", price: 20000, condition: "BEKAS_BAIK", size: "40 × 60 cm", stock: 2, popularity: 50, createdAt: "2024-10-10", image: "/assets/produk/keset-welcome.jpg", isPhoto: true,
    description: "Keset bertuliskan WELCOME, bahan tebal dan anti selip. Sudah dicuci bersih." },
  { slug: "ember-merah", name: "Ember Merah", category: "kebersihan", price: 12000, condition: "BEKAS_BAIK", size: "10 liter", stock: 2, popularity: 40, createdAt: "2024-10-12", image: "/assets/produk/ember-merah.jpg", isPhoto: true,
    description: "Ember plastik 10 liter dengan pegangan besi. Tidak bocor." },
  { slug: "tempat-sampah-mini", name: "Tempat Sampah Mini", category: "kebersihan", price: 18000, condition: "SEPERTI_BARU", size: "5 liter", stock: 1, popularity: 45, createdAt: "2024-10-24", image: "/assets/bin.png",
    description: "Tempat sampah mini dengan tutup ayun, warna sage. Cocok untuk meja atau kamar mandi." },
  { slug: "gayung", name: "Gayung", category: "kebersihan", price: 5000, condition: "BEKAS_BAIK", size: "One size", stock: 3, popularity: 30, createdAt: "2024-10-08", image: "/assets/scoop.png",
    description: "Gayung plastik biru bergagang panjang. Bersih dan siap pakai." },
  { slug: "sapu-pengki", name: "Pengki Gagang Panjang", category: "kebersihan", price: 22000, condition: "BEKAS_BAIK", size: "Tinggi 80 cm", stock: 1, popularity: 38, createdAt: "2024-10-21", image: "/assets/produk/sapu-pengki.jpg", isPhoto: true,
    description: "Pengki bergagang panjang, tidak perlu membungkuk saat menyapu." },
  { slug: "botol-semprot", name: "Botol Semprot", category: "kebersihan", price: 8000, condition: "BARU", size: "500 ml", stock: 4, popularity: 35, createdAt: "2024-10-28", image: "/assets/produk/botol-semprot.jpg", isPhoto: true,
    description: "Botol semprot kosong 500 ml, cocok untuk pembersih kaca atau menyiram tanaman." },
];

export const promo = { code: "PRELOVED10", percent: 10, firstPurchaseOnly: true };

/** Perkiraan berat barang (gram) untuk ongkir; admin bisa mengubahnya per produk. */
export const WEIGHTS: Record<string, number> = {
  "handmade-vase": 600,
  "hand-soap": 300,
  sunglasses: 150,
  "kemeja-polo-hijau": 300,
  "kipas-angin-meja": 1800,
  "rak-sepatu-2-susun": 2500,
  "cermin-dinding": 1500,
  "keset-welcome": 600,
  "ember-merah": 500,
  "tempat-sampah-mini": 600,
  gayung: 150,
  "sapu-pengki": 400,
  "botol-semprot": 250,
};
