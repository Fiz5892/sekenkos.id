/* =========================================================
   Preloveyou.store — aplikasi toko (front-end, tanpa server)
   Data akun, keranjang, dan pesanan disimpan di localStorage
   browser pengunjung. Routing memakai hash: #home, #product,
   #p-handmade-vase, #cart, #checkout, #login, dst.
   ========================================================= */

/* ---------- Data produk ---------- */
const CATEGORIES = [
  { slug: "pakaian",    name: "Pakaian",    icon: "assets/shirt.png" },
  { slug: "aksesori",   name: "Aksesori",   icon: "assets/sunglasses.jpg" },
  { slug: "dekorasi",   name: "Dekorasi",   icon: "assets/mirror.png" },
  { slug: "perabot",    name: "Perabot",    icon: "assets/shoerack.png" },
  { slug: "elektronik", name: "Elektronik", icon: "assets/fan.png" },
  { slug: "kebersihan", name: "Kebersihan", icon: "assets/bucket.png" },
];

// photo:true = foto produk asli (dari website lama); false = ilustrasi dari banner
const PRODUCTS = [
  { id: 1, slug: "handmade-vase", name: "Handmade Vase", cat: "dekorasi", price: 25000, img: "assets/vase.jpg", photo: true,
    cond: "Seperti Baru", size: "Tinggi 25 cm", stock: 1, pop: 92, added: "2024-10-20",
    desc: "Vas keramik buatan tangan dengan bentuk donat yang unik. Cocok sebagai pemanis meja belajar atau rak kamar kos. Material: Keramik. Warna: Putih." },
  { id: 2, slug: "hand-soap", name: "Hand Soap", cat: "kebersihan", price: 10000, img: "assets/soap.jpg", photo: true,
    cond: "Baru", size: "100 ml", stock: 3, pop: 70, added: "2024-10-18",
    desc: "Sabun cuci tangan dalam botol pump elegan, sisa stok yang belum terpakai. Volume: 100 ml." },
  { id: 3, slug: "sunglasses", name: "Sunglasses", cat: "aksesori", price: 45000, img: "assets/sunglasses.jpg", photo: true,
    cond: "Bekas - Baik", size: "One size", stock: 1, pop: 88, added: "2024-10-22",
    desc: "Kacamata hitam model bulat retro dengan side shield. Material: Stainless Steel. Warna: Hitam. Lensa bebas goresan." },
  { id: 4, slug: "kemeja-polo-hijau", name: "Kemeja Polo Hijau", cat: "pakaian", price: 35000, img: "assets/shirt.png",
    cond: "Bekas - Baik", size: "M", stock: 1, pop: 64, added: "2024-10-25",
    desc: "Kemeja polo warna hijau mint dengan kerah krem. Bahan katun adem, dipakai beberapa kali saja." },
  { id: 5, slug: "kipas-angin-meja", name: "Kipas Angin Meja", cat: "elektronik", price: 85000, img: "assets/fan.png",
    cond: "Bekas - Baik", size: "Diameter 30 cm", stock: 1, pop: 95, added: "2024-10-26",
    desc: "Kipas angin meja 3 kecepatan, masih berfungsi normal dan tidak berisik. Pas untuk kamar kos." },
  { id: 6, slug: "rak-sepatu-2-susun", name: "Rak Sepatu 2 Susun", cat: "perabot", price: 60000, img: "assets/shoerack.png",
    cond: "Bekas - Baik", size: "60 × 25 × 40 cm", stock: 1, pop: 75, added: "2024-10-15",
    desc: "Rak sepatu kayu dua tingkat, muat 6–8 pasang sepatu. Kokoh, ada sedikit baret pemakaian." },
  { id: 7, slug: "cermin-dinding", name: "Cermin Dinding", cat: "dekorasi", price: 40000, img: "assets/mirror.png",
    cond: "Seperti Baru", size: "30 × 45 cm", stock: 1, pop: 58, added: "2024-10-27",
    desc: "Cermin dinding dengan bingkai kayu tipis. Kaca jernih tanpa retak." },
  { id: 8, slug: "keset-welcome", name: "Keset Welcome", cat: "perabot", price: 20000, img: "assets/mat.png",
    cond: "Bekas - Baik", size: "40 × 60 cm", stock: 2, pop: 50, added: "2024-10-10",
    desc: "Keset bertuliskan WELCOME, bahan tebal dan anti selip. Sudah dicuci bersih." },
  { id: 9, slug: "ember-merah", name: "Ember Merah", cat: "kebersihan", price: 12000, img: "assets/bucket.png",
    cond: "Bekas - Baik", size: "10 liter", stock: 2, pop: 40, added: "2024-10-12",
    desc: "Ember plastik 10 liter dengan pegangan besi. Tidak bocor." },
  { id: 10, slug: "tempat-sampah-mini", name: "Tempat Sampah Mini", cat: "kebersihan", price: 18000, img: "assets/bin.png",
    cond: "Seperti Baru", size: "5 liter", stock: 1, pop: 45, added: "2024-10-24",
    desc: "Tempat sampah mini dengan tutup ayun, warna sage. Cocok untuk meja atau kamar mandi." },
  { id: 11, slug: "gayung", name: "Gayung", cat: "kebersihan", price: 5000, img: "assets/scoop.png",
    cond: "Bekas - Baik", size: "One size", stock: 3, pop: 30, added: "2024-10-08",
    desc: "Gayung plastik biru bergagang panjang. Bersih dan siap pakai." },
  { id: 12, slug: "sapu-pengki", name: "Pengki Gagang Panjang", cat: "kebersihan", price: 22000, img: "assets/dustpan.png",
    cond: "Bekas - Baik", size: "Tinggi 80 cm", stock: 1, pop: 38, added: "2024-10-21",
    desc: "Pengki bergagang panjang, tidak perlu membungkuk saat menyapu." },
  { id: 13, slug: "botol-semprot", name: "Botol Semprot", cat: "kebersihan", price: 8000, img: "assets/spray.png",
    cond: "Baru", size: "500 ml", stock: 4, pop: 35, added: "2024-10-28",
    desc: "Botol semprot kosong 500 ml, cocok untuk pembersih kaca atau menyiram tanaman." },
];

const SELLER = { name: "Preloveyou Official", city: "Malang, Jawa Timur" };
const CONTACT = { // GANTI dengan kontak toko yang sebenarnya
  instagram: "@preloveyou.store",
  whatsapp: "+62 812-0000-0000",
  email: "hello@preloveyou.store",
  address: "Malang, Jawa Timur",
};
const PROMO = { code: "PRELOVED10", pct: 10 };
const COURIERS = [
  { id: "jne", name: "JNE Reguler", eta: "2–3 hari", cost: 10000 },
  { id: "jnt", name: "J&T Express", eta: "2–3 hari", cost: 12000 },
  { id: "sicepat", name: "SiCepat REG", eta: "1–2 hari", cost: 9000 },
  { id: "pickup", name: "Ambil di tempat (COD kampus)", eta: "Janjian via chat", cost: 0 },
];
const PAYMENTS = [
  { id: "bank", name: "Transfer Bank", note: "BCA / BRI / Mandiri — konfirmasi setelah transfer" },
  { id: "card", name: "Kartu Kredit / Debit", note: "Visa, Mastercard — langsung terverifikasi" },
  { id: "ewallet", name: "Dompet Digital", note: "GoPay, OVO, DANA, ShopeePay" },
];
const STATUSES = ["Menunggu Pembayaran", "Dibayar", "Dikemas", "Dikirim", "Diterima"];

/* ---------- Penyimpanan (aman bila localStorage tidak tersedia) ---------- */
const mem = {};
const store = {
  get(k, d) { try { const v = localStorage.getItem("ply_" + k); return v ? JSON.parse(v) : d; } catch { return k in mem ? mem[k] : d; } },
  set(k, v) { try { localStorage.setItem("ply_" + k, JSON.stringify(v)); } catch { mem[k] = v; } },
};

