import { db } from "@/lib/db";

// Menyajikan foto produk yang disimpan di database. Isi tiap foto tidak pernah berubah (id baru untuk
// foto baru), jadi boleh di-cache lama oleh browser dan CDN.
export async function GET(_request: Request, ctx: RouteContext<"/img/[id]">) {
  const { id } = await ctx.params;
  if (!/^[a-z0-9]{20,40}$/.test(id)) return new Response("Not found", { status: 404 });

  const image = await db.productImage.findUnique({ where: { id }, select: { data: true, contentType: true } });
  if (!image) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
