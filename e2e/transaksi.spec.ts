import { expect, test, type Page } from "@playwright/test";
import { cleanupTestData, createTestProduct, createTestPromo, eventCount, expireNow, makeAdmin, promoUsed, statusOf, stockOf } from "./db";
import { addToCart, clickAction, fillCheckout, formAlert, newUser, stamp, testEmail } from "./helpers";

test.describe.configure({ mode: "serial" });
test.setTimeout(120_000);

const multi = `e2e-multi-${stamp}`; // stok 5, Rp20.000
const rare = `e2e-langka-${stamp}`; // stok 1, Rp50.000
const promo = `E2E${String(stamp).slice(-6)}`;
const resi = `RESI${String(stamp).slice(-8)}`;

type U = Awaited<ReturnType<typeof newUser>>;
let ani: U, budi: U, admin: U;
let orderAni = "";
let rareOrder = "";

test.beforeAll(async ({ browser }) => {
  await cleanupTestData();
  await createTestProduct(multi, 5, 20000);
  await createTestProduct(rare, 1, 50000);
  await createTestPromo(promo, 10, { quota: 5, firstPurchaseOnly: true });
  ani = await newUser(browser, "Ani Pembeli", testEmail("ani"));
  budi = await newUser(browser, "Budi Pembeli", testEmail("budi"));
  admin = await newUser(browser, "Citra Admin", testEmail("admin"));
  await makeAdmin(testEmail("admin"));
});

test.afterAll(async () => {
  await Promise.all([ani?.context.close(), budi?.context.close(), admin?.context.close()]);
  await cleanupTestData();
});

const orderCode = (page: Page) => page.url().split("/").pop()!;

test("checkout: promo pembelian pertama, ongkir, total, dan stok berkurang", async () => {
  const p = ani.page;
  await addToCart(p, multi, 2);
  await p.goto("/checkout");
  await fillCheckout(p, /SiCepat/);

  await p.getByLabel("Kode promo").fill(promo.toLowerCase());
  await expect(async () => {
    await p.getByRole("button", { name: "Pakai" }).click();
    await expect(p.getByRole("status").filter({ hasText: "Diskon 10% dipakai." })).toBeVisible({ timeout: 2500 });
  }).toPass();
  // Subtotal 40.000 − diskon 4.000 + SiCepat 9.000
  await expect(p.getByText("Rp45.000")).toBeVisible();

  await p.getByRole("button", { name: "Buat Pesanan" }).click();
  await expect(p).toHaveURL(/\/pesanan\/PLY-[A-Z0-9]{6}$/);
  orderAni = orderCode(p);

  await expect(p.getByRole("heading", { name: "Selesaikan pembayaran" })).toBeVisible();
  await expect(p.getByText("BCA 111 222 333 a.n. Uji Otomatis")).toBeVisible();
  const wa = await p.getByRole("link", { name: "Konfirmasi lewat WhatsApp" }).getAttribute("href");
  expect(wa).toContain("https://wa.me/");
  expect(decodeURIComponent(wa!)).toContain(orderAni);
  expect(decodeURIComponent(wa!)).toContain("Rp45.000");

  expect(await stockOf(multi)).toBe(3);
  expect(await promoUsed(promo)).toBe(1);
  expect(await statusOf(orderAni)).toBe("PENDING_PAYMENT");

  // Keranjang dikosongkan dan alamat tersimpan untuk checkout berikutnya.
  await p.goto("/keranjang");
  await expect(p.getByText("Keranjangmu masih kosong.")).toBeVisible();
});

test("pesanan hanya bisa dilihat pemiliknya", async () => {
  await budi.page.goto(`/pesanan/${orderAni}`);
  await expect(budi.page.getByRole("heading", { name: "Halaman tidak ditemukan" })).toBeVisible();
});

