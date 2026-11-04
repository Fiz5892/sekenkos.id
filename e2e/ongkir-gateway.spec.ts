import { createHash } from "node:crypto";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { cleanupTestData, createTestProduct, eventCount, makeGatewayOrder, noteCount, statusOf, stockOf, totalOf } from "./db";
import { addToCart, fillCheckout, formAlert, newUser, pickPlace, stamp, testEmail } from "./helpers";

test.describe.configure({ mode: "serial" });
test.setTimeout(120_000);

const item = `e2e-ongkir-${stamp}`; // stok 5, Rp20.000, berat bawaan 500 g
const SERVER_KEY = "SB-Mid-server-e2e";

type U = Awaited<ReturnType<typeof newUser>>;
let user: U;

test.beforeAll(async ({ browser }) => {
  await cleanupTestData();
  await createTestProduct(item, 5, 20000);
  user = await newUser(browser, "Dewi Pembeli", testEmail("dewi"));
});

test.afterAll(async () => {
  await user?.context.close();
  await cleanupTestData();
});

const orderCode = (page: Page) => page.url().split("/").pop()!;

async function placeOrder(page: Page) {
  await addToCart(page, item, 1);
  await page.goto("/checkout");
  await fillCheckout(page);
  await page.getByRole("button", { name: "Buat Pesanan" }).click();
  await expect(page).toHaveURL(/\/pesanan\/PLY-[A-Z0-9]{6}$/);
  return orderCode(page);
}

test("ongkir dihitung dari kode pos tujuan dan berat paket", async () => {
  const p = user.page;
  await addToCart(p, item, 1);
  await p.goto("/checkout");
  await expect(p.getByText("Pilih alamat sampai desa / kelurahan untuk melihat ongkir")).toBeVisible();

  // Berat 500 g + kemasan 200 g = 0,7 kg → dibulatkan 1 kg. Asal Kota Malang; zona dari wilayah sebenarnya.
  await pickPlace(p, "Jawa Timur", "Kota Malang"); // satu kota
  await expect(p.getByRole("radio", { name: /Reguler.*Rp9\.000/ })).toBeVisible();
  await pickPlace(p, "Daerah Khusus Ibukota Jakarta", "Kota Administrasi Jakarta Pusat"); // beda provinsi tapi satu pulau
  await expect(p.getByRole("radio", { name: /Reguler.*Rp15\.000/ })).toBeVisible();
  await pickPlace(p, "Sulawesi Selatan", "Kota Makassar"); // beda pulau
  await expect(p.getByRole("radio", { name: /Reguler.*Rp32\.000/ })).toBeVisible();

  await expect(p.getByText(/Tarif berupa perkiraan/)).toBeVisible();

  // Mengganti provinsi mengosongkan pilihan di bawahnya dan menyembunyikan ongkir lagi.
  await p.getByLabel("Provinsi").selectOption({ label: "Jawa Timur" });
  await expect(p.getByLabel("Desa / Kelurahan")).toBeDisabled();
  await expect(p.getByText("Pilih alamat sampai desa / kelurahan untuk melihat ongkir")).toBeVisible();
  await pickPlace(p, "Jawa Timur", "Kota Malang");

  // Ambil di tempat selalu gratis dan masuk ke total.
  await p.getByRole("radio", { name: /Ambil di tempat/ }).check();
  await expect(p.locator("dl").getByText("Gratis")).toBeVisible();
});

test("ongkir yang dipalsukan dari form ditolak dan tidak ada pesanan terbuat", async () => {
  const p = user.page;
  await addToCart(p, item, 1); // keranjang akun menyimpan jumlah dari tes sebelumnya, jadi tarifnya tidak ditebak di sini
  await p.goto("/checkout");
  await fillCheckout(p);
  const before = await stockOf(item);

  await p.evaluate(() => {
    (document.querySelector("input[name=shippingCost]") as HTMLInputElement).value = "1000";
  });
  await p.getByRole("button", { name: "Buat Pesanan" }).click();
  await expect(formAlert(p)).toContainText(/Tarif ongkir berubah menjadi Rp[\d.]+\./);
  await expect(p).toHaveURL(/\/checkout/);
  expect(await stockOf(item)).toBe(before);
});

