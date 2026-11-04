"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { AddressPicker, type PickerInitial } from "@/components/address-picker";
import { formatRupiah } from "@/lib/format";
import { calcTotals } from "@/lib/pricing";
import { PAYMENT_METHODS, PICKUP_OPTION, type PaymentMethodKey, type ShippingOption } from "@/lib/shipping";
import type { Option } from "@/lib/wilayah";
import { checkPromo, getShippingOptions, placeOrder, type CheckoutState, type PromoState } from "./actions";

type Item = { id: string; name: string; qty: number; price: number };
type Saved = { recipient: string; phone: string; street: string };

const input = "w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-brand";

export function CheckoutForm({
  items,
  subtotal,
  saved,
  gateway,
  provinces,
  initialPlace,
}: {
  items: Item[];
  subtotal: number;
  saved: Saved;
  gateway: boolean;
  provinces: Option[];
  initialPlace: PickerInitial | null;
}) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(placeOrder, {});
  const [zip, setZip] = useState(initialPlace?.zip ?? "");
  const [villageCode, setVillageCode] = useState(initialPlace?.villageCode ?? "");
  const [quote, setQuote] = useState<{ zip: string; village: string; options: ShippingOption[]; error: string } | null>(null);
  const [courierId, setCourierId] = useState<string>("");
  const payments = (Object.keys(PAYMENT_METHODS) as PaymentMethodKey[]).filter((k) => gateway || k !== "GATEWAY");
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<PromoState | null>(null);
  const [checking, startCheck] = useTransition();

  // Ambil tarif ongkir tiap kali kode pos lengkap (5 digit) atau server meminta tarif dimuat ulang.
  const refresh = state.refreshShipping ? state : null;
  const validZip = /^\d{5}$/.test(zip) && Boolean(villageCode);
  useEffect(() => {
    if (!validZip) return;
    let stale = false; // jawaban untuk alamat sebelumnya diabaikan
    getShippingOptions(zip, villageCode).then((r) => {
      if (!stale) setQuote({ zip, village: villageCode, options: r.options ?? [PICKUP_OPTION], error: r.error ?? "" });
    });
    return () => {
      stale = true;
    };
  }, [zip, villageCode, validZip, refresh]);
  const ready = validZip && quote?.zip === zip && quote.village === villageCode;
  const options = ready ? quote.options : [PICKUP_OPTION];
  const shipError = ready ? quote.error : "";
  const loadingShip = validZip && !ready;

  // Pilihan terdahulu dipertahankan bila masih ada; jika tidak, pilih yang termurah (kurir, bukan ambil di tempat).
  const selected = options.find((o) => o.id === courierId) ?? options.find((o) => o.id !== PICKUP_OPTION.id) ?? options[0];
  const totals = calcTotals(subtotal, selected.cost, promo?.ok ? promo.percent : 0);
  const canOrder = !pending && !loadingShip && Boolean(selected);

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
            <AddressPicker
              provinces={provinces}
              initial={initialPlace}
              onChange={(v) => {
                setZip(v.zip);
                setVillageCode(v.villageCode);
              }}
            />
          </div>
          <div className="mt-4">
            <Label text="Detail alamat">
              <textarea name="street" defaultValue={saved.street} required rows={2} autoComplete="street-address" placeholder="Nama jalan, nomor rumah, RT/RW, patokan" className={input} />
            </Label>
          </div>
          <fieldset className="mt-4" aria-busy={loadingShip}>
            <legend className="text-sm font-bold">Jasa pengiriman</legend>
            <input type="hidden" name="courier" value={selected.id} />
            <input type="hidden" name="shippingCost" value={selected.cost} />
            {loadingShip && <p className="mt-2 text-sm text-muted">Menghitung ongkir…</p>}
            {!validZip && <p className="mt-2 text-sm text-muted">Pilih alamat sampai desa / kelurahan untuk melihat ongkir.</p>}
            {!loadingShip && shipError && (
              <p role="status" className="mt-2 text-sm text-danger">
                {shipError}
              </p>
            )}
            <div className="mt-2 grid gap-2">
              {options.map((o) => (
                <label key={o.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-line p-3 has-[:checked]:border-brand has-[:checked]:bg-header">
                  <input type="radio" name="courier-choice" checked={selected.id === o.id} onChange={() => setCourierId(o.id)} />
                  <span className="flex-1">
                    <b>{o.name}</b>
                    <span className="block text-sm text-muted">{o.eta}</span>
                  </span>
                  <b>{o.cost ? formatRupiah(o.cost) : "Gratis"}</b>
                </label>
              ))}
            </div>
            {options.some((o) => o.estimate) && <p className="mt-2 text-xs text-muted">Tarif berupa perkiraan. Total akhir tertera di halaman pesanan.</p>}
          </fieldset>
        </section>

        <fieldset className="rounded-card border border-line p-5">
          <legend className="px-1 text-xl font-bold">Metode pembayaran</legend>
          {payments.map((key, i) => (
            <label key={key} className="mt-2 flex cursor-pointer items-start gap-3 rounded-lg border border-line p-3 has-[:checked]:border-brand has-[:checked]:bg-header">
              <input type="radio" name="payment" value={key} defaultChecked={i === 0} className="mt-1" />
              <span>
                <b>{PAYMENT_METHODS[key].label}</b>
                <span className="block text-sm text-muted">{PAYMENT_METHODS[key].note}</span>
              </span>
            </label>
          ))}
          <p className="mt-3 text-xs text-muted">
            {gateway
              ? "Bayar online: kamu diarahkan ke halaman pembayaran aman dan pesanan otomatis lunas. Transfer manual: dikonfirmasi admin setelah kamu kirim bukti lewat WhatsApp."
              : "Pembayaran dikonfirmasi manual oleh admin setelah kamu mengirim bukti lewat WhatsApp."}
          </p>
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
        <button disabled={!canOrder} className="mt-4 w-full rounded-full bg-foreground py-3 font-bold text-white hover:bg-black disabled:opacity-60">
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
