import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GatewayError, createInvoice, expireInvoice, gatewayEnabled, parseInvoiceEvent, validNotification } from "./gateway";

const KEY = "SB-Mid-server-rahasia";

beforeEach(() => {
  vi.stubEnv("MIDTRANS_SERVER_KEY", KEY);
  vi.stubEnv("MIDTRANS_ENABLED", "");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const signed = (n: Record<string, unknown>, key = KEY) => ({
  ...n,
  signature_key: createHash("sha512").update(`${n.order_id}${n.status_code}${n.gross_amount}${key}`).digest("hex"),
});
const paid = { order_id: "PLY-ABC234", status_code: "200", gross_amount: "45000.00", transaction_status: "settlement", payment_type: "bank_transfer", va_numbers: [{ bank: "bca" }] };

describe("gatewayEnabled", () => {
  it("aktif bila ada kunci, mati bila kosong atau dimatikan", () => {
    expect(gatewayEnabled()).toBe(true);
    vi.stubEnv("MIDTRANS_ENABLED", "false");
    expect(gatewayEnabled()).toBe(false);
    vi.stubEnv("MIDTRANS_ENABLED", "");
    vi.stubEnv("MIDTRANS_SERVER_KEY", "");
    expect(gatewayEnabled()).toBe(false);
  });
});

describe("validNotification", () => {
  it("menerima signature yang benar", () => {
    expect(validNotification(signed(paid))).toBe(true);
  });

  it("menolak signature palsu, nominal yang diubah, atau kunci lain", () => {
    expect(validNotification({ ...paid, signature_key: "abc" })).toBe(false);
    expect(validNotification({ ...signed(paid), gross_amount: "1000.00" })).toBe(false);
    expect(validNotification(signed(paid, "kunci-lain"))).toBe(false);
    expect(validNotification({ order_id: "x" })).toBe(false);
    expect(validNotification(null)).toBe(false);
  });

  it("menolak semua bila kunci belum diatur di server", () => {
    vi.stubEnv("MIDTRANS_SERVER_KEY", "");
    expect(validNotification(signed(paid, ""))).toBe(false);
  });
});

describe("parseInvoiceEvent", () => {
  it("membaca settlement VA bank sebagai lunas dengan nama kanal", () => {
    expect(parseInvoiceEvent(paid)).toEqual({ id: "PLY-ABC234", externalId: "PLY-ABC234", status: "PAID", amount: 45000, paidAmount: 45000, channel: "BCA" });
  });

  it("capture kartu hanya lunas bila lolos fraud check", () => {
    const card = { ...paid, transaction_status: "capture", payment_type: "credit_card", va_numbers: undefined };
    expect(parseInvoiceEvent({ ...card, fraud_status: "accept" })?.status).toBe("PAID");
    expect(parseInvoiceEvent({ ...card, fraud_status: "challenge" })?.status).toBe("CAPTURE");
  });

  it("memetakan expire dan meneruskan status lain apa adanya", () => {
    expect(parseInvoiceEvent({ ...paid, transaction_status: "expire" })?.status).toBe("EXPIRED");
    expect(parseInvoiceEvent({ ...paid, transaction_status: "pending" })?.status).toBe("PENDING");
  });

  it("menolak bentuk yang tidak dikenal", () => {
    expect(parseInvoiceEvent(null)).toBeNull();
    expect(parseInvoiceEvent({ order_id: "x" })).toBeNull();
    expect(parseInvoiceEvent({ order_id: "x", transaction_status: "settlement", gross_amount: "abc" })).toBeNull();
  });
});

describe("createInvoice", () => {
  const input = {
    externalId: "PLY-ABC234",
    amount: 45000,
    description: "Pesanan",
    email: "a@b.id",
    name: "Budi",
    phone: "081234567890",
    durationSeconds: 86000,
    successUrl: "https://toko.id/pesanan/PLY-ABC234?bayar=ok",
    failureUrl: "https://toko.id/pesanan/PLY-ABC234",
  };

  it("mengirim permintaan Snap dengan Basic auth dan nominal yang benar, lalu mengembalikan tautan bayar", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ token: "tok", redirect_url: "https://app.sandbox.midtrans.com/snap/v4/redirection/tok" })));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createInvoice(input)).resolves.toEqual({ id: "PLY-ABC234", url: "https://app.sandbox.midtrans.com/snap/v4/redirection/tok" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://app.sandbox.midtrans.com/snap/v1/transactions");
    expect(init.headers.Authorization).toBe(`Basic ${Buffer.from(`${KEY}:`).toString("base64")}`);
    const body = JSON.parse(init.body);
    expect(body.transaction_details).toEqual({ order_id: "PLY-ABC234", gross_amount: 45000 });
    expect(body.expiry).toEqual({ unit: "minutes", duration: 1434 });
    expect(body.callbacks.finish).toBe(input.successUrl);
    expect(body.customer_details).toMatchObject({ first_name: "Budi", email: "a@b.id", phone: "081234567890" });
  });

  it("memakai server produksi bila kunci bukan sandbox", async () => {
    vi.stubEnv("MIDTRANS_SERVER_KEY", "Mid-server-asli");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ redirect_url: "https://app.midtrans.com/snap/v4/redirection/tok" })));
    vi.stubGlobal("fetch", fetchMock);
    await createInvoice(input);
    expect(fetchMock.mock.calls[0][0]).toBe("https://app.midtrans.com/snap/v1/transactions");
  });

  it("memberi galat ramah (tanpa membocorkan detail) bila Midtrans menolak atau jaringan gagal", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("kunci salah", { status: 401 })));
    await expect(createInvoice(input)).rejects.toBeInstanceOf(GatewayError);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNRESET")));
    await expect(createInvoice(input)).rejects.toThrow(/Pembayaran online belum bisa dibuka/);
  });
});

describe("expireInvoice", () => {
  it("memanggil endpoint expire dan tidak pernah melempar galat", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("timeout"));
    vi.stubGlobal("fetch", fetchMock);
    await expect(expireInvoice("PLY/1")).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.sandbox.midtrans.com/v2/PLY%2F1/expire");
  });
});