/* ---------- Utilitas ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const app = $("#app");
const rp = n => "Rp" + n.toLocaleString("id-ID");
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const catName = slug => (CATEGORIES.find(c => c.slug === slug) || {}).name || slug;
const bySlug = slug => PRODUCTS.find(p => p.slug === slug);
const byId = id => PRODUCTS.find(p => p.id === id);
const hash = s => { let h = 5381; for (const c of s) h = ((h << 5) + h + c.charCodeAt(0)) | 0; return "h" + (h >>> 0).toString(36); };
const fmtDate = t => new Date(t).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("show"), 2600); }
function go(h) { if (location.hash === "#" + h) route(); else location.hash = h; }

/* ---------- State ---------- */
const state = { query: "", cat: "", conds: [], sizes: [], min: "", max: "", sort: "default", promo: "", redirect: "" };
const users = () => store.get("users", {});
const me = () => { const e = store.get("session", null); return e ? users()[e] || null : null; };
const cart = () => store.get("cart", []);
const setCart = c => { store.set("cart", c); updateBadge(); };
const orders = () => store.get("orders", []);
const soldQty = id => orders().filter(o => o.status >= 0).reduce((s, o) => s + o.items.filter(i => i.id === id).reduce((a, i) => a + i.qty, 0), 0);
const stockLeft = p => Math.max(0, p.stock - soldQty(p.id));
const reviews = () => store.get("reviews", {});

function updateBadge() {
  const n = cart().reduce((s, i) => s + i.qty, 0);
  const b = $("#cartBadge"); b.textContent = n; b.hidden = n === 0;
}
function renderAccountSlot() {
  const u = me();
  $("#accountSlot").innerHTML = u
    ? `<div class="dropdown"><a href="#account" class="nav-link">
         <svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>
         <span>${esc(u.name.split(" ")[0])}</span> <span class="caret">▾</span></a>
       <div class="dropdown-menu"><a href="#account">Akun Saya</a><a href="#account-orders">Riwayat Pembelian</a><a href="#account-notif">Notifikasi</a><a href="#logout">Keluar</a></div></div>`
    : `<a href="#login" class="btn-login">Login</a>`;
}
function renderCatBar(active = "") {
  $("#catBar").innerHTML = CATEGORIES.map(c => `<a href="#cat-${c.slug}" class="${active === c.slug ? "active" : ""}">${c.name}</a>`).join("");
}

/* ---------- Komponen ---------- */
function thumb(p, cls = "thumb") {
  return `<div class="${cls} ${p.photo ? "" : "illu"}"><img src="${p.img}" alt="${esc(p.name)}" loading="lazy"></div>`;
}
function card(p) {
  const left = stockLeft(p);
  return `<article class="card">
    ${left === 0 ? `<span class="tag sold">Terjual</span>` : `<span class="tag">${esc(p.cond)}</span>`}
    <a href="#p-${p.slug}" class="thumb ${p.photo ? "" : "illu"}"><img src="${p.img}" alt="${esc(p.name)}" loading="lazy"></a>
    <div class="card-body">
      <h3><a href="#p-${p.slug}">${esc(p.name)}</a></h3>
      <div class="price">${rp(p.price)}</div>
      <div class="meta">${catName(p.cat)} · ${esc(p.size)}</div>
      <button class="btn block" data-add="${p.id}" ${left === 0 ? "disabled" : ""}>${left === 0 ? "Sold out" : "Add to bag"}</button>
    </div></article>`;
}
function addToCart(id, qty = 1) {
  const p = byId(id), c = cart(), it = c.find(i => i.id === id);
  const have = it ? it.qty : 0;
  if (have + qty > stockLeft(p)) { toast(`Stok ${p.name} tersisa ${stockLeft(p)}`); return; }
  if (it) it.qty += qty; else c.push({ id, qty });
  setCart(c); toast(`${p.name} ditambahkan ke keranjang`);
}
document.addEventListener("click", e => {
  const a = e.target.closest("[data-add]");
  if (a) { e.preventDefault(); addToCart(+a.dataset.add); }
});

/* ================= HALAMAN ================= */
const floaties = [
  ["bucket", "5%", "4%", 80], ["mirror", "8%", "30%", 60], ["shoerack", "72%", "2%", 150], ["scoop", "80%", "30%", 90],
  ["shirt", "3%", "44%", 120], ["dustpan", "62%", "40%", 80], ["spray", "78%", "18%", 100], ["bin", "4%", "88%", 70],
  ["fan", "52%", "92%", 80], ["mat", "82%", "82%", 160],
];
function pageHome() {
  const newest = [...PRODUCTS].sort((a, b) => b.added.localeCompare(a.added)).slice(0, 4);
  const popular = [...PRODUCTS].sort((a, b) => b.pop - a.pop).slice(0, 4);
  app.innerHTML = `
  <section class="hero">
    ${floaties.map(([n, t, l, w]) => `<img class="floaty" src="assets/${n}.png" alt="" style="top:${t};left:${l};width:${w}px;animation-delay:-${(w % 6)}s">`).join("")}
    <div class="hero-inner">
      <div>
        <h1>Preloveyou</h1>
        <p>Secondhand, First Choice</p>
        <a href="#product" class="btn">Go Shop!</a>
      </div>
      <div class="hero-photo" role="img" aria-label="Kamar kos yang ditata dengan barang preloved"></div>
    </div>
  </section>

  <section class="section container">
    <div class="section-head"><h2>Kategori</h2><a href="#product">Lihat semua produk →</a></div>
    <div class="cat-grid">${CATEGORIES.map(c => `<a class="cat-card" href="#cat-${c.slug}"><img src="${c.icon}" alt=""><b>${c.name}</b><small>${PRODUCTS.filter(p => p.cat === c.slug).length} barang</small></a>`).join("")}</div>
  </section>

  <section class="container">
    <div class="promo">
      <div>
        <h2>Diskon 10% untuk pembelian pertama</h2>
        <p>Pakai kode <code>${PROMO.code}</code> di keranjang belanja. Berlaku untuk semua kategori.</p>
        <a href="#product" class="btn">Belanja sekarang</a>
      </div>
      <div class="promo-imgs"><img src="assets/fan.png" alt=""><img src="assets/mirror.png" alt=""><img src="assets/bin.png" alt=""></div>
    </div>
  </section>

  <section class="section container">
    <div class="section-head"><h2>Produk Terbaru</h2><a href="#product" data-sort="newest">Lihat semua →</a></div>
    <div class="grid">${newest.map(card).join("")}</div>
  </section>

  <section class="section container" style="padding-top:0">
    <div class="section-head"><h2>Paling Diminati</h2><a href="#product" data-sort="popular">Lihat semua →</a></div>
    <div class="grid">${popular.map(card).join("")}</div>
  </section>

  <section class="section container" style="padding-top:0">
    <div class="usp">
      <div><b>Dicek satu per satu</b>Setiap barang kami periksa dan bersihkan sebelum dikirim.</div>
      <div><b>Harga ramah kantong</b>Mulai dari ${rp(5000)} — hemat untuk anak kos.</div>
      <div><b>Lebih ramah lingkungan</b>Memperpanjang umur barang berarti mengurangi sampah.</div>
      <div><b>Bisa dilacak</b>Pantau status pesanan dan nomor resi dari akunmu.</div>
    </div>
  </section>`;
  $$("[data-sort]", app).forEach(a => a.addEventListener("click", () => { resetFilters(); state.sort = a.dataset.sort; }));
}

function resetFilters() { Object.assign(state, { query: "", cat: "", conds: [], sizes: [], min: "", max: "", sort: "default" }); $("#searchInput").value = ""; }

