import Link from "next/link";

export function AccountTabs({ active }: { active: "profil" | "pesanan" }) {
  const tab = (on: boolean) => `rounded-full px-4 py-1.5 text-sm font-bold ${on ? "bg-foreground text-white" : "bg-header hover:bg-header-contrast"}`;
  return (
    <nav aria-label="Akun" className="mb-6 flex gap-2">
      <Link href="/akun" className={tab(active === "profil")} aria-current={active === "profil" ? "page" : undefined}>
        Profil
      </Link>
      <Link href="/akun/pesanan" className={tab(active === "pesanan")} aria-current={active === "pesanan" ? "page" : undefined}>
        Riwayat Pembelian
      </Link>
    </nav>
  );
}
