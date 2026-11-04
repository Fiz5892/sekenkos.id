/*
 * "Barang serupa" saat pencarian tidak (atau hampir tidak) menemukan hasil.
 *
 * Pencarian utama (catalog.ts) mencocokkan teks persis, jadi "kemja", "kipas murah", atau "jaket" (padahal
 * yang ada "hoodie") tidak menemukan apa-apa. Di sini setiap barang diberi skor kemiripan terhadap kata kunci:
 *   1. Kata kunci dipecah jadi kata, kata umum ("murah", "bekas", "yang") dibuang.
 *   2. Tiap kata dicocokkan ke nama barang (bobot 3), nama kategori (2), dan deskripsi (1). Kecocokan bisa
 *      persis (1), awalan "kemej"→"kemeja" (0,85), sinonim "fan"→"kipas" (0,8), atau salah ketik
 *      "kemja"→"kemeja" (0,7, lewat jarak edit).
 *   3. Kata yang menunjuk sebuah kategori ("jaket" → Pakaian) menambah skor barang di kategori itu, sehingga
 *      barang sejenis tetap muncul walau namanya tidak mirip.
 *   4. Skor dirata-rata per kata; stok tersedia dan popularitas hanya jadi penentu saat skor seri.
 * Kalau tidak ada yang cukup mirip, dikembalikan barang terpopuler sebagai cadangan.
 */

export type SimilarCandidate = {
  id: string;
  name: string;
  description: string;
  popularity: number;
  stock: number;
  category: { slug: string; name: string };
};

export type SimilarResult<T> = {
  items: T[];
  /** "similar" = mirip kata kunci; "popular" = cadangan saat tidak ada yang mirip. */
  kind: "similar" | "popular";
  /** Ejaan yang mungkin dimaksud, mis. "kemja" → "kemeja". */
  suggestion?: string;
};

const STOPWORDS = new Set(
  "yang dan atau untuk buat di ke dari dengan ada mau cari jual beli murah murmer bagus baru bekas second seken preloved preloveed barang the a of for".split(" "),
);

/** Kelompok kata bermakna sama/dekat (Indonesia & Inggris). */
const SYNONYMS: string[][] = [
  ["baju", "kaos", "kaus", "tshirt", "shirt", "kemeja", "atasan", "blus", "polo"],
  ["jaket", "hoodie", "sweater", "cardigan", "outer", "jacket", "rajut"],
  ["celana", "jeans", "pants", "rok", "skirt"],
  ["kacamata", "sunglasses", "glasses"],
  ["tas", "tote", "totebag", "ransel", "bag", "dompet"],
  ["vas", "vase", "pot"],
  ["cermin", "kaca", "mirror"],
  ["sabun", "soap"],
  ["semprot", "spray", "sprayer"],
  ["kipas", "fan"],
  ["lampu", "lamp", "lampion"],
  ["rak", "shelf", "lemari", "laci"],
  ["meja", "table", "desk"],
  ["kursi", "chair", "bangku"],
  ["keset", "karpet", "mat", "rug"],
  ["sampah", "bin", "trash"],
  ["pengki", "serokan", "sapu", "broom", "dustpan"],
  ["ember", "bucket", "baskom"],
  ["gayung", "scoop"],
  ["ricecooker", "magiccom", "magicom", "penanak"],
];

/** Kata yang menunjuk kategori tertentu walau tidak ada di nama barang. */
const CATEGORY_HINTS: Record<string, string[]> = {
  pakaian: ["baju", "kaos", "kaus", "kemeja", "polo", "jaket", "hoodie", "sweater", "cardigan", "celana", "rok", "dress", "outfit", "fashion", "pakaian"],
  aksesori: ["kacamata", "tas", "tote", "dompet", "jam", "topi", "gelang", "kalung", "sabuk", "aksesoris", "aksesori"],
  dekorasi: ["vas", "cermin", "hiasan", "pajangan", "poster", "lukisan", "bunga", "tanaman", "dekor", "estetik", "aesthetic"],
  perabot: ["rak", "meja", "kursi", "lemari", "kasur", "bantal", "keset", "karpet", "gantungan", "laci", "furniture", "mebel"],
  elektronik: ["kipas", "lampu", "ricecooker", "magiccom", "setrika", "charger", "kabel", "speaker", "headset", "dispenser", "blender", "listrik"],
  kebersihan: ["sabun", "ember", "gayung", "sapu", "pengki", "pel", "sikat", "semprot", "sampah", "tisu", "deterjen", "bersih"],
};

const synonymGroup = new Map<string, number>();
SYNONYMS.forEach((group, i) => group.forEach((w) => synonymGroup.set(w, i)));

const hintedCategory = new Map<string, string>();
for (const [slug, words] of Object.entries(CATEGORY_HINTS)) for (const w of words) hintedCategory.set(w, slug);