test("kode promo pembelian pertama ditolak untuk pembeli yang sudah pernah memesan", async () => {
  const p = ani.page;
  await addToCart(p, multi, 1);
  await p.goto("/checkout");
  await expect(p.getByLabel("Alamat lengkap")).toHaveValue(/Soekarno Hatta/); // alamat terisi dari pesanan sebelumnya
  await p.getByLabel("Kode promo").fill(promo);
  await expect(async () => {
    await p.getByRole("button", { name: "Pakai" }).click();
    await expect(p.getByRole("status").filter({ hasText: "hanya berlaku untuk pembelian pertama" })).toBeVisible({ timeout: 2500 });
  }).toPass();
  await p.goto("/keranjang");
  await clickAction(p, "Hapus");
});

test("dua pembeli berebut 1 unit: hanya satu pesanan yang berhasil", async () => {
  for (const u of [ani, budi]) {
    await addToCart(u.page, rare, 1);
    await u.page.goto("/checkout");
    await fillCheckout(u.page);
  }
  await Promise.all([ani.page.getByRole("button", { name: "Buat Pesanan" }).click(), budi.page.getByRole("button", { name: "Buat Pesanan" }).click()]);

  const outcome = async (p: Page) => {
    await expect(async () => {
      expect(/\/pesanan\//.test(p.url()) || (await formAlert(p).count()) > 0).toBe(true);
    }).toPass({ timeout: 25_000 });
    return /\/pesanan\//.test(p.url()) ? "berhasil" : "gagal";
  };
  const results = await Promise.all([outcome(ani.page), outcome(budi.page)]);
  expect([...results].sort()).toEqual(["berhasil", "gagal"]);

  const [winner, loser] = results[0] === "berhasil" ? [ani, budi] : [budi, ani];
  await expect(formAlert(loser.page)).toContainText("stok");
  rareOrder = orderCode(winner.page);
  expect(await stockOf(rare)).toBe(0);
});

test("admin: tandai dibayar idempoten, dikemas, dikirim (resi wajib), dan lacak publik", async ({ browser }) => {
  const p = admin.page;
  await p.goto("/admin");
  await expect(p.getByRole("heading", { name: "Dashboard", level: 1 })).toBeVisible();

  // Dua tab admin membuka pesanan yang sama; keduanya menekan "Tandai Dibayar".
  await p.goto(`/admin/pesanan/${orderAni}`);
  const second = await admin.context.newPage();
  await second.goto(`/admin/pesanan/${orderAni}`);
  await p.getByRole("button", { name: "Tandai Dibayar" }).click();
  await expect(p.getByText("Dibayar").first()).toBeVisible();
  await second.getByRole("button", { name: "Tandai Dibayar" }).click();
  await expect(second.getByRole("button", { name: "Tandai Dikemas" })).toBeVisible();
  expect(await statusOf(orderAni)).toBe("PAID");
  expect(await eventCount(orderAni, "PAID")).toBe(1);

  await p.goto(`/admin/pesanan/${orderAni}`);
  await p.getByRole("button", { name: "Tandai Dikemas" }).click();
  await expect(p.getByRole("button", { name: "Tandai Dikirim" })).toBeVisible();

  await expect(p.getByLabel("Nomor resi (wajib)")).toBeVisible();
  await p.getByLabel("Nomor resi (wajib)").fill(resi);
  await p.getByRole("button", { name: "Tandai Dikirim" }).click();
  await expect(p.getByText(`Resi: ${resi}`)).toBeVisible();
  expect(await statusOf(orderAni)).toBe("SHIPPED");
  await expect(p.getByRole("button", { name: /Batalkan/ })).toHaveCount(0); // sudah dikirim, tak bisa dibatalkan

  // Pelacakan publik (tanpa login): hanya status, tanpa data pribadi.
  const guest = await browser.newContext({ baseURL: "http://localhost:3100" });
  const g = await guest.newPage();
  await g.goto(`/lacak?kode=${resi.toLowerCase()}`);
  await expect(g.getByText(orderAni)).toBeVisible();
  await expect(g.getByText("Dikirim").first()).toBeVisible();
  await expect(g.locator("body")).not.toContainText("Soekarno");
  await expect(g.locator("body")).not.toContainText("Budi Penerima");
  await g.goto("/lacak?kode=PLY-ZZZZZZ");
  await expect(g.getByText("Pesanan tidak ditemukan")).toBeVisible();
  await guest.close();
});

test("pembeli menandai pesanan diterima", async () => {
  const p = ani.page;
  await p.goto(`/pesanan/${orderAni}`);
  await p.getByRole("button", { name: "Pesanan sudah saya terima" }).click();
  await expect(p.getByText("Terima kasih sudah berbelanja!")).toBeVisible();
  expect(await statusOf(orderAni)).toBe("RECEIVED");
});

test("admin membatalkan pesanan: stok dikembalikan", async () => {
  const p = admin.page;
  await p.goto(`/admin/pesanan/${rareOrder}`);
  await p.getByLabel("Batalkan pesanan").fill("Uji pembatalan");
  await p.getByRole("button", { name: /Batalkan & kembalikan stok/ }).click();
  await expect(p.getByText("Dibatalkan").first()).toBeVisible();
  expect(await statusOf(rareOrder)).toBe("CANCELLED");
  expect(await stockOf(rare)).toBe(1);
});

test("pesanan kedaluwarsa dibatalkan oleh cron dan stok kembali; cron tanpa rahasia ditolak", async ({ request }) => {
  const p = budi.page;
  const before = await stockOf(multi);
  await addToCart(p, multi, 1);
  await p.goto("/checkout");
  await fillCheckout(p);
  await p.getByRole("button", { name: "Buat Pesanan" }).click();
  await expect(p).toHaveURL(/\/pesanan\/PLY-/);
  const code = orderCode(p);
  expect(await stockOf(multi)).toBe(before! - 1);

  await expireNow(code);
  expect((await request.get("/api/cron/expire-orders")).status()).toBe(401);
  expect((await request.get("/api/cron/expire-orders", { headers: { authorization: "Bearer salah" } })).status()).toBe(401);
  const ok = await request.get("/api/cron/expire-orders", { headers: { authorization: "Bearer e2e-secret" } });
  expect(ok.status()).toBe(200);
  expect((await ok.json()).cancelled).toBeGreaterThanOrEqual(1);

  expect(await statusOf(code)).toBe("CANCELLED");
  expect(await stockOf(multi)).toBe(before);
});

test("akses admin: pengunjung diarahkan login, pembeli biasa ditolak", async ({ page }) => {
  await page.goto("/admin/pesanan");
  await expect(page).toHaveURL(/\/masuk\?next=%2Fadmin/);

  await ani.page.goto("/admin");
  await expect(ani.page).toHaveURL("http://localhost:3100/");
  await ani.page.goto("/admin/produk/baru");
  await expect(ani.page).toHaveURL("http://localhost:3100/");
});

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

test("admin menambah produk dengan beberapa foto, slider di toko, menolak file palsu, lalu mengarsipkan", async () => {
  const p = admin.page;
  const name = `E2E Produk Baru ${stamp}`;
  const slug = `e2e-produk-baru-${stamp}`;
  const fillBasic = async () => {
    await p.getByLabel("Nama produk").fill(name);
    await p.getByLabel("Ukuran").fill("One size");
    await p.getByLabel("Harga (Rp)").fill("15000");
    await p.getByLabel("Stok").fill("2");
    await p.getByLabel("Deskripsi").fill("Produk uji otomatis untuk panel admin.");
  };

  // File yang bukan foto ditolak walau diberi nama .png (jenis dicek dari isi file).
  await p.goto("/admin/produk/baru");
  await fillBasic();
  await p.getByLabel("Tambah foto").setInputFiles({ name: "palsu.png", mimeType: "image/png", buffer: Buffer.from("<script>alert(1)</script>") });
  await p.getByRole("button", { name: "Tambah produk" }).click();
  await expect(formAlert(p)).toContainText("bukan foto");

  // Tiga file dipilih, satu dibatalkan, dua disimpan.
  await fillBasic();
  await p.getByLabel("Tambah foto").setInputFiles([
    { name: "a.png", mimeType: "image/png", buffer: PNG },
    { name: "b.png", mimeType: "image/png", buffer: PNG },
    { name: "c.png", mimeType: "image/png", buffer: PNG },
  ]);
  await expect(p.getByAltText("Foto baru c.png")).toBeVisible();
  await p.getByRole("button", { name: "Batalkan c.png" }).click();
  await expect(p.getByAltText("Foto baru c.png")).toHaveCount(0);
  await p.getByRole("button", { name: "Tambah produk" }).click();
  await expect(p.getByText("Produk disimpan.")).toBeVisible();
  await expect(p.getByAltText(/^Foto \d$/)).toHaveCount(2);
  await expect(p.locator("span").filter({ hasText: /^Utama$/ })).toHaveCount(1); // hanya foto pertama berlabel Utama

  // Di toko: slider dengan 2 foto.
  const pubCtx = await p.context().browser()!.newContext({ baseURL: test.info().project.use.baseURL });
  const pub = await pubCtx.newPage();
  await pub.goto(`/produk/${slug}`);
  await expect(pub.getByRole("heading", { name, level: 1 })).toBeVisible();
  const gallery = pub.getByRole("region", { name: `Foto ${name}` });
  await expect(gallery).toBeVisible();
  await expect(gallery.getByText("1 / 2")).toBeVisible();
  await expect(gallery.getByRole("button", { name: "Foto sebelumnya" })).toBeDisabled();
  await gallery.getByRole("button", { name: "Foto berikutnya" }).click();
  await expect(gallery.getByText("2 / 2")).toBeVisible();
  await expect(gallery.getByRole("button", { name: "Foto berikutnya" })).toBeDisabled();
  await gallery.getByRole("button", { name: "Lihat foto 1" }).click();
  await expect(gallery.getByText("1 / 2")).toBeVisible();

  // Foto disajikan dari database dengan cache panjang; id ngawur 404.
  const src = decodeURIComponent((await gallery.locator("img").first().getAttribute("src")) ?? "");
  const id = /\/img\/([a-z0-9]+)/.exec(src)?.[1];
  expect(id).toBeTruthy();
  const res = await pub.request.get(`/img/${id}`);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toBe("image/png");
  expect(res.headers()["cache-control"]).toContain("immutable");
  expect((await pub.request.get("/img/tidakada0000000000000000")).status()).toBe(404);

  await p.goto("/admin/produk");
  const archived = p.waitForResponse((r) => r.request().method() === "POST");
  await p.getByRole("row", { name: new RegExp(name) }).getByRole("button", { name: "Arsipkan" }).click();
  await archived;
  await pub.goto(`/produk/${slug}`);
  await expect(pub.getByRole("heading", { name: "Halaman tidak ditemukan" })).toBeVisible();
  await pubCtx.close();
});

test("formulir kontak masuk ke admin; admin membuat kode promo", async ({ page }) => {
  const mail = testEmail("kontak");
  await page.goto("/kontak");
  await page.getByLabel("Nama", { exact: true }).fill("Penanya Uji");
  await page.getByLabel("Email").fill(mail);
  await page.getByLabel("Pesan").fill("Apakah barang ini masih ada? Pesan uji otomatis.");
  await page.getByRole("button", { name: "Kirim" }).click();
  await expect(page.getByText("Pesan terkirim.")).toBeVisible();

  const p = admin.page;
  await p.goto("/admin/pesan");
  await expect(p.getByText("Pesan uji otomatis.")).toBeVisible();
  await p.getByRole("button", { name: "Tandai selesai" }).first().click();
  await expect(p.getByRole("button", { name: "Tandai belum selesai" }).first()).toBeVisible();

  const code = `E2EP${String(stamp).slice(-5)}`;
  await p.goto("/admin/promo");
  await p.getByLabel("Kode", { exact: true }).fill(code);
  await p.getByLabel("Diskon (%)").fill("15");
  await p.getByRole("button", { name: "Buat kode" }).click();
  await expect(p.getByRole("cell", { name: code })).toBeVisible();
});

test("halaman statis tersedia", async ({ page }) => {
  for (const [path, heading] of [
    ["/tentang", "Tentang kami"],
    ["/faq", "FAQ — Pertanyaan Umum"],
    ["/kontak", "Hubungi kami"],
    ["/syarat", "Syarat & Ketentuan"],
    ["/privasi", "Kebijakan Privasi"],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible();
  }
  expect((await page.request.get("/robots.txt")).status()).toBe(200);
  const sitemap = await page.request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain("/produk/handmade-vase");
});
