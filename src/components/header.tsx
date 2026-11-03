import Link from "next/link";
import { Suspense } from "react";
import { AccountMenu } from "@/components/account-menu";
import { cartCount } from "@/lib/cart";
import { readCart } from "@/lib/cart-server";
import { getSession } from "@/lib/session";
import { SITE } from "@/lib/site";

// Navbar sengaja ringkas: logo, pencarian, Produk, keranjang, dan akun. About/FAQ/Kontak ada di footer.
export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-header shadow-[0_4px_14px_rgba(0,0,0,.07)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:rounded focus:bg-white focus:px-3 focus:py-2"
      >
        Langsung ke konten
      </a>
      <div className="mx-auto flex w-[min(1240px,100%-32px)] flex-wrap items-center gap-x-4 gap-y-2 py-3 md:min-h-[72px] md:flex-nowrap">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label={`${SITE.name} — Beranda`}>
          <Logo />
          <span className="font-serif text-[22px] tracking-wide text-brand">
            sekenkos<span className="text-rock">.id</span>
          </span>
        </Link>

        <form
          action="/produk"
          role="search"
          className="order-last flex w-full overflow-hidden rounded-full border border-[#CBB9A4] bg-white focus-within:border-brand md:order-none md:mx-auto md:max-w-[420px] md:flex-1"
        >
          <input
            type="search"
            name="q"
            placeholder="Cari barang preloved…"
            aria-label="Cari produk"
            className="min-w-0 flex-1 bg-transparent px-4 py-2.5 outline-none"
          />
          <button type="submit" aria-label="Cari" className="px-3.5">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </form>

        <nav aria-label="Navigasi utama" className="ml-auto flex items-center gap-1 sm:gap-3 md:ml-0">
          <Link href="/produk" className="hidden rounded-full px-3 py-2 text-[15px] hover:bg-white/70 sm:block">
            Produk
          </Link>
          <Suspense fallback={<CartLink count={0} />}>
            <Cart />
          </Suspense>
          <Suspense fallback={<LoginLink />}>
            <Account />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}

// Membaca cookie/DB keranjang dan sesi (data per-pengunjung), jadi dibungkus <Suspense>.
async function Cart() {
  const session = await getSession();
  if ((session?.user as { role?: string })?.role === "ADMIN") return null;
  return <CartLink count={cartCount(await readCart())} />;
}

function CartLink({ count }: { count: number }) {
  return (
    <Link
      href="/keranjang"
      aria-label={count ? `Keranjang belanja, ${count} barang` : "Keranjang belanja"}
      className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-white/70"
    >
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
        <path d="M6 7h12l-1 14H7z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 9V6a3 3 0 016 0v3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
      {count > 0 && (
        <span key={count} aria-hidden="true" className="pop absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand px-1 text-[11px] font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}

function LoginLink() {
  return (
    <Link href="/masuk" className="rounded-full bg-foreground px-[18px] py-2 text-sm text-white hover:bg-black">
      Login
    </Link>
  );
}

async function Account() {
  const session = await getSession();
  if (!session) return <LoginLink />;
  const isAdmin = (session.user as { role?: string }).role === "ADMIN";
  return (
    <div className="flex items-center gap-2">
      {isAdmin && (
        <Link
          href="/admin"
          className="rounded-full bg-brand/10 px-3.5 py-1.5 text-xs font-bold text-brand hover:bg-brand/20"
        >
          Dashboard Admin
        </Link>
      )}
      <AccountMenu name={session.user.name} email={session.user.email} isAdmin={isAdmin} />
    </div>
  );
}

function Logo() {
  return (
    <svg viewBox="0 0 64 48" width="52" height="40" aria-hidden="true">
      <path d="M44 6c6-6 18-2 18 8 0 9-12 17-18 22" fill="none" stroke="#CBB9A4" strokeWidth="3" strokeLinecap="round" />
      <path d="M44 6c-4-4-10-3-13 1" fill="none" stroke="#CBB9A4" strokeWidth="3" strokeLinecap="round" />
      <rect x="6" y="20" width="10" height="16" rx="1" fill="#7F6853" />
      <rect x="18" y="12" width="14" height="24" rx="1" fill="#7F6853" />
      <rect x="20" y="15" width="10" height="9" fill="#E6DAC8" />
      <rect x="6" y="38" width="26" height="6" rx="1" fill="#7F6853" />
      <rect x="9" y="14" width="2" height="6" fill="#7F6853" />
      <path d="M40 38l4 4 6-7" fill="none" stroke="#CBB9A4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
