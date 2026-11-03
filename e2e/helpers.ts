import { expect, type Browser, type Page } from "@playwright/test";
import { TEST_EMAIL_DOMAIN } from "./db";

export const PASSWORD = "sandi-uji-123";
export const stamp = Date.now();
export const testEmail = (tag: string) => `e2e-${tag}-${stamp}${TEST_EMAIL_DOMAIN}`;

export async function register(page: Page, name: string, email: string) {
  await page.goto("/daftar");
  await page.getByLabel("Nama lengkap").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Ulangi password").fill(PASSWORD);
  await page.getByRole("button", { name: "Daftar" }).click();
  await expect(accountButton(page, name.split(" ")[0])).toBeVisible();
}

/** Tombol ikon akun di navbar (hanya ada saat sudah login). */
export const accountButton = (page: Page, firstName: string) => page.getByRole("button", { name: new RegExp(`Menu akun ${firstName}`) });

export async function logout(page: Page) {
  await page.getByRole("button", { name: /Menu akun/ }).click();
  await page.getByRole("button", { name: "Keluar" }).click();
  await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
}

export async function login(page: Page, email: string, password = PASSWORD) {
  await page.goto("/masuk");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Login" }).click();
}

export const cartLink = (page: Page, count?: number) => page.getByRole("link", { name: count ? `Keranjang belanja, ${count} barang` : "Keranjang belanja", exact: true });

/** Konteks browser baru (cookie terpisah) berisi pengguna yang sudah terdaftar dan masuk. */
export async function newUser(browser: Browser, name: string, email: string) {
  const context = await browser.newContext({ baseURL: "http://localhost:3100" });
  const page = await context.newPage();
  await register(page, name, email);
  return { context, page };
}

/** Menunggu Server Action selesai (POST) agar navigasi berikutnya tidak memotongnya. */
export async function clickAction(page: Page, name: string | RegExp) {
  const done = page.waitForResponse((r) => r.request().method() === "POST");
  await page.getByRole("button", { name }).click();
  await done;
}

export async function addToCart(page: Page, slug: string, qty = 1) {
  await page.goto(`/produk/${slug}`);
  if (qty !== 1) await page.getByLabel("Jumlah", { exact: true }).fill(String(qty));
  await clickAction(page, "Tambah ke Keranjang");
}

export async function fillCheckout(page: Page, courier: RegExp = /SiCepat/) {
  await page.getByLabel("Nama penerima").fill("Budi Penerima");
  await page.getByLabel("Nomor HP / WhatsApp").fill("081234567890");
  await page.getByLabel("Alamat lengkap").fill("Jl. Soekarno Hatta No. 9, RT 1 RW 2");
  await page.getByLabel("Kota / Kabupaten").fill("Malang");
  await page.getByLabel("Kode pos").fill("65141");
  await page.getByLabel("Jasa pengiriman").selectOption({ label: (await page.getByLabel("Jasa pengiriman").locator("option").allTextContents()).find((t) => courier.test(t))! });
}

// Next memasang elemen role=alert untuk pengumuman rute; yang dimaksud tes adalah pesan di dalam halaman.
export const formAlert = (page: Page) => page.locator("p[role=alert]");
