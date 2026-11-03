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
    },
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