function filtered() {
  const q = state.query.trim().toLowerCase();
  let list = PRODUCTS.filter(p =>
    (!state.cat || p.cat === state.cat) &&
    (!q || (p.name + " " + p.desc + " " + catName(p.cat)).toLowerCase().includes(q)) &&
    (!state.conds.length || state.conds.includes(p.cond)) &&
    (!state.sizes.length || state.sizes.includes(p.size)) &&
    (state.min === "" || p.price >= +state.min) &&
    (state.max === "" || p.price <= +state.max));
  const s = state.sort;
  if (s === "price-asc") list.sort((a, b) => a.price - b.price);
  if (s === "price-desc") list.sort((a, b) => b.price - a.price);
  if (s === "popular") list.sort((a, b) => b.pop - a.pop);
  if (s === "newest") list.sort((a, b) => b.added.localeCompare(a.added));
  return list;
}

function pageShop() {
  const conds = [...new Set(PRODUCTS.map(p => p.cond))];
  const sizes = [...new Set(PRODUCTS.filter(p => !state.cat || p.cat === state.cat).map(p => p.size))];
  const title = state.query ? `Hasil pencarian “${esc(state.query)}”` : state.cat ? catName(state.cat) : "All products";
  app.innerHTML = `<div class="container shop">
    <aside class="sidebar" id="sidebar">
      <h3>Browse by</h3>
      <a href="#product" class="cat ${!state.cat ? "active" : ""}" data-cat="">All products</a>
      ${CATEGORIES.map(c => `<a href="#cat-${c.slug}" class="cat ${state.cat === c.slug ? "active" : ""}">${c.name}</a>`).join("")}
      <div class="filter-group"><h4>Harga</h4>
        <div class="price-row"><input class="input" type="number" min="0" step="1000" placeholder="Min" id="fMin" value="${state.min}"><input class="input" type="number" min="0" step="1000" placeholder="Maks" id="fMax" value="${state.max}"></div>
      </div>
      <div class="filter-group"><h4>Kondisi</h4>
        ${conds.map(c => `<label class="check"><input type="checkbox" data-cond="${esc(c)}" ${state.conds.includes(c) ? "checked" : ""}> ${esc(c)}</label>`).join("")}
      </div>
      <div class="filter-group"><h4>Ukuran</h4>
        ${sizes.map(s => `<label class="check"><input type="checkbox" data-size="${esc(s)}" ${state.sizes.includes(s) ? "checked" : ""}> ${esc(s)}</label>`).join("")}
      </div>
      <button class="link-btn" id="fReset">Reset filter</button>
    </aside>
    <section>
      <h1>${title}</h1>
      <div class="shop-top">
        <span id="count"></span>
        <button class="btn small outline filter-toggle" id="fToggle">Filter</button>
        <label style="margin:0;font-weight:400">Sort by:
          <select id="sort">
            <option value="default">Default</option>
            <option value="price-asc">Harga terendah</option>
            <option value="price-desc">Harga tertinggi</option>
            <option value="popular">Popularitas</option>
            <option value="newest">Terbaru</option>
          </select></label>
      </div>
      <div class="grid" id="results"></div>
    </section></div>`;
  $("#sort").value = state.sort;
  const draw = () => {
    const list = filtered();
    $("#count").textContent = `${list.length} products`;
    $("#results").innerHTML = list.length ? list.map(card).join("") :
      `<div class="empty" style="grid-column:1/-1">Tidak ada produk yang cocok. Coba kata kunci lain atau <button class="link-btn" id="emptyReset">reset filter</button>.</div>`;
    const er = $("#emptyReset"); if (er) er.onclick = () => { resetFilters(); pageShop(); };
  };
  draw();
  $("#sort").onchange = e => { state.sort = e.target.value; draw(); };
  $("#fMin").oninput = e => { state.min = e.target.value; draw(); };
  $("#fMax").oninput = e => { state.max = e.target.value; draw(); };
  $$("[data-cond]").forEach(i => i.onchange = () => { state.conds = $$("[data-cond]:checked").map(x => x.dataset.cond); draw(); });
  $$("[data-size]").forEach(i => i.onchange = () => { state.sizes = $$("[data-size]:checked").map(x => x.dataset.size); draw(); });
  $("#fReset").onclick = () => { const c = state.cat; resetFilters(); state.cat = c; pageShop(); };
  $("#fToggle").onclick = () => $("#sidebar").classList.toggle("open");
}

function stars(n) { return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n); }

function pageDetail(slug) {
  const p = bySlug(slug);
  if (!p) return pageNotFound();
  const left = stockLeft(p);
  const rv = reviews()[p.id] || [];
  const avg = rv.length ? (rv.reduce((s, r) => s + r.rating, 0) / rv.length).toFixed(1) : null;
  const u = me();
  const bought = u && orders().some(o => o.email === u.email && o.status >= 1 && o.items.some(i => i.id === p.id));
  const related = PRODUCTS.filter(x => x.cat === p.cat && x.id !== p.id).slice(0, 4);
  let qty = 1;
  app.innerHTML = `<div class="container">
    <div class="crumbs"><a href="#home">Home</a> / <a href="#cat-${p.cat}">${catName(p.cat)}</a> / ${esc(p.name)}</div>
    <div class="detail">
      <div class="detail-img ${p.photo ? "photo" : "illu"}"><img src="${p.img}" alt="${esc(p.name)}"></div>
      <div>
        <h1>${esc(p.name)}</h1>
        <div class="price">${rp(p.price)}</div>
        ${avg ? `<div><span class="stars">${stars(Math.round(avg))}</span> ${avg} (${rv.length} ulasan)</div>` : ""}
        <p>${esc(p.desc)}</p>
        <dl class="specs">
          <dt>Kategori</dt><dd>${catName(p.cat)}</dd>
          <dt>Kondisi</dt><dd>${esc(p.cond)}</dd>
          <dt>Ukuran</dt><dd>${esc(p.size)}</dd>
          <dt>Stok</dt><dd>${left > 0 ? left + " tersedia" : "Habis terjual"}</dd>
        </dl>
        <div class="buy-row">
          <div class="qty"><button id="qMinus" aria-label="Kurangi">−</button><span id="qVal">1</span><button id="qPlus" aria-label="Tambah">+</button></div>
          <button class="btn" id="addBtn" ${left === 0 ? "disabled" : ""}>Tambah ke Keranjang</button>
          <button class="btn outline" id="buyBtn" ${left === 0 ? "disabled" : ""}>Beli Sekarang</button>
        </div>
        <div class="seller">
          <div class="avatar">P</div>
          <div><b>${SELLER.name}</b><div class="hint">${SELLER.city} · Barang sudah dicek & dibersihkan</div></div>
          <a href="#about-contact" class="btn small outline" style="margin-left:auto">Chat</a>
        </div>
      </div>
    </div>
    <section class="reviews">
      <h2>Ulasan Pembeli ${rv.length ? `(${rv.length})` : ""}</h2>
      ${rv.length ? rv.map(r => `<div class="review"><span class="stars">${stars(r.rating)}</span> <b>${esc(r.name)}</b> <span class="hint">· ${fmtDate(r.at)}</span><p style="margin:6px 0 0">${esc(r.text)}</p></div>`).join("")
        : `<p class="hint">Belum ada ulasan untuk barang ini.</p>`}
      ${bought ? `<form id="reviewForm" class="box" style="margin-top:20px;max-width:560px">
          <h2>Tulis ulasan</h2>
          <div class="star-input">${[5,4,3,2,1].map(n => `<input type="radio" name="rating" id="r${n}" value="${n}" ${n===5?"checked":""}><label for="r${n}">★</label>`).join("")}</div>
          <div class="field"><textarea class="input" name="text" rows="3" required placeholder="Bagaimana kondisi barangnya?"></textarea></div>
          <button class="btn">Kirim ulasan</button></form>`
        : `<p class="hint">${u ? "Ulasan bisa ditulis setelah kamu membeli barang ini." : `<a href="#login">Login</a> dan beli barang ini untuk menulis ulasan.`}</p>`}
    </section>
    ${related.length ? `<section class="section" style="padding-top:10px"><div class="section-head"><h2>Barang serupa</h2></div><div class="grid">${related.map(card).join("")}</div></section>` : ""}
  </div>`;
  const setQ = v => { qty = Math.min(Math.max(1, v), Math.max(1, left)); $("#qVal").textContent = qty; };
  $("#qMinus").onclick = () => setQ(qty - 1);
  $("#qPlus").onclick = () => setQ(qty + 1);
  $("#addBtn").onclick = () => addToCart(p.id, qty);
  $("#buyBtn").onclick = () => { if (!cart().some(i => i.id === p.id)) addToCart(p.id, qty); go("cart"); };
  const rf = $("#reviewForm");
  if (rf) rf.onsubmit = e => {
    e.preventDefault();
    const all = reviews(); (all[p.id] = all[p.id] || []).unshift({ name: u.name, rating: +rf.rating.value, text: rf.text.value.trim(), at: Date.now() });
    store.set("reviews", all); toast("Terima kasih atas ulasanmu!"); pageDetail(slug);
  };
}

