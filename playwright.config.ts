import { defineConfig } from "@playwright/test";

const port = 3100;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  // Database ada di Supabase (jauh dari mesin pengembang), jadi aksi server butuh beberapa perjalanan jaringan.
  expect: { timeout: 15_000 },
  use: { baseURL: `http://localhost:${port}`, locale: "id-ID" },
  // Menjalankan build produksi; butuh DATABASE_URL yang sudah berisi data seed.
  webServer: {
    command: `npm run build && npm run start -- -p ${port}`,
    env: {
      AUTH_RATE_LIMIT_MAX: "100",
      BETTER_AUTH_URL: `http://localhost:${port}`,
      CRON_SECRET: "e2e-secret",
      PAYMENT_BANK: "BCA 111 222 333 a.n. Uji Otomatis",
      // Tarif ongkir perkiraan yang deterministik (tanpa Biteship/markup) dan gateway tanpa kunci API,
      // tetapi dengan token webhook agar endpoint webhook bisa diuji.
      BITESHIP_API_KEY: "",
      SHIPPING_ORIGIN_ZIP: "65141",
      SHIPPING_MARKUP_PERCENT: "0",
      SHIPPING_PACKING_FEE: "0",
      SHIPPING_PACKING_GRAMS: "200",
      SHIPPING_ROUND_TO: "500",
      MIDTRANS_SERVER_KEY: "SB-Mid-server-e2e",
      MIDTRANS_ENABLED: "false",
    },
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
