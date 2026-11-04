import Link from "next/link";
import type { Category, Product } from "@/generated/prisma/client";
import { MAX_IMAGES_PER_PRODUCT } from "@/lib/storage-limits";
import { CONDITION_LABEL } from "@/lib/site";
import { createProduct, updateProduct } from "./actions";
import { ImageManager } from "./image-manager";

const input =
  "h-12 w-full rounded-xl border border-line bg-white px-4 text-[15px] shadow-sm outline-none transition-colors placeholder:text-muted/60 hover:border-brand/40 focus:border-brand focus:ring-4 focus:ring-brand/15";

const ICONS = {
  tag: "M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8ZM7 7h.01",
  coin: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 5v10m-3-7.5c0-1 1.3-1.5 3-1.5s3 .5 3 1.5-1.3 1.5-3 1.5-3 .5-3 1.5 1.3 1.5 3 1.5 3-.5 3-1.5",
  camera: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2ZM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  bulb: "M9 18h6m-5 3h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3Z",
};

function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

function Field({ text, hint, children, className = "" }: { text: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`grid content-start gap-1.5 text-sm ${className}`}>
      <span className="font-bold">{text}</span>
      {children}
      {hint && <span className="text-xs leading-relaxed text-muted">{hint}</span>}
    </label>
  );
}