function cartTotals(c, courier) {
  const sub = c.reduce((s, i) => s + byId(i.id).price * i.qty, 0);
  const disc = state.promo === PROMO.code ? Math.round(sub * PROMO.pct / 100) : 0;
  const ship = courier ? courier.cost : 0;
  return { sub, disc, ship, total: sub - disc + ship };
}

function pageCart() {
  const c = cart();
  if (!c.length) {
    app.innerHTML = `<div class="container page"><h1>Shopping bag</h1><div class="empty">Keranjangmu masih kosong.<br><br><a href="#product" class="btn">Mulai belanja</a></div></div>`;
    return;
  }
  const t = cartTotals(c);
  app.innerHTML = `<div class="container page"><h1>Shopping bag</h1>
    <div class="two-col">
      <div>${c.map(i => { const p = byId(i.id); return `<div class="cart-item">
          <a href="#p-${p.slug}" class="ci-img ${p.photo ? "" : "illu"}"><img src="${p.img}" alt=""></a>
          <div><h3><a href="#p-${p.slug}" style="text-decoration:none">${esc(p.name)}</a></h3>
            <div class="hint">${esc(p.cond)} · ${esc(p.size)}</div>
            <div class="qty" style="margin-top:8px"><button data-dec="${p.id}" aria-label="Kurangi">−</button><span>${i.qty}</span><button data-inc="${p.id}" aria-label="Tambah">+</button></div>
          </div>
          <div style="text-align:right"><b>${rp(p.price * i.qty)}</b><br><button class="remove" data-rm="${p.id}">Hapus</button></div>
        </div>`; }).join("")}
      </div>
      <aside class="summary">
        <h2 style="font-size:20px">Ringkasan</h2>
        <div class="row"><span>Subtotal (${c.reduce((s, i) => s + i.qty, 0)} barang)</span><span>${rp(t.sub)}</span></div>
        ${t.disc ? `<div class="row ok"><span>Diskon ${PROMO.code}</span><span>−${rp(t.disc)}</span></div>` : ""}
        <form id="promoForm" class="price-row" style="margin:12px 0">
          <input class="input" id="promoIn" placeholder="Kode promo" value="${esc(state.promo)}"><button class="btn small outline">Pakai</button>
        </form>
        <div class="row total"><span>Total</span><span>${rp(t.total)}</span></div>
        <p class="hint">Ongkir dihitung di langkah berikutnya.</p>
        <a href="#checkout" class="btn block">Checkout</a>
        <a href="#product" class="btn block outline" style="margin-top:8px">Lanjut belanja</a>
      </aside>
    </div></div>`;
  const mod = (id, d) => { const cc = cart(); const it = cc.find(x => x.id === id); const p = byId(id);
    if (d > 0 && it.qty + 1 > stockLeft(p)) return toast(`Stok tersisa ${stockLeft(p)}`);
    it.qty += d; setCart(cc.filter(x => x.qty > 0)); pageCart(); };
  $$("[data-inc]").forEach(b => b.onclick = () => mod(+b.dataset.inc, 1));
  $$("[data-dec]").forEach(b => b.onclick = () => mod(+b.dataset.dec, -1));
  $$("[data-rm]").forEach(b => b.onclick = () => { setCart(cart().filter(x => x.id !== +b.dataset.rm)); pageCart(); });
  $("#promoForm").onsubmit = e => { e.preventDefault(); const v = $("#promoIn").value.trim().toUpperCase();
    if (!v) { state.promo = ""; pageCart(); return; }
    if (v === PROMO.code) { state.promo = v; toast("Kode promo berhasil dipakai"); } else toast("Kode promo tidak valid");
    pageCart(); };
}

