export type ImageType = "image/jpeg" | "image/png" | "image/webp";

export const IMAGE_EXT: Record<ImageType, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/**
 * Mengenali jenis gambar dari isi file (magic bytes), bukan dari nama atau tipe yang diklaim browser.
 * Hanya JPEG/PNG/WebP yang diterima: SVG sengaja ditolak karena bisa memuat skrip.
 */
export function sniffImage(bytes: Uint8Array): ImageType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b)) return "image/png";
  if (bytes.length >= 12) {
    const tag = (from: number) => String.fromCharCode(...bytes.slice(from, from + 4));
    if (tag(0) === "RIFF" && tag(8) === "WEBP") return "image/webp";
  }
  return null;
}
