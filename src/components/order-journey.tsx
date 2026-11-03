"use client";

import { useEffect, useRef } from "react";

/*
 * "Cara belanja": tiap langkah punya adegan kecil yang diputar bergiliran (siklus 10 detik, 2,5 detik per
 * langkah), dihubungkan garis progres yang terisi saat langkah selesai.
 *   1. Pilih barang  — kaca pembesar memeriksa baju, lalu muncul centang.
 *   2. Checkout      — struk tercetak, jam berputar (stok ditahan 24 jam).
 *   3. Transfer      — koin masuk ke HP, lalu balasan chat muncul.
 *   4. Kami kirim    — truk melaju masuk, jalanan bergerak, penanda tujuan muncul.
 *
 * Semua gerak adalah animasi CSS pada transform/opacity elemen HTML (globals.css: .jr-*, .sc*), jadi dikerjakan
 * GPU. Tidak ada elemen yang bergeser keluar kotaknya, sehingga halaman tidak melebar. Saat tidak terlihat di
 * layar animasi dijeda dan adegan tampil sebagai ilustrasi diam.
 */
export function OrderJourney({ steps }: { steps: readonly (readonly [string, string])[] }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => el.toggleAttribute("data-playing", entry.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={root} className="journey">
      <ol className="grid gap-8 md:grid-cols-4 md:gap-6">
        {steps.map(([title, body], i) => (
          <li
            key={title}
            className="relative grid grid-cols-[104px_1fr] items-start gap-4 md:block md:text-center"
            style={{ "--i": i } as React.CSSProperties}
          >
            {i < steps.length - 1 && (
              <>
                <span aria-hidden="true" className="absolute left-[calc(50%+76px)] right-[calc(-50%+52px)] top-[67px] hidden h-0.5 overflow-hidden rounded bg-line md:block">
                  <span className={`jr jr-fill-x-${i} absolute inset-0 origin-left bg-brand`} />
                </span>
                <span aria-hidden="true" className="absolute -bottom-6 left-[51px] top-[112px] w-0.5 overflow-hidden rounded bg-line md:hidden">
                  <span className={`jr jr-fill-y-${i} absolute inset-0 origin-top bg-brand`} />
                </span>
              </>
            )}

            <div aria-hidden="true" className="relative h-[104px] w-[104px] md:mx-auto md:h-[136px] md:w-[136px]">
              <span className="jr jr-lit absolute -inset-1.5 rounded-full border-2 border-brand" />
              <div className="absolute inset-0 overflow-hidden rounded-full bg-header-contrast">
                <div className="absolute left-0 top-0 h-[136px] w-[136px] origin-top-left scale-[0.765] md:scale-100">
                  <Scene i={i} />
                </div>
              </div>
            </div>

            <div className="md:mt-4">
              <span className="block font-serif text-sm text-rock">0{i + 1}</span>
              <h3 className="relative inline-block text-lg font-semibold">
                {title}
                <span aria-hidden="true" className="jr jr-bar absolute -bottom-0.5 left-0 h-0.5 w-full origin-left rounded bg-brand" />
              </h3>
              <p className="mt-1 text-sm text-muted md:mx-auto md:max-w-[240px]">{body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

const ink = "#2e2620";
const brand = "#7f6853";

function Check({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Adegan 136×136 untuk tiap langkah; tiap bagian yang bergerak adalah elemen terpisah. */
function Scene({ i }: { i: number }) {
  if (i === 0)
    return (
      <>
        <svg className="absolute left-[30px] top-[38px]" viewBox="0 0 76 66" width="76" height="66">
          <path d="M24 4 10 10 2 26l12 6 4-6v36h40V26l4 6 12-6-8-16-14-6c-3 6-8 9-14 9s-11-3-14-9z" fill="#faf9f6" stroke={brand} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M30 30h16M30 38h10" stroke="#cbb9a4" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <svg className="jr sc0-mag absolute left-[64px] top-[18px]" viewBox="0 0 44 44" width="44" height="44">
          <circle cx="17" cy="17" r="11" fill="rgb(255 255 255 / .45)" stroke={ink} strokeWidth="3" />
          <path d="M25 25l12 12" stroke={ink} strokeWidth="4.5" strokeLinecap="round" />
        </svg>
        <span className="jr sc-pop-late absolute left-[84px] top-[84px] grid h-7 w-7 place-items-center rounded-full bg-brand">
          <Check />
        </span>
      </>
    );

  if (i === 1)
    return (
      <>
        <span className="absolute left-[28px] top-[30px] h-[10px] w-[80px] rounded-full bg-foreground" />
        <div className="absolute left-[38px] top-[36px] h-[70px] w-[60px] overflow-hidden">
          <svg className="jr sc1-print absolute inset-0" viewBox="0 0 60 70" width="60" height="70">
            <path d="M2 0h56v62l-7 6-7-6-7 6-7-6-7 6-7-6-7 6-7-6z" fill="#fff" />
            <path d="M12 14h36M12 23h26M12 32h30" stroke="#cbb9a4" strokeWidth="3" strokeLinecap="round" />
            <path d="M12 46h18" stroke={brand} strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>
        <span className="jr sc-pop-late absolute left-[84px] top-[76px] grid h-10 w-10 place-items-center rounded-full border-2 border-brand bg-white">
          <span className="absolute left-1/2 top-[9px] h-[11px] w-0.5 -translate-x-1/2 rounded bg-foreground/40" />
          <span className="jr sc1-tick absolute bottom-1/2 left-1/2 -ml-px h-[13px] w-0.5 origin-bottom rounded bg-foreground" />
          <span className="absolute h-1.5 w-1.5 rounded-full bg-brand" />
        </span>
      </>
    );

  if (i === 2)
    return (
      <>
        <svg className="absolute left-[22px] top-[30px]" viewBox="0 0 50 84" width="50" height="84">
          <rect x="1" y="1" width="48" height="82" rx="9" fill={ink} />
          <rect x="5" y="9" width="40" height="64" rx="3" fill="#faf9f6" />
          <rect x="18" y="77" width="14" height="2.5" rx="1.25" fill="#a48d78" />
        </svg>
        <span className="jr sc2-coin absolute left-[34px] top-[8px] grid h-[26px] w-[26px] place-items-center rounded-full border-2 border-[#e6dac8] bg-rock text-[9px] font-bold text-white">
          Rp
        </span>
        <span className="jr sc-pop-mid absolute left-[68px] top-[42px] grid h-[24px] w-[50px] origin-bottom-left content-center gap-1 rounded-xl rounded-bl-sm bg-brand px-2.5">
          <span className="h-[3px] w-full rounded bg-white/80" />
          <span className="h-[3px] w-2/3 rounded bg-white/80" />
        </span>
        <span className="jr sc-pop-late absolute left-[60px] top-[72px] grid h-[24px] w-[56px] origin-bottom-right place-items-center rounded-xl rounded-br-sm bg-white text-[11px] font-bold tracking-tighter text-brand">
          ✓✓ Lunas
        </span>
      </>
    );

  return (
    <>
      <span className="jr sc3-road absolute bottom-[34px] left-0 h-[3px] w-[272px] bg-[repeating-linear-gradient(90deg,#a48d78_0_9px,transparent_9px_17px)]" />
      <span className="jr sc3-lines absolute left-[6px] top-[66px] grid gap-1.5">
        <span className="h-[3px] w-5 rounded bg-rock" />
        <span className="ml-2 h-[3px] w-4 rounded bg-rock" />
        <span className="h-[3px] w-6 rounded bg-rock" />
      </span>
      <svg className="jr sc3-drive absolute left-[26px] top-[50px]" viewBox="0 0 86 54" width="86" height="54">
        <rect x="2" y="6" width="50" height="34" rx="3" fill="#cbb9a4" stroke={brand} strokeWidth="1.8" />
        <path d="M22 6v12M32 6v12" stroke="#e6dac8" strokeWidth="3" />
        <path d="M52 16h17l11 12v12H52z" fill={brand} />
        <path d="M57 20h10l7 8H57z" fill="#e6dac8" />
        <circle cx="18" cy="44" r="7" fill={ink} />
        <circle cx="18" cy="44" r="2.5" fill="#e6dac8" />
        <circle cx="66" cy="44" r="7" fill={ink} />
        <circle cx="66" cy="44" r="2.5" fill="#e6dac8" />
      </svg>
      <span className="jr sc-pop-late absolute left-[98px] top-[18px] origin-bottom">
        <svg viewBox="0 0 24 30" width="24" height="30">
          <path d="M12 29s10-10 10-17A10 10 0 0 0 2 12c0 7 10 17 10 17z" fill={brand} />
          <circle cx="12" cy="12" r="4" fill="#faf9f6" />
        </svg>
      </span>
    </>
  );
}
