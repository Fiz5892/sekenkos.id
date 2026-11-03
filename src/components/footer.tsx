import Link from "next/link";
import { SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-16 bg-header">
      <div className="mx-auto grid w-[min(1224px,100%-32px)] gap-8 py-10 sm:grid-cols-[2fr_1fr_1fr]">
        <div>
          <div className="font-serif text-2xl text-brand">{SITE.name}</div>
          <p className="mt-2 max-w-sm text-sm text-muted">
            {SITE.tagline}. Barang preloved pilihan, harga bersahabat untuk anak kos dan siapa saja.
          </p>
        </div>
        <FooterLinks
          title="Belanja"
          links={[
            { href: "/produk", label: "Semua produk" },
            { href: "/keranjang", label: "Keranjang" },
            { href: "/lacak", label: "Lacak pesanan" },
          ]}
        />
        <FooterLinks
          title="Bantuan"
          links={[
            { href: "/tentang", label: "Tentang kami" },
            { href: "/kontak", label: "Hubungi kami" },
            { href: "/faq", label: "FAQ" },
            { href: "/syarat", label: "Syarat & Ketentuan" },
            { href: "/privasi", label: "Kebijakan Privasi" },
          ]}
        />
      </div>
      <div className="border-t border-header-contrast/50 py-4 text-center text-xs text-muted">© {SITE.name} · {SITE.address}</div>
    </footer>
  );
}

function FooterLinks({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-bold">{title}</h2>
      <ul className="grid gap-1 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="hover:underline">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