function pageCheckout() {
  const u = me();
  if (!u) { state.redirect = "checkout"; toast("Silakan login dulu untuk checkout"); return go("login"); }
  const c = cart();
  if (!c.length) return go("cart");
  const saved = u.address || {};
  app.innerHTML = `<div class="container page"><h1>Checkout</h1>
    <div class="steps"><span>1. Keranjang</span><span class="on">2. Pengiriman & Pembayaran</span><span>3. Konfirmasi</span></div>
    <form id="coForm" class="two-col" novalidate>
      <div>
        <div class="box"><h2>Detail pengiriman</h2>
          <div class="grid2">
            <div class="field"><label for="cName">Nama penerima</label><input class="input" id="cName" required value="${esc(saved.name || u.name)}"></div>
            <div class="field"><label for="cPhone">Nomor HP / WhatsApp</label><input class="input" id="cPhone" type="tel" required placeholder="08xxxxxxxxxx" value="${esc(saved.phone || "")}"></div>
          </div>
          <div class="field"><label for="cAddr">Alamat lengkap</label><textarea class="input" id="cAddr" rows="2" required placeholder="Jalan, nomor, RT/RW, kelurahan">${esc(saved.addr || "")}</textarea></div>
          <div class="grid2">
            <div class="field"><label for="cCity">Kota / Kabupaten</label><input class="input" id="cCity" required value="${esc(saved.city || "")}"></div>
            <div class="field"><label for="cZip">Kode pos</label><input class="input" id="cZip" inputmode="numeric" required value="${esc(saved.zip || "")}"></div>
          </div>
          <div class="field"><label for="cCourier">Jasa pengiriman</label>
            <select class="input" id="cCourier">${COURIERS.map(k => `<option value="${k.id}">${k.name} — ${k.cost ? rp(k.cost) : "Gratis"} (${k.eta})</option>`).join("")}</select></div>
        </div>
        <div class="box"><h2>Metode pembayaran</h2>
          ${PAYMENTS.map((m, i) => `<label class="pay-opt"><input type="radio" name="pay" value="${m.id}" ${i === 0 ? "checked" : ""}><span><b>${m.name}</b><span class="hint">${m.note}</span></span></label>`).join("")}
          <div class="pay-detail" id="payDetail"></div>
        </div>
      </div>
      <aside class="summary">
        <h2 style="font-size:20px">Pesananmu</h2>
        ${c.map(i => { const p = byId(i.id); return `<div class="row"><span>${esc(p.name)} × ${i.qty}</span><span>${rp(p.price * i.qty)}</span></div>`; }).join("")}
        <div id="coTotals"></div>
        <p class="error" id="coErr" hidden></p>
        <button class="btn block" type="submit">Bayar Sekarang</button>
        <p class="hint" style="margin-top:10px">Dengan menekan tombol di atas kamu menyetujui syarat & ketentuan toko.</p>
      </aside>
    </form></div>`;
  const courier = () => COURIERS.find(k => k.id === $("#cCourier").value);
  const drawTotals = () => { const t = cartTotals(c, courier());
    $("#coTotals").innerHTML = `<div class="row"><span>Subtotal</span><span>${rp(t.sub)}</span></div>
      ${t.disc ? `<div class="row ok"><span>Diskon</span><span>−${rp(t.disc)}</span></div>` : ""}
      <div class="row"><span>Ongkos kirim</span><span>${t.ship ? rp(t.ship) : "Gratis"}</span></div>
      <div class="row total"><span>Total</span><span>${rp(t.total)}</span></div>`; };
  const drawPay = () => { const m = $("input[name=pay]:checked").value;
    $("#payDetail").innerHTML = m === "card" ? `
      <div class="field"><label for="ccNum">Nomor kartu</label><input class="input" id="ccNum" inputmode="numeric" placeholder="1234 5678 9012 3456" maxlength="19"></div>
      <div class="grid2"><div class="field"><label for="ccExp">Berlaku s/d</label><input class="input" id="ccExp" placeholder="MM/YY" maxlength="5"></div>
      <div class="field"><label for="ccCvv">CVV</label><input class="input" id="ccCvv" inputmode="numeric" maxlength="4" placeholder="123"></div></div>
      <p class="hint">Mode demo — jangan masukkan data kartu sungguhan.</p>`
      : m === "bank" ? `<div class="field"><label for="bank">Pilih bank</label><select class="input" id="bank"><option>BCA</option><option>BRI</option><option>Mandiri</option><option>BNI</option></select></div><p class="hint">Nomor rekening & instruksi transfer muncul setelah pesanan dibuat.</p>`
      : `<div class="field"><label for="wallet">Pilih dompet digital</label><select class="input" id="wallet"><option>GoPay</option><option>OVO</option><option>DANA</option><option>ShopeePay</option></select></div><p class="hint">Instruksi pembayaran muncul setelah pesanan dibuat.</p>`;
  };
  drawTotals(); drawPay();
  $("#cCourier").onchange = drawTotals;
  $$("input[name=pay]").forEach(r => r.onchange = drawPay);
  $("#coForm").onsubmit = e => {
    e.preventDefault();
    const err = $("#coErr"); err.hidden = true;
    const v = id => $("#" + id).value.trim();
    const miss = ["cName", "cPhone", "cAddr", "cCity", "cZip"].filter(id => !v(id));
    if (miss.length) { err.textContent = "Lengkapi semua detail pengiriman."; err.hidden = false; $("#" + miss[0]).focus(); return; }
    if (!/^0\d{8,13}$|^\+62\d{8,13}$/.test(v("cPhone").replace(/[\s-]/g, ""))) { err.textContent = "Nomor HP tidak valid."; err.hidden = false; return; }
    const pay = $("input[name=pay]:checked").value;
    let payInfo = "";
    if (pay === "card") {
      const num = v("ccNum").replace(/\s/g, "");
      if (!/^\d{16}$/.test(num) || !/^\d\d\/\d\d$/.test(v("ccExp")) || !/^\d{3,4}$/.test(v("ccCvv"))) { err.textContent = "Data kartu belum lengkap/valid."; err.hidden = false; return; }
      payInfo = "Kartu •••• " + num.slice(-4);
    } else payInfo = pay === "bank" ? $("#bank").value : $("#wallet").value;
    // stok final
    for (const i of c) if (i.qty > stockLeft(byId(i.id))) { err.textContent = `Stok ${byId(i.id).name} sudah tidak cukup.`; err.hidden = false; return; }
    const addr = { name: v("cName"), phone: v("cPhone"), addr: v("cAddr"), city: v("cCity"), zip: v("cZip") };
    const all = users(); all[u.email].address = addr; store.set("users", all);
    const t = cartTotals(c, courier());
    const id = "PLY" + Date.now().toString().slice(-8);
    const order = { id, email: u.email, items: c, ...t, courier: courier().name, courierId: courier().id, pay, payInfo, addr,
      createdAt: Date.now(), paidAt: pay === "card" ? Date.now() : null, status: pay === "card" ? 1 : 0, resi: null };
    store.set("orders", [order, ...orders()]);
    setCart([]); state.promo = "";
    if (order.status === 1) notifyPaid(order);
    else notify(u.email, `Pesanan ${id} dibuat`, `Selesaikan pembayaran ${rp(order.total)} via ${payInfo} agar pesanan diproses.`);
    go("order-" + id);
  };
}

function notify(email, title, body) {
  const n = store.get("notif", []); n.unshift({ email, title, body, at: Date.now(), read: false }); store.set("notif", n);
}
function notifyPaid(o) {
  notify(o.email, `Pembayaran pesanan ${o.id} berhasil`, `Email konfirmasi telah dikirim ke ${o.email}. Total ${rp(o.total)}. Pesananmu segera dikemas.`);
  toast("Pembayaran berhasil! Email konfirmasi telah dikirim.");
}

/* Status pesanan bergerak otomatis (simulasi): Dibayar → Dikemas (1 mnt) → Dikirim (2 mnt) → Diterima (5 mnt) */
function refreshOrders() {
  const list = orders(); let changed = false;
  for (const o of list) {
    if (!o.paidAt || o.status >= 4) continue;
    const m = (Date.now() - o.paidAt) / 60000;
    const s = m >= 5 ? 4 : m >= 2 ? 3 : m >= 1 ? 2 : 1;
    if (s > o.status) {
      if (s >= 3 && !o.resi) {
        o.resi = (o.courierId === "pickup" ? "COD" : o.courierId.toUpperCase()) + Math.floor(1e9 + Math.random() * 9e9);
        notify(o.email, `Pesanan ${o.id} dikirim`, `Nomor resi: ${o.resi} (${o.courier}). Lacak di menu Lacak Pesanan.`);
      }
      if (s === 4) notify(o.email, `Pesanan ${o.id} diterima`, `Terima kasih! Jangan lupa beri ulasan untuk barangnya.`);
      o.status = s; changed = true;
    }
  }
  if (changed) store.set("orders", list);
  return list;
}
const statusTimes = o => [o.createdAt, o.paidAt, o.paidAt && o.paidAt + 60000, o.paidAt && o.paidAt + 120000, o.paidAt && o.paidAt + 300000];
function timeline(o) {
  const t = statusTimes(o);
  const desc = ["Pesanan dibuat", "Pembayaran terverifikasi", "Penjual sedang mengemas barang", `Dalam pengiriman — ${esc(o.courier)}${o.resi ? ` · Resi <b style="display:inline">${o.resi}</b>` : ""}`, "Pesanan sudah diterima"];
  return `<ul class="timeline">${STATUSES.map((s, i) => `<li class="${o.status >= i ? "done" : ""}"><b>${s}</b>${desc[i]}${o.status >= i && t[i] ? ` · <span class="hint">${fmtDate(t[i])}</span>` : ""}</li>`).join("")}</ul>`;
}

