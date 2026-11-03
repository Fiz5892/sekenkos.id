import type { Metadata } from "next";
import { Lato, Noto_Serif } from "next/font/google";
import { SITE } from "@/lib/site";
import "./globals.css";

const lato = Lato({ variable: "--font-lato", weight: ["400", "700"], subsets: ["latin"] });
const notoSerif = Noto_Serif({ variable: "--font-noto-serif", weight: ["400", "600", "700"], subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s | ${SITE.name}` },
  description:
    "sekenkos.id — toko barang preloved: pakaian, aksesori, dekorasi, perabot, dan perlengkapan kos.",
  openGraph: { siteName: `${SITE.name}`, locale: "id_ID", type: "website" },
};

// Layout akar hanya memuat font dan <html>. Tampilan toko (header/footer) ada di app/(shop)/layout.tsx,
// tampilan admin di app/admin/layout.tsx, sehingga keduanya tidak saling berbagi kerangka.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${lato.variable} ${notoSerif.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
