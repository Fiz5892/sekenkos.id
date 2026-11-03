import { expect, test, type Page } from "@playwright/test";

// Menunggu Server Action selesai (POST) agar navigasi berikutnya tidak memotongnya.
async function clickAction(page: Page, name: string) {
  const done = page.waitForResponse((r) => r.request().method() === "POST");
  await page.getByRole("button", { name }).click();
  await done;
}

test("pengunjung menelusuri katalog dan mengelola keranjang", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Barang bekas layak pakai/, level: 1 })).toBeVisible();

  // Filter kategori dari beranda
  await page.getByRole("link", { name: /Kebersihan/ }).first().click();
  await expect(page).toHaveURL(/kategori=kebersihan/);
  await expect(page.getByRole("heading", { name: "Kebersihan", level: 1 })).toBeVisible();

  // Filter kondisi lewat form
  await page.getByLabel("Baru", { exact: true }).check();
  await page.getByRole("button", { name: "Terapkan" }).click();
  await expect(page).toHaveURL(/kondisi=baru/);
  await expect(page.getByRole("status")).toHaveText("2 barang");

  // Detail produk lalu tambah ke keranjang
  await page.getByRole("link", { name: "Hand Soap" }).first().click();
  await expect(page.getByRole("heading", { name: "Hand Soap", level: 1 })).toBeVisible();
  await page.getByLabel("Jumlah", { exact: true }).fill("2");
  await clickAction(page, "Tambah ke Keranjang");
  await expect(page.getByRole("link", { name: "Keranjang belanja, 2 barang" })).toBeVisible();

  // Keranjang: jumlah, ubah, hapus
  await page.goto("/keranjang");
  await expect(page.getByText("Subtotal (2 barang)")).toBeVisible();
  await clickAction(page, "Tambah");
  await expect(page.getByText("Subtotal (3 barang)")).toBeVisible();
  await clickAction(page, "Kurangi");
  await expect(page.getByText("Subtotal (2 barang)")).toBeVisible();
  await clickAction(page, "Hapus");
  await expect(page.getByText("Keranjangmu masih kosong.")).toBeVisible();
});

test("stok 1 tidak bisa ditambah melebihi stok", async ({ page }) => {
  await page.goto("/produk/handmade-vase");
  await clickAction(page, "Tambah ke Keranjang");
  await clickAction(page, "Tambah ke Keranjang");
  await page.goto("/keranjang");
  await expect(page.getByText("Subtotal (1 barang)")).toBeVisible();
  await expect(page.getByRole("button", { name: "Tambah" })).toBeDisabled();
});

test("Beli Sekarang membawa ke keranjang", async ({ page }) => {
  await page.goto("/produk/gayung");
  await page.getByRole("button", { name: "Beli Sekarang" }).click();
  await expect(page).toHaveURL(/\/keranjang$/);
  await expect(page.getByRole("heading", { name: "Gayung" })).toBeVisible();
});

test("produk yang tidak ada menampilkan halaman tidak ditemukan", async ({ page }) => {
  await page.goto("/produk/tidak-ada-barang-ini");
  await expect(page.getByRole("heading", { name: "Halaman tidak ditemukan" })).toBeVisible();
});
