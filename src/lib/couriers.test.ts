import { describe, expect, it } from "vitest";
import { detectCarrier } from "./couriers";

describe("detectCarrier", () => {
  it("mengenali kurir dari nama layanan Biteship", () => {
    expect(detectCarrier("JNE Reguler")?.code).toBe("jne");
    expect(detectCarrier("J&T EZ")?.code).toBe("jnt");
    expect(detectCarrier("SiCepat REG")?.code).toBe("sicepat");
    expect(detectCarrier("AnterAja Reguler")?.code).toBe("anteraja");
  });

  it("mengenali kurir yang dipilih admin untuk ongkir estimasi", () => {
    expect(detectCarrier("J&T Express (Reguler (estimasi))")?.code).toBe("jnt");
  });

  it("ongkir estimasi atau nama kosong tidak menebak kurir", () => {
    expect(detectCarrier("Reguler (estimasi)")).toBeNull();
    expect(detectCarrier("")).toBeNull();
    expect(detectCarrier(null)).toBeNull();
  });
});