/** Huruf kecil, tanpa aksen/tanda baca; "rice cooker" & "magic com" disatukan agar cocok dengan sinonimnya. */
export function tokenize(text: string): string[] {
  const s = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/rice\s+cooker/g, "ricecooker")
    .replace(/magic\s*com/g, "magiccom")
    .replace(/tote\s+bag/g, "totebag")
    .replace(/t-?shirt/g, "tshirt");
  return [...new Set(s.split(/[^a-z0-9]+/).filter((w) => w.length > 1))];
}

export function queryTokens(query: string): string[] {
  return tokenize(query).filter((w) => !STOPWORDS.has(w));
}

/** Jarak Damerau-Levenshtein (dengan pertukaran huruf bersebelahan), berhenti dini bila melebihi `max`. */
export function editDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const rows: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    rows[i] = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      if (i === 0) {
        rows[0][j] = j;
        continue;
      }
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let d = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d = Math.min(d, rows[i - 2][j - 2] + 1);
      rows[i][j] = d;
      rowMin = Math.min(rowMin, d);
    }
    if (i > 0 && rowMin > max) return max + 1;
  }
  return Math.min(rows[a.length][b.length], max + 1);
}

/** Batas salah ketik yang masih dianggap sama: kata pendek harus persis. */
const typoLimit = (len: number) => (len >= 7 ? 2 : len >= 4 ? 1 : 0);

/** Seberapa cocok kata kunci `q` dengan kata `w` di data barang (0–1). */
export function wordMatch(q: string, w: string): number {
  if (q === w) return 1;
  // Hanya kata kunci yang diketik setengah ("kemej"); sebaliknya "kacamata" akan cocok dengan "kaca".
  if (q.length >= 3 && w.startsWith(q)) return 0.85;
  const g = synonymGroup.get(q);
  if (g !== undefined && g === synonymGroup.get(w)) return 0.8;
  const limit = typoLimit(Math.min(q.length, w.length));
  if (limit && editDistance(q, w, limit) <= limit) return 0.7;
  return 0;
}

const best = (q: string, words: string[]) => words.reduce((m, w) => (m === 1 ? m : Math.max(m, wordMatch(q, w))), 0);

/** Kategori yang ditunjuk kata kunci, termasuk lewat salah ketik ringan ("kemja" → pakaian). */
function categoryOf(q: string): string | undefined {
  const direct = hintedCategory.get(q);
  if (direct) return direct;
  const limit = typoLimit(q.length);
  if (!limit) return undefined;
  for (const [w, slug] of hintedCategory) if (editDistance(q, w, limit) <= limit) return slug;
  return undefined;
}

export function scoreCandidate(tokens: string[], c: SimilarCandidate): number {
  if (!tokens.length) return 0;
  const name = tokenize(c.name);
  const category = tokenize(`${c.category.name} ${c.category.slug}`);
  const description = tokenize(c.description);
  let total = 0;
  for (const q of tokens) {
    let s = Math.max(3 * best(q, name), 2 * best(q, category), 1 * best(q, description));
    if (categoryOf(q) === c.category.slug) s = Math.max(s, 1.2);
    total += s;
  }
  return total / tokens.length;
}

/** Ejaan terdekat dari kosakata katalog untuk tiap kata yang tidak dikenal; undefined bila tak ada perbaikan. */
export function suggestSpelling(query: string, vocabulary: Iterable<string>): string | undefined {
  const vocab = [...new Set(vocabulary)];
  const known = new Set(vocab);
  const tokens = queryTokens(query);
  let changed = false;
  const fixed = tokens.map((q) => {
    if (known.has(q) || synonymGroup.has(q) || hintedCategory.has(q)) return q;
    const limit = typoLimit(q.length);
    if (!limit) return q;
    let pick = q;
    let bestD = limit + 1;
    for (const w of vocab) {
      const d = editDistance(q, w, limit);
      if (d < bestD) [pick, bestD] = [w, d];
    }
    if (pick !== q) changed = true;
    return pick;
  });
  return changed ? fixed.join(" ") : undefined;
}

const MIN_SCORE = 0.6;

export function rankSimilar<T extends SimilarCandidate>(query: string, candidates: T[], limit = 4): SimilarResult<T> {
  const tokens = queryTokens(query);
  const vocabulary = candidates.flatMap((c) => [...tokenize(c.name), ...tokenize(c.category.name)]);
  const suggestion = suggestSpelling(query, vocabulary);
  const tiebreak = (a: T, b: T) => Number(b.stock > 0) - Number(a.stock > 0) || b.popularity - a.popularity;

  const scored = candidates
    .map((c) => ({ c, s: scoreCandidate(tokens, c) }))
    .filter((x) => x.s >= MIN_SCORE)
    .sort((a, b) => b.s - a.s || tiebreak(a.c, b.c));

  if (scored.length) return { items: scored.slice(0, limit).map((x) => x.c), kind: "similar", suggestion };
  return { items: [...candidates].sort(tiebreak).slice(0, limit), kind: "popular", suggestion };
}
