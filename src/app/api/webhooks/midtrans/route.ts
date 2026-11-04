import { applyInvoiceEvent } from "@/lib/gateway-events";
import { parseInvoiceEvent, validNotification } from "@/lib/gateway";

// Diisi di dashboard Midtrans: Settings > Configuration > Payment Notification URL
// dengan URL  https://DOMAIN-ANDA/api/webhooks/midtrans
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body bukan JSON" }, { status: 400 });
  }
  if (!validNotification(body)) {
    return Response.json({ error: "Tidak diizinkan" }, { status: 401 });
  }
  const event = parseInvoiceEvent(body);
  // Bentuk tak dikenal dijawab 200 agar tidak dikirim ulang terus-menerus.
  if (!event) return Response.json({ ok: true, result: "ignored" });

  // Kegagalan internal dijawab 500 supaya Midtrans mengirim ulang.
  const result = await applyInvoiceEvent(event);
  return Response.json({ ok: true, result });
}
