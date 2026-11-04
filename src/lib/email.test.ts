import { afterEach, describe, expect, it, vi } from "vitest";

const sendMail = vi.fn().mockResolvedValue({});
const createTransport = vi.fn(() => ({ sendMail }));
vi.mock("server-only", () => ({}));
vi.mock("nodemailer", () => ({ default: { createTransport } }));

const { sendEmail } = await import("./email");
const mail = { to: "pembeli@contoh.com", subject: "Reset password", text: "Tautan: https://contoh" };

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("sendEmail", () => {
  it("SMTP diisi: kirim lewat Gmail (bawaan smtp.gmail.com:465, SSL) dengan pengirim dari akun SMTP", async () => {
    vi.stubEnv("SMTP_USER", "toko@gmail.com");
    vi.stubEnv("SMTP_PASS", "abcd efgh ijkl mnop");
    vi.stubEnv("SMTP_HOST", "");
    vi.stubEnv("SMTP_PORT", "");
    vi.stubEnv("EMAIL_FROM", "");
    await sendEmail(mail);
    expect(createTransport).toHaveBeenCalledWith({ host: "smtp.gmail.com", port: 465, secure: true, pool: true, maxConnections: 3, maxMessages: 100, auth: { user: "toko@gmail.com", pass: "abcd efgh ijkl mnop" } });
    expect(sendMail).toHaveBeenCalledWith({ from: "sekenkos.id <toko@gmail.com>", ...mail });
  });

  it("SMTP lebih diutamakan daripada Resend; port 587 memakai STARTTLS", async () => {
    vi.stubEnv("SMTP_USER", "toko@contoh.com");
    vi.stubEnv("SMTP_PASS", "rahasia");
    vi.stubEnv("SMTP_HOST", "smtp.contoh.com");
    vi.stubEnv("SMTP_PORT", "587");
    vi.stubEnv("RESEND_API_KEY", "re_x");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await sendEmail(mail);
    expect(createTransport).toHaveBeenCalledWith(expect.objectContaining({ host: "smtp.contoh.com", port: 587, secure: false }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("galat SMTP diteruskan ke pemanggil (tidak diam-diam dianggap terkirim)", async () => {
    vi.stubEnv("SMTP_USER", "toko@gmail.com");
    vi.stubEnv("SMTP_PASS", "salah");
    sendMail.mockRejectedValueOnce(new Error("535 Username and Password not accepted"));
    await expect(sendEmail(mail)).rejects.toThrow("535");
  });

  it("tanpa SMTP dan Resend: produksi gagal, development mencetak ke konsol", async () => {
    vi.stubEnv("SMTP_USER", "");
    vi.stubEnv("SMTP_PASS", "");
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("NODE_ENV", "production");
    await expect(sendEmail(mail)).rejects.toThrow("Layanan email belum diatur");
    vi.stubEnv("NODE_ENV", "development");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await sendEmail(mail);
    expect(log).toHaveBeenCalledWith(expect.stringContaining("Kepada: pembeli@contoh.com"));
    expect(createTransport).not.toHaveBeenCalled();
  });
});