function pageOrder(id) {
  const u = me();
  const o = refreshOrders().find(x => x.id === id);
  if (!o || !u || o.email !== u.email) return pageNotFound("Pesanan tidak ditemukan.");
  const bankAcc = { BCA: "123 456 7890", BRI: "0012 01 000123 50 1", Mandiri: "123 00 1234567 8", BNI: "0123456789" };
  app.innerHTML = `<div class="container page" style="max-width:820px">
    <div class="steps"><span>1. Keranjang</span><span>2. Pengiriman & Pembayaran</span><span class="on">3. Konfirmasi</span></div>
    ${o.status === 0 ? `
      <div class="box"><h2>Selesaikan pembayaran</h2>
        <p>Total yang harus dibayar: <b style="font-size:22px">${rp(o.total)}</b></p>
        ${o.pay === "bank" ? `<p>Transfer ke rekening <b>${o.payInfo}</b> <b>${bankAcc[o.payInfo]}</b> a.n. <b>Preloveyou Store</b>.</p>
          <ol><li>Buka m-banking / ATM ${o.payInfo}.</li><li>Pilih menu transfer dan masukkan nomor rekening di atas.</li><li>Masukkan nominal persis ${rp(o.total)}.</li><li>Simpan bukti transfer lalu tekan tombol di bawah.</li></ol>`
        : `<p>Bayar melalui <b>${o.payInfo}</b> ke nomor <b>0812-0000-0000</b> (Preloveyou Store).</p>
          <ol><li>Buka aplikasi ${o.payInfo} lalu pilih Kirim / Transfer.</li><li>Masukkan nomor di atas dan nominal ${rp(o.total)}.</li><li>Tambahkan catatan: ${o.id}.</li><li>Tekan tombol di bawah setelah berhasil.</li></ol>`}
        <button class="btn" id="paidBtn">Saya sudah bayar</button>
        <p class="hint" style="margin-top:10px">Mode demo — tidak ada uang yang benar-benar ditransfer.</p>
      </div>` : `
      <div class="success-hero"><div class="check-big">✓</div><h1>Terima kasih, pembayaran diterima!</h1>
        <p class="hint">Notifikasi & email konfirmasi telah dikirim ke ${esc(o.email)}.</p></div>`}
    <div class="box">
      <div class="order-card top" style="border:0;padding:0;margin:0"><div><b>Nomor pesanan: ${o.id}</b><div class="hint">${fmtDate(o.createdAt)}</div></div><span class="status s${o.status}">${STATUSES[o.status]}</span></div>
      ${timeline(o)}
      ${o.items.map(i => { const p = byId(i.id); return `<div class="row" style="display:flex;justify-content:space-between"><span>${esc(p.name)} × ${i.qty}</span><span>${rp(p.price * i.qty)}</span></div>`; }).join("")}
      <hr style="border:0;border-top:1px solid var(--line)">
      ${o.disc ? `<div style="display:flex;justify-content:space-between"><span>Diskon</span><span>−${rp(o.disc)}</span></div>` : ""}
      <div style="display:flex;justify-content:space-between"><span>Ongkir (${esc(o.courier)})</span><span>${rp(o.ship)}</span></div>
      <div style="display:flex;justify-content:space-between;font-weight:700;font-size:18px"><span>Total</span><span>${rp(o.total)}</span></div>
      <p class="hint">Dikirim ke: ${esc(o.addr.name)} (${esc(o.addr.phone)}) — ${esc(o.addr.addr)}, ${esc(o.addr.city)} ${esc(o.addr.zip)}</p>
    </div>
    <a href="#account-orders" class="btn outline">Lihat riwayat pembelian</a> <a href="#track" class="btn outline">Lacak pesanan</a>
  </div>`;
  const pb = $("#paidBtn");
  if (pb) pb.onclick = () => {
    const list = orders(); const x = list.find(y => y.id === id); x.status = 1; x.paidAt = Date.now(); store.set("orders", list);
    notifyPaid(x); pageOrder(id);
  };
}

function pageTrack() {
  const u = me();
  const mine = u ? refreshOrders().filter(o => o.email === u.email) : [];
  app.innerHTML = `<div class="container page" style="max-width:760px"><h1>Lacak Pesanan</h1>
    <p class="hint">Masukkan nomor pesanan (contoh: PLY12345678) atau nomor resi.</p>
    <form id="trackForm" class="price-row" style="margin:16px 0"><input class="input" id="trackIn" placeholder="Nomor pesanan / resi"><button class="btn">Lacak</button></form>
    <div id="trackOut"></div>
    ${mine.length ? `<h2 style="margin-top:30px;font-size:20px">Pesanan saya</h2>${mine.map(o => `<div class="order-card"><div class="top"><b>${o.id}</b><span class="status s${o.status}">${STATUSES[o.status]}</span></div>
      <div class="hint">${o.resi ? "Resi: " + o.resi + " · " : ""}${esc(o.courier)}</div><button class="link-btn" data-track="${o.id}">Lihat status</button></div>`).join("")}`
      : !u ? `<p class="hint"><a href="#login">Login</a> untuk melihat semua pesananmu.</p>` : ""}
  </div>`;
  const show = q => {
    q = q.trim().toUpperCase(); const o = refreshOrders().find(x => x.id === q || (x.resi && x.resi === q));
    $("#trackOut").innerHTML = o ? `<div class="box"><div class="top" style="display:flex;justify-content:space-between"><b>${o.id}</b><span class="status s${o.status}">${STATUSES[o.status]}</span></div>${timeline(o)}
      ${o.resi && o.courierId !== "pickup" ? `<p class="hint">Kamu juga bisa melacak resi langsung di situs ${esc(o.courier)}.</p>` : ""}</div>`
      : `<div class="empty">Pesanan tidak ditemukan. Periksa kembali nomornya.</div>`;
  };
  $("#trackForm").onsubmit = e => { e.preventDefault(); show($("#trackIn").value); };
  $$("[data-track]").forEach(b => b.onclick = () => { $("#trackIn").value = b.dataset.track; show(b.dataset.track); });
}

/* ---------- Akun ---------- */
function authShell(inner) { app.innerHTML = `<div class="auth-wrap"><div class="auth-card">${inner}</div></div>`; }

function pageLogin() {
  if (me()) return go("account");
  authShell(`<h1>Login</h1><p class="sub">Selamat datang kembali di Preloveyou</p>
    <form id="f" novalidate>
      <p class="error" id="err" hidden></p>
      <div class="field"><label for="email">Email</label><input class="input" id="email" type="email" autocomplete="email" required></div>
      <div class="field"><label for="pw">Password</label><input class="input" id="pw" type="password" autocomplete="current-password" required></div>
      <div class="right"><a href="#forgot">Lupa Password?</a></div>
      <button class="btn block">Login</button>
    </form>
    <div class="auth-foot">Belum punya akun? <a href="#register">Daftar</a></div>`);
  $("#f").onsubmit = e => {
    e.preventDefault();
    const email = $("#email").value.trim().toLowerCase(), u = users()[email], err = $("#err");
    if (!u || u.pw !== hash($("#pw").value)) { err.textContent = "Email atau password salah."; err.hidden = false; return; }
    store.set("session", email); renderAccountSlot(); toast(`Halo, ${u.name}!`);
    const r = state.redirect; state.redirect = ""; go(r || "home");
  };
}

function pageRegister() {
  if (me()) return go("account");
  authShell(`<h1>Daftar</h1><p class="sub">Buat akun untuk mulai belanja</p>
    <form id="f" novalidate>
      <p class="error" id="err" hidden></p>
      <div class="field"><label for="name">Nama lengkap</label><input class="input" id="name" autocomplete="name" required></div>
      <div class="field"><label for="email">Email</label><input class="input" id="email" type="email" autocomplete="email" required></div>
      <div class="field"><label for="pw">Password</label><input class="input" id="pw" type="password" autocomplete="new-password" minlength="6" required><span class="hint">Minimal 6 karakter</span></div>
      <div class="field"><label for="pw2">Ulangi password</label><input class="input" id="pw2" type="password" autocomplete="new-password" required></div>
      <button class="btn block">Daftar</button>
    </form>
    <div class="auth-foot">Sudah punya akun? <a href="#login">Login</a></div>`);
  $("#f").onsubmit = e => {
    e.preventDefault();
    const name = $("#name").value.trim(), email = $("#email").value.trim().toLowerCase(), pw = $("#pw").value, err = $("#err");
    const fail = m => { err.textContent = m; err.hidden = false; };
    if (!name) return fail("Nama wajib diisi.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Format email tidak valid.");
    if (pw.length < 6) return fail("Password minimal 6 karakter.");
    if (pw !== $("#pw2").value) return fail("Konfirmasi password tidak sama.");
    const all = users(); if (all[email]) return fail("Email sudah terdaftar. Silakan login.");
    all[email] = { name, email, pw: hash(pw), joined: Date.now() }; store.set("users", all);
    store.set("session", email); renderAccountSlot();
    notify(email, "Selamat datang di Preloveyou!", `Gunakan kode ${PROMO.code} untuk diskon ${PROMO.pct}% di pembelian pertamamu.`);
    toast("Akun berhasil dibuat"); const r = state.redirect; state.redirect = ""; go(r || "home");
  };
}

