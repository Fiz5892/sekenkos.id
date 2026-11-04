import type { Category, Product } from "@/generated/prisma/client";
import { MAX_IMAGES_PER_PRODUCT } from "@/lib/storage-limits";
import { CONDITION_LABEL } from "@/lib/site";
import { createProduct, updateProduct } from "./actions";
import { ImageManager } from "./image-manager";

const input = "w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-brand";

function Label({ text, hint, children }: { text: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-bold">{text}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function ProductForm({ product, categories, error, saved }: { product?: Product; categories: Category[]; error?: string; saved?: boolean }) {
  return (
    <form action={product ? updateProduct : createProduct} className="grid max-w-3xl gap-4 rounded-card border border-line p-5">
      {product && <input type="hidden" name="id" value={product.id} />}
      {saved && (
        <p role="status" className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
          Produk disimpan.
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Label text="Nama produk">
          <input name="name" defaultValue={product?.name} required minLength={2} maxLength={120} className={input} />
        </Label>
        <Label text="Slug (URL)" hint="Kosongkan agar dibuat dari nama.">
          <input name="slug" defaultValue={product?.slug} maxLength={80} className={input} />
        </Label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Label text="Kategori">
          <select name="categoryId" defaultValue={product?.categoryId} required className={input}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Label>
        <Label text="Kondisi">
          <select name="condition" defaultValue={product?.condition ?? "BEKAS_BAIK"} className={input}>
            {Object.entries(CONDITION_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Label>
        <Label text="Ukuran">
          <input name="size" defaultValue={product?.size} required maxLength={60} className={input} />
        </Label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Label text="Harga (Rp)">
          <input name="price" type="number" min={100} step={100} defaultValue={product?.price} required className={input} />
        </Label>
        <Label text="Stok">
          <input name="stock" type="number" min={0} defaultValue={product?.stock ?? 1} required className={input} />
        </Label>
        <Label text="Berat (gram)">
          <input name="weightGrams" type="number" min={10} max={50000} step={10} defaultValue={product?.weightGrams ?? 500} required className={input} />
          <span className="text-xs font-normal text-muted">Untuk barang besar, isi yang lebih besar antara berat timbangan dan berat volume (P × L × T cm ÷ 6 = gram). Kurir menagih yang lebih besar.</span>
        </Label>
        <Label text="Status">
          <select name="status" defaultValue={product?.status ?? "ACTIVE"} className={input}>
            <option value="ACTIVE">Aktif (tampil di toko)</option>
            <option value="ARCHIVED">Diarsipkan (disembunyikan)</option>
          </select>
        </Label>
      </div>

      <Label text="Deskripsi">
        <textarea name="description" defaultValue={product?.description} required minLength={10} maxLength={2000} rows={4} className={input} />
      </Label>

      <ImageManager initial={product?.images ?? []} max={MAX_IMAGES_PER_PRODUCT} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isPhoto" defaultChecked={product?.isPhoto ?? true} /> Ini foto asli barang (bukan ilustrasi)
      </label>

      <button className="w-fit rounded-full bg-foreground px-6 py-2.5 font-bold text-white hover:bg-black">{product ? "Simpan perubahan" : "Tambah produk"}</button>
    </form>
  );
}
