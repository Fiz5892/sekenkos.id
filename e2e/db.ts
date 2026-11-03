import "dotenv/config";
import { randomBytes } from "node:crypto";
import { Client } from "pg";

// Akses database langsung untuk tes: menyiapkan data, membaca hasil, dan membersihkan akun/produk uji.
async function withClient<T>(fn: (c: Client) => Promise<T>): Promise<T> {
  const ca = process.env.DATABASE_CA?.replace(/\\n/g, "\n");
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: ca ? { ca } : undefined });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export const TEST_EMAIL_DOMAIN = "@example.test";
const id = () => `e2e${randomBytes(10).toString("hex")}`;

export function resetTokenFor(email: string) {
  return withClient(async (c) => {
    const r = await c.query(
      `select v.identifier from verifications v
       where v.identifier like 'reset-password:%' and v.value = (select id from users where email = $1)
       order by v."createdAt" desc limit 1`,
      [email],
    );
    return r.rows[0]?.identifier?.replace("reset-password:", "") as string | undefined;
  });
}

export function roleOf(email: string) {
  return withClient(async (c) => (await c.query("select role from users where email = $1", [email])).rows[0]?.role as string | undefined);
}

export function makeAdmin(email: string) {
  return withClient((c) => c.query("update users set role = 'ADMIN' where email = $1", [email]));
}

export function createTestProduct(slug: string, stock: number, price: number) {
  return withClient(async (c) => {
    const cat = (await c.query("select id from categories where slug = 'kebersihan'")).rows[0].id;
    await c.query(
      `insert into products (id, slug, name, "categoryId", price, condition, size, description, stock, images, "isPhoto", popularity, status, "updatedAt")
       values ($1, $2, $3, $4, $5, 'BEKAS_BAIK', 'One size', 'Produk uji otomatis, aman dihapus.', $6, array['/assets/bucket.png'], false, 0, 'ACTIVE', now())`,
      [id(), slug, `Uji ${slug}`, cat, price, stock],
    );
  });
}

export function createTestPromo(code: string, percent: number, opts: { quota?: number; firstPurchaseOnly?: boolean } = {}) {
  return withClient((c) =>
    c.query(`insert into promos (id, code, percent, quota, "firstPurchaseOnly", active) values ($1, $2, $3, $4, $5, true)`, [
      id(),
      code,
      percent,
      opts.quota ?? null,
      opts.firstPurchaseOnly ?? false,
    ]),
  );
}

export const stockOf = (slug: string) => withClient(async (c) => (await c.query("select stock from products where slug = $1", [slug])).rows[0]?.stock as number | undefined);
export const statusOf = (code: string) => withClient(async (c) => (await c.query("select status from orders where code = $1", [code])).rows[0]?.status as string | undefined);
export const promoUsed = (code: string) => withClient(async (c) => (await c.query('select "usedCount" from promos where code = $1', [code])).rows[0]?.usedCount as number | undefined);
export const eventCount = (code: string, status: string) =>
  withClient(async (c) => Number((await c.query(`select count(*) n from order_events e join orders o on o.id = e."orderId" where o.code = $1 and e.status = $2`, [code, status])).rows[0].n));
export const expireNow = (code: string) => withClient((c) => c.query(`update orders set "expiresAt" = now() - interval '1 hour' where code = $1`, [code]));

/** Menghapus semua data uji dengan urutan yang menghormati relasi (pesanan dulu, baru akun dan produk). */
export function cleanupTestData() {
  return withClient(async (c) => {
    const like = `e2e-%${TEST_EMAIL_DOMAIN}`;
    await c.query("delete from orders where \"userId\" in (select id from users where email like $1)", [like]);
    await c.query("delete from users where email like $1", [like]);
    await c.query("delete from products where slug like 'e2e-%'");
    await c.query("delete from promos where code like 'E2E%'");
    await c.query("delete from product_images pi where not exists (select 1 from products p where '/img/' || pi.id = any(p.images))");
    await c.query("delete from messages where email like $1", [like]);
  });
}

export const deleteTestUsers = cleanupTestData;

export const setProductImages = (slug: string, images: string[]) =>
  withClient((c) => c.query("update products set images = $2 where slug = $1", [slug, images]));
