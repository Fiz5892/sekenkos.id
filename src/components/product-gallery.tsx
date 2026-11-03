"use client";

import Image from "next/image";
import { useRef, useState } from "react";

const arrow =
  "absolute top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-xl shadow hover:bg-white disabled:opacity-0";

/**
 * Slider foto produk. Memakai scroll-snap bawaan browser sehingga geser jari/trackpad terasa alami,
 * ditambah tombol panah, titik, dan thumbnail. Satu foto: tampil biasa tanpa kontrol.
 */
export function ProductGallery({ images, name, isPhoto }: { images: string[]; name: string; isPhoto: boolean }) {
  const scroller = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const count = images.length;

  const go = (i: number) => {
    const el = scroller.current;
    if (!el) return;
    const target = Math.min(Math.max(i, 0), count - 1);
    el.scrollTo({ left: target * el.clientWidth, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  const onScroll = () => {
    const el = scroller.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <section aria-roledescription="carousel" aria-label={`Foto ${name}`} className="grid gap-3">
      <div className={`relative overflow-hidden rounded-card ${isPhoto ? "" : "bg-brand-soft/40"}`}>
        <ul
          ref={scroller}
          onScroll={onScroll}
          tabIndex={0}
          aria-live="polite"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") go(index + 1);
            if (e.key === "ArrowLeft") go(index - 1);
          }}
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((src, i) => (
            <li key={src} aria-roledescription="slide" aria-label={`${i + 1} dari ${count}`} className="relative aspect-square w-full shrink-0 snap-center">
              <Image
                src={src}
                alt={count > 1 ? `${name}, foto ${i + 1}` : name}
                fill
                priority={i === 0}
                sizes="(min-width: 768px) 50vw, 100vw"
                className={isPhoto ? "object-cover" : "object-contain p-10"}
              />
            </li>
          ))}
        </ul>

        {count > 1 && (
          <>
            <button type="button" aria-label="Foto sebelumnya" onClick={() => go(index - 1)} disabled={index === 0} className={`${arrow} left-2`}>
              ‹
            </button>
            <button type="button" aria-label="Foto berikutnya" onClick={() => go(index + 1)} disabled={index === count - 1} className={`${arrow} right-2`}>
              ›
            </button>
            <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-bold text-white" aria-hidden="true">
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        <ul className="flex gap-2 overflow-x-auto" aria-label="Pilih foto">
          {images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => go(i)}
                aria-label={`Lihat foto ${i + 1}`}
                aria-current={i === index}
                className={`relative block h-16 w-16 overflow-hidden rounded-lg border-2 ${i === index ? "border-brand" : "border-transparent opacity-70 hover:opacity-100"} ${isPhoto ? "" : "bg-brand-soft/40"}`}
              >
                <Image src={src} alt="" fill sizes="64px" className={isPhoto ? "object-cover" : "object-contain p-1"} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
