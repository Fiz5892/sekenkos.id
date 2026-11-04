import Link from "next/link";
import type { Category, Product } from "@/generated/prisma/client";
import { MAX_IMAGES_PER_PRODUCT } from "@/lib/storage-limits";
import { CONDITION_LABEL } from "@/lib/site";
import { createProduct, updateProduct } from "./actions";
import { ImageManager } from "./image-manager";

const input = "h-11 w-full rounded-lg border border-line bg-white px-3 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15";

function Field({ text, hint, children, className = "" }: { text: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`grid content-start gap-1.5 text-sm ${className}`}>
      <span className="font-bold">{text}</span>
      {children}
      {hint && <span className="text-xs leading-relaxed text-muted">{hint}</span>}
    </label>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-line p-5 sm:p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      <div className="mt-4 grid gap-4">{children}</div>
    </section>
  );
}

export function ProductForm({ product, categories, error, saved }: { product?: Product; categories: Category[]; error?: string; saved?: boolean }) {
  return (
    <form action={product ? updateProduct : createProduct} className="grid max-w-4xl gap-5">
      {product && <input type="hidden" name="id" value={product.id} />}
      {saved && (
        <p role="status" className="rounded-lg bg-success/10 px-4 py-3 text-sm font-bold text-success">
          Produk disimpan.
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-danger/10 px-4 py-3 text-sm font-bold text-danger">
          {error}
        </p>
      )}

      <Section title="Informasi produk">
        <div className="grid items-start gap-4 sm:grid-cols-2">
          <Field text="Nama produk">
            <input name="name" defaultValue={product?.name} required minLength={2} maxLength={120} placeholder="mis. Kemeja Polo Hijau" className={input} />
          </Field>
          <Field text="Slug (URL)" hint="Kosongkan agar dibuat otomatis dari nama.">
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
            rows={5}
            placeholder="Kondisi barang apa adanya: warna, bahan, cacat/lecet bila ada."
            className="w-full rounded-lg border border-line bg-white px-3 py-2.5 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15"
          />
        </Field>
      </Section>

      <Section title="Harga, stok, dan pengiriman">
        <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field text="Harga (Rp)">
            <input name="price" type="number" min={100} step={100} defaultValue={product?.price} required placeholder="50000" className={input} />
          </Field>
          <Field text="Stok">
            <input name="stock" type="number" min={0} defaultValue={product?.stock ?? 1} required className={input} />
          </Field>
          <Field text="Berat (gram)">
            <input name="weightGrams" type="number" min={10} max={50000} step={10} defaultValue={product?.weightGrams ?? 500} required className={input} />
          </Field>
          <Field text="Status">
            <select name="status" defaultValue={product?.status ?? "ACTIVE"} className={input}>
              <option value="ACTIVE">Aktif (tampil di toko)</option>
              <option value="ARCHIVED">Diarsipkan (disembunyikan)</option>
            </select>
          </Field>
        </div>
        <p className="rounded-lg bg-header px-4 py-3 text-xs leading-relaxed text-muted">
          <b className="text-foreground">Berat dipakai menghitung ongkir.</b> Untuk barang besar, isi yang lebih besar antara berat timbangan dan berat volume
          (P × L × T cm ÷ 6 = gram). Kurir menagih yang lebih besar.
        </p>
      </Section>

      <Section title="Foto produk" hint="Foto pertama menjadi foto utama di toko.">
        <ImageManager initial={product?.images ?? []} max={MAX_IMAGES_PER_PRODUCT} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isPhoto" defaultChecked={product?.isPhoto ?? true} className="size-4 accent-brand" /> Ini foto asli barang (bukan ilustrasi)
        </label>
      </Section>

      <div className="flex items-center gap-4">
        <button className="rounded-full bg-foreground px-7 py-3 font-bold text-white hover:bg-black">{product ? "Simpan perubahan" : "Tambah produk"}</button>
        <Link href="/admin/produk" className="text-sm font-bold text-brand hover:underline">
          Batal
        </Link>
      </div>
    </form>
  );
}