function pageForgot() {
  authShell(`<h1>Lupa Password</h1><p class="sub">Kami akan mengirim kode reset ke email kamu</p>
    <form id="f1" novalidate>
      <p class="error" id="err" hidden></p>
      <div class="field"><label for="email">Email terdaftar</label><input class="input" id="email" type="email" required></div>
      <button class="btn block">Kirim kode reset</button>
    </form>
    <form id="f2" hidden novalidate>
      <div class="demo-note" id="codeNote"></div>
      <p class="error" id="err2" hidden></p>
      <div class="field"><label for="code">Kode reset (6 digit)</label><input class="input" id="code" inputmode="numeric" maxlength="6" required></div>
      <div class="field"><label for="npw">Password baru</label><input class="input" id="npw" type="password" minlength="6" required></div>
      <button class="btn block">Simpan password baru</button>
    </form>
    <div class="auth-foot"><a href="#login">Kembali ke Login</a></div>`);
  let email = "", code = "";
  $("#f1").onsubmit = e => {
    e.preventDefault(); email = $("#email").value.trim().toLowerCase();
    if (!users()[email]) { $("#err").textContent = "Email belum terdaftar."; $("#err").hidden = false; return; }
    code = String(Math.floor(100000 + Math.random() * 900000));
    $("#f1").hidden = true; $("#f2").hidden = false;
    $("#codeNote").innerHTML = `Kode reset telah dikirim ke <b>${esc(email)}</b>.<br><span class="hint">Mode demo (tanpa server email) — kodenya: <b>${code}</b></span>`;
  };
  $("#f2").onsubmit = e => {
    e.preventDefault(); const err = $("#err2");
    if ($("#code").value.trim() !== code) { err.textContent = "Kode salah."; err.hidden = false; return; }
    if ($("#npw").value.length < 6) { err.textContent = "Password minimal 6 karakter."; err.hidden = false; return; }
    const all = users(); all[email].pw = hash($("#npw").value); store.set("users", all);
    toast("Password berhasil direset. Silakan login."); go("login");
  };
}

function pageAccount(tab = "profile") {
  const u = me();
  if (!u) { state.redirect = "account" + (tab !== "profile" ? "-" + tab : ""); return go("login"); }
  const mine = refreshOrders().filter(o => o.email === u.email);
  const notifs = store.get("notif", []).filter(n => n.email === u.email);
  const unread = notifs.filter(n => !n.read).length;
  let body = "";
  if (tab === "orders") body = mine.length ? mine.map(o => `<div class="order-card">
      <div class="top"><div><b>${o.id}</b> <span class="hint">· ${fmtDate(o.createdAt)}</span></div><span class="status s${o.status}">${STATUSES[o.status]}</span></div>
      <div>${o.items.map(i => esc(byId(i.id).name) + " × " + i.qty).join(", ")}</div>
      <div class="hint">${rp(o.total)} · ${esc(o.courier)}${o.resi ? " · Resi " + o.resi : ""}</div>
      <a href="#order-${o.id}" class="btn small outline" style="margin-top:10px">${o.status === 0 ? "Bayar sekarang" : "Detail & lacak"}</a></div>`).join("")
    : `<div class="empty">Belum ada pembelian. <a href="#product">Mulai belanja</a></div>`;
  else if (tab === "notif") {
    body = notifs.length ? notifs.map(n => `<div class="order-card" style="${n.read ? "" : "border-color:var(--pink)"}"><b>${esc(n.title)}</b> <span class="hint">· ${fmtDate(n.at)}</span><p style="margin:6px 0 0">${esc(n.body)}</p></div>`).join("")
      : `<div class="empty">Belum ada notifikasi.</div>`;
    const all = store.get("notif", []); all.forEach(n => { if (n.email === u.email) n.read = true; }); store.set("notif", all);
  } else body = `<form id="pf" class="box" style="max-width:520px">
      <div class="field"><label for="pn">Nama</label><input class="input" id="pn" value="${esc(u.name)}"></div>
      <div class="field"><label>Email</label><input class="input" value="${esc(u.email)}" disabled></div>
      <p class="hint">Alamat tersimpan: ${u.address ? esc(`${u.address.addr}, ${u.address.city}`) : "belum ada (diisi saat checkout)"}</p>
      <button class="btn">Simpan</button> <a href="#logout" class="btn outline">Keluar</a></form>`;
  app.innerHTML = `<div class="container page"><h1>Akun Saya</h1>
    <div class="tabs"><a href="#account" class="${tab === "profile" ? "on" : ""}">Profil</a><a href="#account-orders" class="${tab === "orders" ? "on" : ""}">Riwayat Pembelian (${mine.length})</a><a href="#account-notif" class="${tab === "notif" ? "on" : ""}">Notifikasi${unread ? ` (${unread})` : ""}</a></div>
    ${body}</div>`;
  const pf = $("#pf");
  if (pf) pf.onsubmit = e => { e.preventDefault(); const all = users(); all[u.email].name = $("#pn").value.trim() || u.name; store.set("users", all); renderAccountSlot(); toast("Profil disimpan"); };
}

/* ---------- About, Contact, FAQ ---------- */
function pageAbout(scrollContact) {
  app.innerHTML = `
  <section class="about-hero"><div class="container about-grid">
    <div><h1>About us</h1>
      <p>Preloveyou.store adalah toko online barang <i>preloved</i> — barang bekas layak pakai yang sudah kami cek dan bersihkan. Kami lahir dari kebiasaan anak kos: setiap akhir semester banyak barang bagus yang ditinggal, padahal masih sangat berguna bagi orang lain.</p>
      <p>Lewat Preloveyou, barang-barang itu mendapat rumah baru dengan harga yang bersahabat. <b>Secondhand, First Choice.</b></p></div>
    <div class="hero-photo" role="img" aria-label="Kamar kos dengan barang preloved"></div>
  </div></section>
  <section class="section container">
    <div class="values">
      <div><h3>Kualitas terkurasi</h3><p>Hanya barang yang masih berfungsi baik yang kami jual, lengkap dengan keterangan kondisi yang jujur.</p></div>
      <div><h3>Harga terjangkau</h3><p>Harga barang preloved jauh di bawah harga baru — cocok untuk mahasiswa dan keluarga muda.</p></div>
      <div><h3>Ramah lingkungan</h3><p>Setiap barang yang dipakai ulang berarti satu barang lebih sedikit di tempat sampah.</p></div>
    </div>
  </section>
  <section class="contact" id="contact"><div class="container about-grid" style="align-items:start">
    <div><h2>Contact Us</h2>
      <p class="hint">Ada kendala atau pertanyaan? Hubungi customer service kami lewat salah satu kanal berikut, atau gunakan tombol chat di pojok kanan bawah.</p>
      <div class="contact-list">
        <div><span>Instagram</span><a href="https://instagram.com/${CONTACT.instagram.replace("@", "")}" target="_blank" rel="noopener">${CONTACT.instagram}</a></div>
        <div><span>Whatsapp</span><a href="https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}" target="_blank" rel="noopener">${CONTACT.whatsapp}</a></div>
        <div><span>Email</span><a href="mailto:${CONTACT.email}">${CONTACT.email}</a></div>
        <div><span>Address</span><span style="color:var(--ink)">${CONTACT.address}</span></div>
      </div>
      <p class="hint">Lihat juga <a href="#faq">FAQ / Pertanyaan Umum</a>.</p>
    </div>
    <form class="box" id="cf" style="background:#fff">
      <h2>Kirim pesan</h2>
      <div class="field"><label for="cfn">Nama</label><input class="input" id="cfn" required value="${esc(me()?.name || "")}"></div>
      <div class="field"><label for="cfe">Email</label><input class="input" id="cfe" type="email" required value="${esc(me()?.email || "")}"></div>
      <div class="field"><label for="cfm">Pesan</label><textarea class="input" id="cfm" rows="4" required></textarea></div>
      <button class="btn">Kirim</button>
      <p class="hint" id="cfOk" hidden></p>
    </form>
  </div></section>`;
  $("#cf").onsubmit = e => {
    e.preventDefault();
    const msgs = store.get("messages", []); msgs.push({ name: $("#cfn").value, email: $("#cfe").value, msg: $("#cfm").value, at: Date.now() }); store.set("messages", msgs);
    $("#cfOk").hidden = false; $("#cfOk").textContent = "Pesan tersimpan. Untuk respons cepat, hubungi kami via WhatsApp atau Instagram di samping.";
    $("#cfm").value = "";
  };
  if (scrollContact) requestAnimationFrame(() => $("#contact").scrollIntoView());
}

