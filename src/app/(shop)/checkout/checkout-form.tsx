"use client";

import { useActionState, useState, useTransition } from "react";
import { formatRupiah } from "@/lib/format";
import { calcTotals } from "@/lib/pricing";
import { COURIERS, PAYMENT_METHODS, type PaymentMethodKey } from "@/lib/shipping";
import { checkPromo, placeOrder, type CheckoutState, type PromoState } from "./actions";

type Item = { id: string; name: string; qty: number; price: number };
type Saved = { recipient: string; phone: string; street: string; city: string; zip: string };

const input = "w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-brand";

export function CheckoutForm({ items, subtotal, saved }: { items: Item[]; subtotal: number; saved: Saved }) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(placeOrder, {});
  const [courierId, setCourierId] = useState<string>(COURIERS[0].id);
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<PromoState | null>(null);
  const [checking, startCheck] = useTransition();

  const courier = COURIERS.find((c) => c.id === courierId)!;
  const totals = calcTotals(subtotal, courier.cost, promo?.ok ? promo.percent : 0);

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="grid gap-6">
        <section className="rounded-card border border-line p-5">
          <h2 className="mb-4 text-xl font-bold">Detail pengiriman</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Label text="Nama penerima">
              <input name="recipient" defaultValue={saved.recipient} required autoComplete="name" className={input} />
            </Label>
            <Label text="Nomor HP / WhatsApp">
              <input name="phone" defaultValue={saved.phone} required type="tel" autoComplete="tel" placeholder="08xxxxxxxxxx" className={input} />
            </Label>
          </div>
          <div className="mt-4">
            <Label text="Alamat lengkap">
              <textarea name="street" defaultValue={saved.street} required rows={2} autoComplete="street-address" placeholder="Jalan, nomor, RT/RW, kelurahan" className={input} />
            </Label>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Label text="Kota / Kabupaten">
              <input name="city" defaultValue={saved.city} required autoComplete="address-level2" className={input} />
            </Label>
            <Label text="Kode pos">
              <input name="zip" defaultValue={saved.zip} required inputMode="numeric" maxLength={5} autoComplete="postal-code" className={input} />
            </Label>
          </div>
          <div className="mt-4">
            <Label text="Jasa pengiriman">
              <select name="courier" value={courierId} onChange={(e) => setCourierId(e.target.value)} className={input}>
                {COURIERS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.cost ? formatRupiah(c.cost) : "Gratis"} ({c.eta})
                  </option>
                ))}
              </select>
            </Label>
          </div>
        </section>

        <fieldset className="rounded-card border border-line p-5">
          <legend className="px-1 text-xl font-bold">Metode pembayaran</legend>
          {(Object.keys(PAYMENT_METHODS) as PaymentMethodKey[]).map((key, i) => (
            <label key={key} className="mt-2 flex cursor-pointer items-start gap-3 rounded-lg border border-line p-3 has-[:checked]:border-brand has-[:checked]:bg-header">
              <input type="radio" name="payment" value={key} defaultChecked={i === 0} className="mt-1" />
              <span>
                <b>{PAYMENT_METHODS[key].label}</b>
                <span className="block text-sm text-muted">{PAYMENT_METHODS[key].note}</span>
              </span>
            </label>
          ))}
          <p className="mt-3 text-xs text-muted">Pembayaran dikonfirmasi manual oleh admin setelah kamu mengirim bukti lewat WhatsApp.</p>
        </fieldset>
      </div>

      <aside className="h-fit rounded-card border border-line p-5">
        <h2 className="text-xl font-bold">Pesananmu</h2>
        <ul className="mt-3 grid gap-1 text-sm">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3">
              <span>
                {i.name} × {i.qty}
              </span>
              <span>{formatRupiah(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex gap-2">
          <input
            name="promo"
            value={promo?.ok ? (promo.code ?? promoInput) : promoInput}
            onChange={(e) => {
              setPromoInput(e.target.value);
              setPromo(null);
            }}
            placeholder="Kode promo"
            aria-label="Kode promo"
            className={`${input} uppercase`}
          />
          <button
            type="button"
            disabled={checking}
            onClick={() => startCheck(async () => setPromo(await checkPromo(promoInput)))}
            className="rounded-full border border-foreground px-4 text-sm font-bold hover:bg-header disabled:opacity-50"
          >
            Pakai
          </button>
        </div>
        {promo && (
          <p role="status" className={`mt-1 text-sm ${promo.ok ? "text-success" : "text-danger"}`}>
            {promo.message}
          </p>
        )}

        <dl className="mt-4 grid gap-1 border-t border-line pt-3 text-sm">
          <Row label="Subtotal" value={formatRupiah(totals.subtotal)} />
          {totals.discount > 0 && <Row label="Diskon" value={`−${formatRupiah(totals.discount)}`} className="text-success" />}
          <Row label="Ongkos kirim" value={totals.shipping ? formatRupiah(totals.shipping) : "Gratis"} />
          <Row label="Total" value={formatRupiah(totals.total)} className="mt-1 border-t border-line pt-2 text-lg font-bold" />
        </dl>

        {state.error && (
          <p role="alert" className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {state.error}
          </p>
        )}
        <button disabled={pending} className="mt-4 w-full rounded-full bg-foreground py-3 font-bold text-white hover:bg-black disabled:opacity-60">
          {pending ? "Memproses…" : "Buat Pesanan"}
        </button>
        <p className="mt-2 text-xs text-muted">
          Dengan menekan tombol di atas kamu menyetujui syarat &amp; ketentuan toko. Stok barang ditahan 24 jam untuk menunggu pembayaran.
        </p>
      </aside>
    </form>
  );
}

function Label({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-bold">{text}</span>
      {children}
    </label>
  );
}

function Row({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex justify-between ${className}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
