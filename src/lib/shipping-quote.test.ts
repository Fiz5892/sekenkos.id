import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ShippingError, quoteShipping, resolveShipping } from "./shipping-quote";

beforeEach(() => {
  vi.stubEnv("BITESHIP_API_KEY", "");
  vi.stubEnv("SHIPPING_ORIGIN_ZIP", "65141");
  vi.stubEnv("SHIPPING_MARKUP_PERCENT", "");
  vi.stubEnv("SHIPPING_PACKING_FEE", "");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("tanpa kunci Biteship", () => {
  it("memberi perkiraan tarif berlabel estimasi plus ambil di tempat", async () => {
    const options = await quoteShipping("65145", 1200);
    expect(options.at(-1)).toMatchObject({ id: "pickup", cost: 0 });
    expect(options.slice(0, -1).every((o) => o.estimate && o.cost > 0)).toBe(true);
  });

  it("menolak kode pos yang bukan 5 digit", async () => {
    await expect(quoteShipping("123", 500)).rejects.toBeInstanceOf(ShippingError);
  });

  it("memakai biaya packing dari env", async () => {
    const base = (await quoteShipping("60111", 900))[0].cost;
    vi.stubEnv("SHIPPING_PACKING_FEE", "3000");
    // berat berbeda (tetap 1 kg) agar tidak terkena cache
    const withFee = (await quoteShipping("60111", 950))[0].cost;
    expect(withFee).toBe(base + 3000);
  });
});

describe("resolveShipping", () => {
  it("ambil di tempat selalu gratis tanpa memanggil kurir", async () => {
    await expect(resolveShipping("65145", 500, "pickup")).resolves.toMatchObject({ cost: 0 });
  });

  it("menolak id yang tidak ada di daftar tarif (klien tak bisa mengarang ongkir)", async () => {
    await expect(resolveShipping("65145", 700, "jne:murah-banget")).rejects.toBeInstanceOf(ShippingError);
  });
});

describe("dengan kunci Biteship", () => {
  it("memanggil API dengan kode pos & berat yang benar dan mengembalikan tarif termurah dulu", async () => {
    vi.stubEnv("BITESHIP_API_KEY", "biteship_test.kunci");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          pricing: [
            { courier_code: "jne", courier_name: "JNE", courier_service_code: "reg", courier_service_name: "Reguler", duration: "2 - 3 days", price: 18000 },
            { courier_code: "sicepat", courier_name: "SiCepat", courier_service_code: "reg", courier_service_name: "REG", duration: "1 - 2 days", price: 14000 },
          ],
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const options = await quoteShipping("40115", 1350, 85000);
    expect(options.map((o) => o.id)).toEqual(["sicepat:reg", "jne:reg", "pickup"]);
    expect(options[0].estimate).toBeUndefined();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.biteship.com/v1/rates/couriers");
    expect(init.headers.Authorization).toBe("biteship_test.kunci");
    expect(JSON.parse(init.body)).toMatchObject({ origin_postal_code: 65141, destination_postal_code: 40115, items: [{ weight: 1350, value: 85000, quantity: 1 }] });

    await quoteShipping("40115", 1350, 85000); // kedua: dari cache
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("gagal (bukan menebak tarif) saat API bermasalah, supaya toko tidak nombok", async () => {
    vi.stubEnv("BITESHIP_API_KEY", "biteship_test.kunci");
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("oops", { status: 500 })));
    await expect(quoteShipping("40116", 777)).rejects.toThrow(/belum bisa diambil/);
  });
});