const FAQ = [
  ["Apa itu barang preloved?", "Barang bekas yang masih layak pakai. Setiap barang di Preloveyou sudah kami periksa, bersihkan, dan beri keterangan kondisi: Baru, Seperti Baru, atau Bekas - Baik."],
  ["Bagaimana cara membeli?", "Pilih produk → klik Tambah ke Keranjang → buka Shopping bag → Checkout → isi detail pengiriman → pilih metode pembayaran → selesaikan pembayaran."],
  ["Metode pembayaran apa saja yang tersedia?", "Transfer bank (BCA, BRI, Mandiri, BNI), kartu kredit/debit, dan dompet digital (GoPay, OVO, DANA, ShopeePay)."],
  ["Berapa lama pengiriman?", "Pesanan dikemas maksimal 1×24 jam setelah pembayaran terverifikasi. Lama pengiriman tergantung kurir: 1–3 hari kerja untuk wilayah Jawa."],
  ["Bagaimana cara melacak pesanan?", "Buka menu Lacak Pesanan lalu masukkan nomor pesanan atau nomor resi. Status juga bisa dilihat di Akun Saya → Riwayat Pembelian."],
  ["Apakah barang bisa dikembalikan?", "Bisa, jika barang yang diterima tidak sesuai deskripsi. Ajukan pengembalian maksimal 2×24 jam setelah barang diterima dengan menyertakan video unboxing melalui WhatsApp atau email."],
  ["Kenapa stok setiap barang sedikit?", "Karena barang preloved umumnya hanya ada satu. Kalau suka, segera checkout sebelum didahului pembeli lain!"],
  ["Saya lupa password, bagaimana?", "Klik Lupa Password di halaman Login, masukkan email terdaftar, lalu ikuti petunjuk untuk membuat password baru."],
];
function pageFaq() {
  app.innerHTML = `<div class="container page faq" style="max-width:820px"><h1>FAQ — Pertanyaan Umum</h1>
    ${FAQ.map(([q, a], i) => `<details ${i === 0 ? "open" : ""}><summary>${q}</summary><p>${a}</p></details>`).join("")}
    <p style="margin-top:30px">Masih ada pertanyaan? <a href="#about-contact">Hubungi customer service</a>.</p></div>`;
}

function pageNotFound(msg = "Halaman tidak ditemukan.") {
  app.innerHTML = `<div class="container page"><div class="empty">${msg}<br><br><a href="#home" class="btn">Kembali ke beranda</a></div></div>`;
}

/* ---------- Router ---------- */
function route() {
  const h = decodeURIComponent(location.hash.slice(1)) || "home";
  $("#mainNav").classList.remove("open");
  let activeCat = "";
  if (h === "home") pageHome();
  else if (h === "product") { state.cat = ""; pageShop(); }
  else if (h.startsWith("cat-")) { state.cat = activeCat = h.slice(4); state.sizes = []; state.query = ""; $("#searchInput").value = ""; pageShop(); }
  else if (h.startsWith("p-")) pageDetail(h.slice(2));
  else if (h === "cart") pageCart();
  else if (h === "checkout") pageCheckout();
  else if (h.startsWith("order-")) pageOrder(h.slice(6));
  else if (h === "track") pageTrack();
  else if (h === "login") pageLogin();
  else if (h === "register") pageRegister();
  else if (h === "forgot") pageForgot();
  else if (h === "account") pageAccount("profile");
  else if (h === "account-orders") pageAccount("orders");
  else if (h === "account-notif") pageAccount("notif");
  else if (h === "logout") { store.set("session", null); renderAccountSlot(); toast("Kamu sudah keluar"); return go("home"); }
  else if (h === "about") pageAbout(false);
  else if (h === "about-contact") pageAbout(true);
  else if (h === "faq") pageFaq();
  else pageNotFound();
  renderCatBar(activeCat);
  $$(".nav-link[data-nav]").forEach(a => a.classList.toggle("active", h === "home"));
  if (h !== "about-contact") window.scrollTo(0, 0);
}

/* ---------- Pencarian ---------- */
$("#searchForm").addEventListener("submit", e => {
  e.preventDefault();
  const q = $("#searchInput").value;
  Object.assign(state, { query: q, cat: "", conds: [], sizes: [], min: "", max: "" });
  if (location.hash === "#product") pageShop(); else location.hash = "product";
});

/* ---------- Chat customer service (balasan otomatis) ---------- */
const chatBody = $("#chatBody");
function botSay(html) { chatBody.insertAdjacentHTML("beforeend", `<div class="msg bot">${html}</div>`); chatBody.scrollTop = chatBody.scrollHeight; }
function meSay(t) { chatBody.insertAdjacentHTML("beforeend", `<div class="msg me">${esc(t)}</div>`); chatBody.scrollTop = chatBody.scrollHeight; }
function botReply(t) {
  t = t.toLowerCase();
  if (/bayar|transfer|pembayaran/.test(t)) return "Kami menerima transfer bank, kartu kredit/debit, dan dompet digital. Instruksi lengkap muncul setelah checkout.";
  if (/lacak|resi|kirim|pesanan/.test(t)) return `Status pesanan bisa dicek di <a href="#track">Lacak Pesanan</a> dengan nomor pesanan atau resi.`;
  if (/retur|kembali|refund/.test(t)) return "Pengembalian bisa diajukan maks. 2×24 jam setelah barang diterima bila tidak sesuai deskripsi. Siapkan video unboxing ya.";
  if (/admin|manusia|cs|whatsapp|wa/.test(t)) return `Hubungi admin langsung di WhatsApp <b>${CONTACT.whatsapp}</b> atau Instagram <b>${CONTACT.instagram}</b>.`;
  if (/diskon|promo|kode/.test(t)) return `Pakai kode <b>${PROMO.code}</b> untuk diskon ${PROMO.pct}% di keranjang belanja.`;
  return `Terima kasih! Untuk pertanyaan lain, cek <a href="#faq">FAQ</a> atau hubungi admin di WhatsApp ${CONTACT.whatsapp}.`;
}
function openChat() {
  $("#chatPanel").hidden = false;
  if (!chatBody.children.length) {
    botSay("Halo! 👋 Ada yang bisa kami bantu?");
    chatBody.insertAdjacentHTML("beforeend", `<div class="quick">${["Cara bayar", "Lacak pesanan", "Pengembalian", "Kode promo", "Hubungi admin"].map(q => `<button>${q}</button>`).join("")}</div>`);
    $$(".quick button", chatBody).forEach(b => b.onclick = () => ask(b.textContent));
  }
  $("#chatInput").focus();
}
function ask(t) { meSay(t); setTimeout(() => botSay(botReply(t)), 400); }
$("#chatBubble").onclick = () => $("#chatPanel").hidden ? openChat() : ($("#chatPanel").hidden = true);
$("#chatClose").onclick = () => $("#chatPanel").hidden = true;
$("#chatForm").onsubmit = e => { e.preventDefault(); const v = $("#chatInput").value.trim(); if (v) { ask(v); $("#chatInput").value = ""; } };

/* ---------- Mulai ---------- */
$("#menuToggle").onclick = () => $("#mainNav").classList.toggle("open");
$("#year").textContent = new Date().getFullYear();
window.addEventListener("hashchange", route);
renderAccountSlot(); updateBadge(); route();
setInterval(() => { const h = location.hash; if (/^#(order-|track|account-orders)/.test(h)) { const before = JSON.stringify(orders()); refreshOrders(); if (JSON.stringify(orders()) !== before) route(); } }, 15000);
