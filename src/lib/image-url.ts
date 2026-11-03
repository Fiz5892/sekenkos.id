/**
 * Sumber gambar yang boleh dipakai produk: aset lokal (/assets/...), foto unggahan yang disajikan dari
 * database (/img/<id>), atau file di Supabase Storage milik proyek ini. URL lain ditolak karena next/image akan error untuk host yang tidak terdaftar,
 * dan error itu akan merusak halaman katalog.
 */
export function supabaseHost(): string | undefined {
  const url = process.env.SUPABASE_URL;
  if (!url) return undefined;
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

export function isAllowedImage(value: string, host = supabaseHost()): boolean {
  if (/^\/assets\/[\w./-]+$/.test(value) && !value.includes("..")) return true;
  if (/^\/img\/[a-z0-9]{20,40}$/.test(value)) return true;
  try {
    const u = new URL(value);
    return u.protocol === "https:" && host !== undefined && u.hostname === host && u.pathname.startsWith("/storage/v1/object/public/");
  } catch {
    return false;
  }
}
