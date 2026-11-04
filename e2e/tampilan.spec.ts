import { expect, test } from "@playwright/test";
import { cleanupTestData, createTestProduct, makeAdmin } from "./db";
import { addToCart, cartLink, login, logout, newUser, register, stamp, testEmail } from "./helpers";

test.describe.configure({ mode: "serial" });
test.setTimeout(120_000);

const barang = `e2e-keranjang-${stamp}`;

test.beforeAll(async () => {
  await cleanupTestData();
  await createTestProduct(barang, 5, 20000);
});

test.afterAll(async () => {
  await cleanupTestData();
});

test("keranjang pengunjung digabung ke akun saat login, ikut ke perangkat lain, dan tidak bocor ke akun lain", async ({ browser }) => {
  const ctx = await browser.newContext({ baseURL: "http://localhost:3100" });
  const page = await ctx.newPage();
  const first = testEmail("dewi");

  // Pengunjung: keranjang di cookie.
  await addToCart(page, barang, 2);
  await expect(cartLink(page, 2)).toBeVisible();
  expect((await ctx.cookies()).some((c) => c.name === "ply_cart")).toBe(true);

  // Daftar: isi cookie pindah ke akun, cookie dikosongkan.
  await register(page, "Dewi Satu", first);
  await expect(cartLink(page, 2)).toBeVisible();
  expect((await ctx.cookies()).some((c) => c.name === "ply_cart")).toBe(false);

  // Keluar: browser kembali bersih, keranjang akun tidak tertinggal.
  await logout(page);
  await expect(cartLink(page)).toBeVisible();
  await page.goto("/keranjang");
  await expect(page.getByText("Keranjangmu masih kosong.")).toBeVisible();

  // Akun lain di browser yang sama tidak melihat keranjang akun pertama.
  await register(page, "Eko Dua", testEmail("eko"));
  await expect(cartLink(page)).toBeVisible();
  await logout(page);

  // Login ulang: keranjang kembali.
  await login(page, first);
  await expect(cartLink(page, 2)).toBeVisible();

  // Perangkat lain (konteks lain) dengan akun yang sama melihat keranjang yang sama.
  const other = await browser.newContext({ baseURL: "http://localhost:3100" });
  const p2 = await other.newPage();
  await login(p2, first);
  await expect(cartLink(p2, 2)).toBeVisible();
  await other.close();
  await ctx.close();
});

test("pengunjung yang login dengan keranjang berisi barang yang sama menjumlahkannya, dibatasi stok", async ({ browser }) => {
  const ctx = await browser.newContext({ baseURL: "http://localhost:3100" });
  const page = await ctx.newPage();
  const email = testEmail("fajar");

  await register(page, "Fajar Tiga", email);
  await addToCart(page, barang, 4);
  await logout(page);

  await addToCart(page, barang, 3); // sebagai pengunjung
  await login(page, email); // 4 (akun) + 3 (cookie) = 7, stok hanya 5
  await expect(cartLink(page, 5)).toBeVisible();
  await ctx.close();
});

test("navbar ringkas dengan ikon, dan menu akun menutup dengan Escape", async ({ browser }) => {
  const ctx = await browser.newContext({ baseURL: "http://localhost:3100" });
  const page = await ctx.newPage();

  await page.goto("/");
  await expect(page.getByRole("search")).toBeVisible();
  await expect(cartLink(page)).toBeVisible();
  await expect(page.getByText("Shopping bag")).toHaveCount(0);
  const nav = page.getByRole("navigation", { name: "Navigasi utama" });
  await expect(nav.getByRole("link", { name: "Tentang kami" })).toHaveCount(0); // pindah ke footer
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "Tentang kami" })).toBeVisible();

  await register(page, "Gita Empat", testEmail("gita"));
  const menu = page.getByRole("menu");
  await page.getByRole("button", { name: /Menu akun Gita/ }).click();
  await expect(menu.getByRole("menuitem", { name: "Riwayat Pembelian" })).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Dashboard Admin" })).toHaveCount(0); // bukan admin
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);

  await page.getByRole("button", { name: /Menu akun Gita/ }).click();
  await page.getByRole("menuitem", { name: "Akun Saya" }).click();
  await expect(page).toHaveURL(/\/akun$/);
  await expect(menu).toHaveCount(0); // menutup setelah memilih
  await ctx.close();
});

test("admin punya kerangka sendiri: sidebar, tanpa navbar dan footer toko", async ({ browser }) => {
  const admin = await newUser(browser, "Hana Admin", testEmail("hana"));
  await makeAdmin(testEmail("hana"));
  const p = admin.page;

  // Admin tidak memakai tampilan toko: membuka toko langsung diarahkan ke dashboard.
  await p.goto("/");
  await expect(p).toHaveURL(/\/admin$/);

  await expect(p.getByRole("heading", { name: "Dashboard", level: 1 })).toBeVisible();
  await expect(p.getByRole("search")).toHaveCount(0); // tidak ada pencarian toko
  await expect(p.getByRole("contentinfo")).toHaveCount(0); // tidak ada footer toko
  const side = p.getByRole("navigation", { name: "Menu admin" });
  for (const label of ["Dashboard", "Pesanan", "Produk", "Kategori", "Pesan masuk"]) {
    await expect(side.getByRole("link", { name: label })).toBeVisible();
  }
  await expect(side.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
  await expect(p.getByText("Pendapatan 30 hari")).toBeVisible();
  await expect(p.getByRole("heading", { name: "Pendapatan 7 hari terakhir" })).toBeVisible();

  await side.getByRole("link", { name: "Produk" }).click();
  await expect(p.getByRole("heading", { name: "Produk", level: 1 })).toBeVisible();
  await expect(side.getByRole("link", { name: "Produk" })).toHaveAttribute("aria-current", "page");
  await expect(p.getByText("13 foto").or(p.getByText("1 foto")).first()).toBeVisible();
  await admin.context.close();
});