/** Kolom isian dengan awalan (mis. "Rp") atau akhiran (mis. "gram") di dalam kotaknya. */
function Affix({ prefix, suffix, children }: { prefix?: string; suffix?: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      {prefix && <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-bold text-muted">{prefix}</span>}
      {children}
      {suffix && <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-bold text-muted">{suffix}</span>}
    </div>
  );
}

function Section({ title, hint, icon, children }: { title: string; hint?: string; icon: keyof typeof ICONS; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-card border border-line shadow-sm">
      <header className="flex items-center gap-3 border-b border-line bg-header/60 px-5 py-3.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-white">
          <Icon name={icon} />
        </span>
        <div>
          <h2 className="text-base font-bold leading-tight">{title}</h2>
          {hint && <p className="text-xs text-muted">{hint}</p>}
        </div>
      </header>
      <div className="grid gap-4 p-5">{children}</div>
    </section>
  );
}

const STATUS = [
  { value: "ACTIVE", label: "Aktif", sub: "Tampil di toko", dot: "bg-success" },
  { value: "ARCHIVED", label: "Diarsipkan", sub: "Disembunyikan", dot: "bg-muted" },
];

export function ProductForm({ product, categories, error, saved }: { product?: Product; categories: Category[]; error?: string; saved?: boolean }) {
  const status = product?.status ?? "ACTIVE";
  return (
    <form action={product ? updateProduct : createProduct} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      {product && <input type="hidden" name="id" value={product.id} />}
      {saved && (
        <p role="status" className="rounded-lg bg-success/10 px-4 py-3 text-sm font-bold text-success lg:col-span-2">
          Produk disimpan.
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-danger/10 px-4 py-3 text-sm font-bold text-danger lg:col-span-2">
          {error}
        </p>
      )}

      <div className="grid gap-5">
        <Section title="Informasi produk" hint="Nama, kategori, dan kondisi barang" icon="tag">
          <div className="grid items-start gap-4 sm:grid-cols-2">
            <Field text="Nama produk">
              <input name="name" defaultValue={product?.name} required minLength={2} maxLength={120} placeholder="mis. Kemeja Polo Hijau" className={input} />
            </Field>
            <Field text="Slug (URL)" hint="Kosongkan = otomatis dari nama.">
              <input name="slug" defaultValue={product?.slug} maxLength={80} placeholder="kemeja-polo-hijau" className={input} />
            </Field>
          </div>
          <div className="grid items-start gap-4 sm:grid-cols-3">
            <Field text="Kategori">
              <select name="categoryId" defaultValue={product?.categoryId} required className={input}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field text="Kondisi">
              <select name="condition" defaultValue={product?.condition ?? "BEKAS_BAIK"} className={input}>
                {Object.entries(CONDITION_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            <Field text="Ukuran">
              <input name="size" defaultValue={product?.size} required maxLength={60} placeholder="mis. L, 40, One size" className={input} />
            </Field>
          </div>
          <Field text="Deskripsi">
            <textarea
              name="description"
              defaultValue={product?.description}
              required
              minLength={10}
              maxLength={2000}
              rows={6}
              placeholder="Kondisi barang apa adanya: warna, bahan, cacat/lecet bila ada."
              className="w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] shadow-sm outline-none transition-colors placeholder:text-muted/60 hover:border-brand/40 focus:border-brand focus:ring-4 focus:ring-brand/15"
            />
          </Field>
        </Section>

        <Section title="Harga, stok, dan pengiriman" hint="Dipakai untuk etalase dan hitung ongkir" icon="coin">
          <div className="grid items-start gap-4 sm:grid-cols-3">
            <Field text="Harga">
              <Affix prefix="Rp">
                <input name="price" type="number" min={100} step={100} defaultValue={product?.price} required placeholder="50000" className={`${input} pl-11`} />
              </Affix>
            </Field>
            <Field text="Stok">
              <Affix suffix="pcs">
                <input name="stock" type="number" min={0} defaultValue={product?.stock ?? 1} required className={`${input} pr-12`} />
              </Affix>
            </Field>
            <Field text="Berat">
              <Affix suffix="gram">
                <input name="weightGrams" type="number" min={10} max={50000} step={10} defaultValue={product?.weightGrams ?? 500} required className={`${input} pr-14`} />
              </Affix>
            </Field>
          </div>

          <fieldset>
            <legend className="mb-1.5 text-sm font-bold">Status</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {STATUS.map((s) => (
                <label key={s.value} className="cursor-pointer">
                  <input type="radio" name="status" value={s.value} defaultChecked={status === s.value} className="peer sr-only" />
                  <span className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-2.5 shadow-sm transition-colors hover:border-brand/40 peer-checked:border-brand peer-checked:bg-brand/5 peer-checked:ring-4 peer-checked:ring-brand/10 peer-focus-visible:ring-4 peer-focus-visible:ring-brand/30">
                    <span className={`size-2.5 rounded-full ${s.dot}`} />
                    <span className="grid text-sm leading-tight">
                      <b>{s.label}</b>
                      <span className="text-xs text-muted">{s.sub}</span>
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <p className="rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 text-xs leading-relaxed text-muted">
            <b className="text-foreground">Berat dipakai menghitung ongkir.</b> Untuk barang besar, isi yang lebih besar antara berat timbangan dan berat volume
            (P × L × T cm ÷ 6 = gram). Kurir menagih yang lebih besar.
          </p>
        </Section>
      </div>

      <div className="grid gap-5 lg:sticky lg:top-4">
        <Section title="Foto produk" hint="Foto pertama menjadi foto utama di toko." icon="camera">
          <ImageManager initial={product?.images ?? []} max={MAX_IMAGES_PER_PRODUCT} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isPhoto" defaultChecked={product?.isPhoto ?? true} className="size-4 accent-brand" /> Ini foto asli barang (bukan ilustrasi)
          </label>
        </Section>

        <aside className="flex gap-3 rounded-card border border-brand/20 bg-brand/5 p-4 text-xs leading-relaxed text-muted">
          <span className="mt-0.5 text-brand">
            <Icon name="bulb" />
          </span>
          <ul className="grid list-disc gap-1 pl-4">
            <li>Foto terang dari beberapa sisi menaikkan peluang laku.</li>
            <li>Tulis cacat atau lecet apa adanya, pembeli lebih percaya.</li>
            <li>Cantumkan ukuran asli (lebar dada, panjang) di deskripsi.</li>
          </ul>
        </aside>

        <div className="grid gap-2">
          <button className="w-full rounded-full bg-brand py-3.5 font-bold text-white shadow-md transition-colors hover:bg-foreground">
            {product ? "Simpan perubahan" : "Tambah produk"}
          </button>
          <Link href="/admin/produk" className="py-1 text-center text-sm font-bold text-brand hover:underline">
            Batal
          </Link>
        </div>
      </div>
    </form>
  );
}
