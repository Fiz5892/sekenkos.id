import { describe, expect, it } from "vitest";
import { sniffImage } from "./image-sniff";

const bytes = (...n: number[]) => new Uint8Array(n);

describe("sniffImage", () => {
  it("mengenali JPEG, PNG, dan WebP dari isinya", () => {
    expect(sniffImage(bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0x10))).toBe("image/jpeg");
    expect(sniffImage(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0))).toBe("image/png");
    const webp = new Uint8Array([...new TextEncoder().encode("RIFF"), 1, 0, 0, 0, ...new TextEncoder().encode("WEBP")]);
    expect(sniffImage(webp)).toBe("image/webp");
  });

  it("menolak SVG, HTML, teks, dan file kosong walau diberi nama .png", () => {
    expect(sniffImage(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBeNull();
    expect(sniffImage(new TextEncoder().encode("<html><script>alert(1)</script></html>"))).toBeNull();
    expect(sniffImage(new TextEncoder().encode("bukan gambar"))).toBeNull();
    expect(sniffImage(new Uint8Array())).toBeNull();
  });

  it("RIFF yang bukan WebP (mis. WAV) ditolak", () => {
    const wav = new Uint8Array([...new TextEncoder().encode("RIFF"), 1, 0, 0, 0, ...new TextEncoder().encode("WAVE")]);
    expect(sniffImage(wav)).toBeNull();
  });
});
