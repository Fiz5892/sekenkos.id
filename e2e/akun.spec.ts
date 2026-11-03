import { expect, test, type Page } from "@playwright/test";
import { accountButton, logout } from "./helpers";
import { TEST_EMAIL_DOMAIN, cleanupTestData, resetTokenFor, roleOf } from "./db";

test.describe.configure({ mode: "serial" });

const stamp = Date.now();
const email = `e2e-${stamp}${TEST_EMAIL_DOMAIN}`;
const password = "sandi-uji-123";
const newPassword = "sandi-baru-456";

test.afterAll(async () => {
  await cleanupTestData();
});

// Next memasang elemen role=alert untuk pengumuman rute; yang dimaksud tes adalah pesan di dalam form.
const formAlert = (page: Page) => page.locator("p[role=alert]");

async function login(page: Page, mail: string, pass: string) {
  await page.goto("/masuk");
  await page.getByLabel("Email").fill(mail);
  await page.getByLabel("Password").fill(pass);
  await page.getByRole("button", { name: "Login" }).click();
}

test("daftar membuat akun dan langsung masuk", async ({ page }) => {
  await page.goto("/daftar");
  await page.getByLabel("Nama lengkap").fill("Budi Penguji");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Ulangi password").fill(password);
  await page.getByRole("button", { name: "Daftar" }).click();
  await expect(accountButton(page, "Budi")).toBeVisible();
  expect(await roleOf(email)).toBe("BUYER");
});

test("validasi form daftar", async ({ page }) => {
  await page.goto("/daftar");
  await page.getByLabel("Nama lengkap").fill("X");
  await page.getByLabel("Email").fill("bukan-email");
  await page.getByLabel("Password", { exact: true }).fill("abc");
  await page.getByLabel("Ulangi password").fill("abc");
  await page.getByRole("button", { name: "Daftar" }).click();
  await expect(formAlert(page)).toHaveText("Format email tidak valid.");
});

test("login salah ditolak, login benar berhasil, lalu keluar", async ({ page }) => {
  await login(page, email, "salah-sekali");
  await expect(formAlert(page)).toHaveText("Email atau password salah.");

  await login(page, email, password);
  await expect(accountButton(page, "Budi")).toBeVisible();

  await logout(page);
});

test("parameter next tidak bisa dipakai untuk open redirect", async ({ page }) => {
  await login(page, email, password);
  await expect(accountButton(page, "Budi")).toBeVisible();
  await page.goto("/masuk?next=//evil.example");
  await expect(page).toHaveURL("http://localhost:3100/");
});

test("peran admin tidak bisa dipilih lewat pendaftaran", async ({ request }) => {
  const mail = `e2e-admin-${stamp}${TEST_EMAIL_DOMAIN}`;
  await request.post("/api/auth/sign-up/email", {
    data: { name: "Calon Admin", email: mail, password, role: "ADMIN" },
    headers: { origin: "http://localhost:3100" },
  });
  expect(await roleOf(mail)).not.toBe("ADMIN");
});

test("lupa password: minta tautan, buat password baru, login dengan password baru", async ({ page }) => {
  await page.goto("/lupa-password");
  await page.getByLabel("Email terdaftar").fill(email);
  await page.getByRole("button", { name: "Kirim tautan reset" }).click();
  await expect(page.getByRole("status")).toContainText("Jika email itu terdaftar");

  // Email asli tidak terkirim di tes; tokennya diambil dari database.
  let token: string | undefined;
  await expect.poll(async () => (token = await resetTokenFor(email)), { timeout: 10_000 }).toBeTruthy();

  await page.goto(`/reset-password?token=${token}`);
  await page.getByLabel("Password baru", { exact: true }).fill(newPassword);
  await page.getByLabel("Ulangi password baru").fill(newPassword);
  await page.getByRole("button", { name: "Simpan password baru" }).click();
  await expect(page).toHaveURL(/\/masuk\?reset=1/);
  await expect(page.getByRole("status")).toContainText("Password berhasil diubah");

  await login(page, email, password);
  await expect(formAlert(page)).toHaveText("Email atau password salah.");
  await login(page, email, newPassword);
  await expect(accountButton(page, "Budi")).toBeVisible();

  // Tautan hanya sekali pakai.
  await page.goto(`/reset-password?token=${token}`);
  await page.getByLabel("Password baru", { exact: true }).fill("lagi-lagi-789");
  await page.getByLabel("Ulangi password baru").fill("lagi-lagi-789");
  await page.getByRole("button", { name: "Simpan password baru" }).click();
  await expect(formAlert(page)).toContainText("tidak valid");
});

test("tautan reset tanpa token menampilkan pesan", async ({ page }) => {
  await page.goto("/reset-password");
  await expect(formAlert(page)).toContainText("tidak valid atau sudah kedaluwarsa");
});
