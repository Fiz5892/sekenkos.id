// QRIS statis → dinamis (standar EMVCo / QRIS). Murni, tanpa dependensi; aman dipakai di server maupun klien.
// Payload berupa daftar TLV: 2 digit tag, 2 digit panjang, lalu nilai.

type Tlv = { tag: string; value: string };

function parse(payload: string): Tlv[] {
  const out: Tlv[] = [];
  let i = 0;
  while (i < payload.length) {
    const tag = payload.slice(i, i + 2);
    const len = Number(payload.slice(i + 2, i + 4));
    if (!/^\d{2}$/.test(tag) || !Number.isInteger(len) || i + 4 + len > payload.length) throw new Error("Payload QRIS tidak valid.");
    out.push({ tag, value: payload.slice(i + 4, i + 4 + len) });
    i += 4 + len;
  }
  return out;
}

const encode = (t: Tlv) => `${t.tag}${String(t.value.length).padStart(2, "0")}${t.value}`;

/** CRC16-CCITT (poly 0x1021, init 0xFFFF) atas teks, 4 digit hex kapital. */
export function crc16(text: string): string {
  let crc = 0xffff;
  for (let i = 0; i < text.length; i++) {
    crc ^= text.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** true bila CRC di ujung payload cocok dengan isinya. */
export function validQris(payload: string): boolean {
  return /6304[0-9A-F]{4}$/.test(payload) && crc16(payload.slice(0, -4)) === payload.slice(-4);
}

/**
 * Mengubah QRIS statis menjadi dinamis dengan nominal tetap: tag 01 menjadi "12", tag 54 (nominal) disisipkan
 * setelah mata uang (tag 53), lalu CRC dihitung ulang. Aplikasi pembayar menampilkan nominal terkunci.
 */
export function dynamicQris(staticPayload: string, amount: number): string {
  if (!Number.isInteger(amount) || amount <= 0) throw new Error("Nominal QRIS harus bilangan bulat positif.");
  const fields = parse(staticPayload.trim()).filter((t) => t.tag !== "63" && t.tag !== "54");
  if (!fields.some((t) => t.tag === "53")) throw new Error("Payload QRIS tidak punya kode mata uang.");

  const out: Tlv[] = [];
  for (const f of fields) {
    out.push(f.tag === "01" ? { tag: "01", value: "12" } : f);
    if (f.tag === "53") out.push({ tag: "54", value: String(amount) });
  }
  const body = `${out.map(encode).join("")}6304`;
  return body + crc16(body);
}