test("kode desa yang dipalsukan ditolak: nama wilayah tidak pernah dipercaya dari klien", async () => {
  const p = user.page;
  await p.goto("/checkout"); // keranjang akun masih berisi barang dari tes sebelumnya; menambah lagi menghabiskan stok uji
  await fillCheckout(p);
  const before = await stockOf(item);

  await p.evaluate(() => {
    const select = document.querySelector("select[name=villageCode]") as HTMLSelectElement;
    select.add(new Option("Desa Palsu", "99.99.99.9999", true, true));
  });
  await p.getByRole("button", { name: "Buat Pesanan" }).click();
  await expect(formAlert(p)).toContainText("Alamat tidak valid");
  await expect(p).toHaveURL(/\/checkout/);
  expect(await stockOf(item)).toBe(before);
});

test("pesanan manual: bukan bayar online, jadi webhook tidak bisa melunasinya", async ({ request }) => {
  const p = user.page;
  const code = await placeOrder(p);
  // Alamat tampil terstruktur: desa, kecamatan, kota, provinsi, kode pos.
  await expect(p.getByText(/Kec\. .+, Kota Malang, Jawa Timur \d{5}/)).toBeVisible();
  const res = await hook(request, { order_id: code, transaction_status: "settlement", gross_amount: `${await totalOf(code)}.00` });
  expect((await res.json()).result).toBe("unknown-order");
  expect(await statusOf(code)).toBe("PENDING_PAYMENT");
});

test("webhook: token wajib, nominal dicocokkan, lunas idempoten, dan invoice kedaluwarsa membatalkan", async ({ request }) => {
  const p = user.page;
  const stockStart = await stockOf(item);
  const paid = await placeOrder(p);
  const expired = await placeOrder(p);
  await makeGatewayOrder(paid, `inv-paid-${stamp}`);
  await makeGatewayOrder(expired, `inv-exp-${stamp}`);
  const total = await totalOf(paid);
  const payload = { order_id: paid, transaction_status: "settlement", gross_amount: `${total}.00`, payment_type: "bank_transfer", va_numbers: [{ bank: "bca" }] };

  // Tanpa signature / signature salah
  expect((await request.post("/api/webhooks/midtrans", { data: payload })).status()).toBe(401);
  expect((await hook(request, payload, "kunci-salah")).status()).toBe(401);
  expect(await statusOf(paid)).toBe("PENDING_PAYMENT");

  // Nominal tidak sama: tidak dilunasi, dicatat untuk dicek admin
  const wrong = await hook(request, { ...payload, gross_amount: `${total - 1000}.00` });
  expect((await wrong.json()).result).toBe("amount-mismatch");
  expect(await statusOf(paid)).toBe("PENDING_PAYMENT");
  expect(await noteCount(paid, "PERIKSA%")).toBe(1);

  // Nominal benar: lunas; kiriman ulang (notifikasi settlement dua kali) tidak menggandakan apa pun
  expect((await (await hook(request, payload)).json()).result).toBe("paid");
  expect(await statusOf(paid)).toBe("PAID");
  expect((await (await hook(request, payload)).json()).result).toBe("ignored");
  expect(await eventCount(paid, "PAID")).toBe(1);

  // Pembeli melihat statusnya langsung berubah
  await p.goto(`/pesanan/${paid}`);
  await expect(p.getByText("Dibayar lewat BCA")).toBeVisible();

  // Invoice kedaluwarsa membatalkan pesanan dan mengembalikan stok
  const exp = { order_id: expired, transaction_status: "expire", gross_amount: `${await totalOf(expired)}.00` };
  expect((await (await hook(request, exp)).json()).result).toBe("cancelled");
  expect(await statusOf(expired)).toBe("CANCELLED");
  expect((await (await hook(request, exp)).json()).result).toBe("ignored");
  // Dua pesanan dibuat; hanya yang kedaluwarsa stoknya dikembalikan.
  expect(await stockOf(item)).toBe(stockStart! - 1);

  // Pesanan yang sudah dibatalkan lalu dibayar: tidak diaktifkan lagi, ditandai untuk refund manual
  expect((await (await hook(request, { ...exp, transaction_status: "settlement" })).json()).result).toBe("late-payment");
  expect(await statusOf(expired)).toBe("CANCELLED");
  expect(await noteCount(expired, "PERHATIAN%")).toBe(1);
});

// Notifikasi Midtrans bertanda tangan: SHA512(order_id + status_code + gross_amount + ServerKey).
function hook(request: APIRequestContext, data: Record<string, unknown>, key = SERVER_KEY) {
  const body: Record<string, unknown> = { status_code: "200", ...data };
  const signature_key = createHash("sha512").update(`${body.order_id}${body.status_code}${body.gross_amount}${key}`).digest("hex");
  return request.post("/api/webhooks/midtrans", { data: { ...body, signature_key } });
}
