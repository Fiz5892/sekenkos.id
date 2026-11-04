"use client";

import { useEffect, useRef, useState } from "react";

type NewFile = { key: string; file: File; preview: string; originalSize: number };

const btn = "rounded bg-white/90 px-1.5 py-0.5 text-xs font-bold text-foreground shadow hover:bg-white disabled:opacity-40";

function formatKb(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Mengompresi file foto di browser sebelum diunggah:
 * - Menyesuaikan dimensi maksimal ke 1200px (sangat cukup untuk e-commerce)
 * - Mengonversi ke format modern WebP dengan kualitas 0.82
 * - Mengurangi ukuran foto dari 5–10 MB menjadi ~100–300 KB tanpa penurunan kualitas visual yang berarti
 */
async function compressImage(file: File, maxDim = 1200, quality = 0.82): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(file);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          const baseName = file.name.replace(/\.[^.]+$/, "");
          const compressed = new File([blob], `${baseName}.webp`, {
            type: "image/webp",
            lastModified: Date.now(),
          });
          resolve(compressed);
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

/**
 * Mengelola foto produk: foto yang sudah ada (urutan, foto utama, hapus) dan unggahan baru (pratinjau, hapus).
 * Foto yang dipertahankan dikirim sebagai input tersembunyi "images" (urutan = urutan tampil), file baru
 * lewat input "files". Foto pertama menjadi foto utama.
 */
export function ImageManager({ initial, max }: { initial: string[]; max: number }) {
  const [kept, setKept] = useState<string[]>(initial);
  const [added, setAdded] = useState<NewFile[]>([]);
  const [compressing, setCompressing] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  // Menyelaraskan isi input file dengan daftar `added` (FileList hanya bisa diubah lewat DataTransfer).
  function syncInput(list: NewFile[]) {
    if (!input.current) return;
    const dt = new DataTransfer();
    list.forEach((n) => dt.items.add(n.file));
    input.current.files = dt.files;
  }

  useEffect(() => {
    return () => added.forEach((n) => URL.revokeObjectURL(n.preview));
    // hanya saat dilepas; pratinjau yang dibuang dibersihkan di removeNew
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length === 0) return;
    const room = Math.max(0, max - kept.length - added.length);
    const toProcess = picked.slice(0, room);

    setCompressing(true);
    try {
      const processed: NewFile[] = [];
      for (const file of toProcess) {
        const compressed = await compressImage(file);
        processed.push({
          key: `${compressed.name}-${compressed.size}-${crypto.randomUUID()}`,
          file: compressed,
          preview: URL.createObjectURL(compressed),
          originalSize: file.size,
        });
      }
      const next = [...added, ...processed];
      setAdded(next);
      syncInput(next);
    } finally {
      // Jangan mengosongkan input di sini: isinya baru saja disinkronkan (syncInput) dan itulah yang dikirim ke server.
      setCompressing(false);
    }
  }

  function removeNew(key: string) {
    const gone = added.find((n) => n.key === key);
    if (gone) URL.revokeObjectURL(gone.preview);
    const next = added.filter((n) => n.key !== key);
    setAdded(next);
    syncInput(next);
  }

  const move = (i: number, to: number) =>
    setKept((list) => {
      if (to < 0 || to >= list.length) return list;
      const copy = [...list];
      [copy[i], copy[to]] = [copy[to], copy[i]];
      return copy;
    });

  const total = kept.length + added.length;

  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 text-sm font-bold">
        Foto <span className="font-normal text-muted">({total}/{max})</span>
      </legend>

      {kept.map((src) => (
        <input key={`h-${src}`} type="hidden" name="images" value={src} />
      ))}

      {total > 0 && (
        <ul className="grid grid-cols-3 gap-2">
          {kept.map((src, i) => (
            <li key={src} className="relative aspect-square overflow-hidden rounded-lg border border-line bg-header">
              {/* eslint-disable-next-line @next/next/no-img-element -- pratinjau admin, tidak perlu optimasi */}
              <img src={src} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
              {i === 0 && <span className="absolute left-1 top-1 rounded bg-brand px-1.5 py-0.5 text-xs font-bold text-white">Utama</span>}
              <div className="absolute inset-x-1 bottom-1 flex flex-wrap justify-between gap-1">
                <span className="flex gap-1">
                  <button type="button" className={btn} onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Geser foto ${i + 1} ke kiri`}>
                    ◀
                  </button>
                  <button type="button" className={btn} onClick={() => move(i, i + 1)} disabled={i === kept.length - 1} aria-label={`Geser foto ${i + 1} ke kanan`}>
                    ▶
                  </button>
                </span>
                <span className="flex gap-1">
                  {i > 0 && (
                    <button type="button" className={btn} onClick={() => move(i, 0)}>
                      Utama
                    </button>
                  )}
                  <button type="button" className={`${btn} text-danger`} onClick={() => setKept((l) => l.filter((s) => s !== src))} aria-label={`Hapus foto ${i + 1}`}>
                    Hapus
                  </button>
                </span>
              </div>
            </li>
          ))}
          {added.map((n) => (
            <li key={n.key} className="relative aspect-square overflow-hidden rounded-lg border-2 border-dashed border-brand bg-header">
              {/* eslint-disable-next-line @next/next/no-img-element -- pratinjau lokal (blob) */}
              <img src={n.preview} alt={`Foto baru ${n.file.name}`} className="h-full w-full object-cover" />
              <div className="absolute left-1 top-1 flex flex-col gap-0.5">
                <span className="w-fit rounded bg-foreground px-1.5 py-0.5 text-[11px] font-bold text-white">
                  Baru ({formatKb(n.file.size)})
                </span>
              </div>
              <button type="button" className={`${btn} absolute bottom-1 right-1 text-danger`} onClick={() => removeNew(n.key)} aria-label={`Batalkan ${n.file.name}`}>
                Batal
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={`rounded-lg border-2 border-dashed border-line bg-header/50 p-5 text-center ${total >= max ? "opacity-60" : ""}`}>
        <input
          ref={input}
          name="files"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={onPick}
          disabled={total >= max || compressing}
          aria-label="Tambah foto"
          className="w-full text-sm text-muted file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-foreground file:px-5 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-black"
        />
        {compressing && (
          <p className="mt-2 flex items-center justify-center gap-1.5 text-xs font-bold text-brand" role="status">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            Mengompresi foto otomatis ke format WebP…
          </p>
        )}
        <p className="mt-2 text-xs leading-relaxed text-muted">
          JPG, PNG, atau WebP. Otomatis dikompresi ke WebP ringan (~100–300 KB).
        </p>
      </div>
    </fieldset>
  );
}
