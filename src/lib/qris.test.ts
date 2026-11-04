import { describe, expect, it } from "vitest";
import { crc16, dynamicQris, validQris } from "./qris";

// QRIS statis contoh (merchant uji), CRC asli 6B5E.
const STATIC =
  "00020101021126570011ID.DANA.WWW011893600915319033238802091903323880303UMI51440014ID.CO.QRIS.WWW0215ID10254432647890303UMI5204899953033605802ID5918HAFIZ KHOIRU ZAMAN6015KABUPATEN TULUN61056627263046B5E";

describe("qris", () => {
  it("CRC16 cocok dengan QRIS statis asli", () => {
    expect(validQris(STATIC)).toBe(true);
    expect(crc16(STATIC.slice(0, -4))).toBe("6B5E");
  });

  it("dynamicQris: tag 01 jadi 12, nominal disisipkan setelah mata uang, CRC valid", () => {
    const d = dynamicQris(STATIC, 125000);
    expect(validQris(d)).toBe(true);
    expect(d.startsWith("000201010212")).toBe(true);
    expect(d).toContain("53033605406125000" + "5802ID");
    expect(d).toContain("5802ID5918HAFIZ KHOIRU ZAMAN");
  });

  it("nominal berbeda menghasilkan payload dan CRC berbeda; memanggil ulang pada hasil dinamis tidak menggandakan tag 54", () => {
    expect(dynamicQris(STATIC, 10000)).not.toBe(dynamicQris(STATIC, 20000));
    const again = dynamicQris(dynamicQris(STATIC, 10000), 20000);
    expect(again).toBe(dynamicQris(STATIC, 20000));
  });

  it("menolak nominal tidak valid dan payload rusak", () => {
    expect(() => dynamicQris(STATIC, 0)).toThrow();
    expect(() => dynamicQris(STATIC, 1.5)).toThrow();
    expect(() => dynamicQris("bukan-qris", 1000)).toThrow();
  });
});
