import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SITE } from "@/lib/site";
import { sendMessage } from "./actions";

export const metadata: Metadata = { title: "Hubungi kami", description: "Hubungi customer service sekenkos.id lewat WhatsApp, Instagram, email, atau formulir." };

const input = "w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-brand";

export default function KontakPage(props: PageProps<"/kontak">) {
  const wa = SITE.whatsapp;
  const contacts = [
    { label: "WhatsApp", value: `+${wa}`, href: `https://wa.me/${wa}` },
    { label: "Instagram", value: SITE.instagram, href: `https://instagram.com/${SITE.instagram.replace("@", "")}` },
    { label: "Email", value: SITE.email, href: `mailto:${SITE.email}` },
  ];
  return (
    <div className="mx-auto grid w-[min(1100px,100%-32px)] gap-10 py-10 md:grid-cols-2">
      <div>
        <h1 className="text-3xl font-semibold">Hubungi kami</h1>
        <p className="mt-2 text-muted">Ada kendala atau pertanyaan? Hubungi customer service kami lewat salah satu kanal berikut, atau kirim pesan lewat formulir.</p>
        <dl className="mt-6 grid gap-3">
          {contacts.map((c) => (
            <div key={c.label} className="flex justify-between gap-4 border-b border-line pb-2">
              <dt className="text-muted">{c.label}</dt>
              <dd>
                <a href={c.href} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                  {c.value}
                </a>
              </dd>
            </div>
          ))}
          <div className="flex justify-between gap-4 border-b border-line pb-2">
            <dt className="text-muted">Alamat</dt>
            <dd>{SITE.address}</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-muted">
          Lihat juga{" "}
          <Link href="/faq" className="text-brand underline">
            FAQ / Pertanyaan Umum
          </Link>
          .
        </p>
      </div>

      <section id="form" className="scroll-mt-24 rounded-card border border-line p-6">
        <h2 className="mb-4 text-xl font-bold">Kirim pesan</h2>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-header" aria-label="Memuat" />}>
          <Form searchParams={props.searchParams} />
        </Suspense>
      </section>
    </div>
  );
}

async function Form({ searchParams }: Pick<PageProps<"/kontak">, "searchParams">) {
  const params = await searchParams;
  return (
    <form action={sendMessage} className="grid gap-4">
      {params.terkirim && (
        <p role="status" className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
          Pesan terkirim. Untuk respons cepat, hubungi kami lewat WhatsApp atau Instagram.
        </p>
      )}
      {params.galat && (
        <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {params.galat === "batas" ? "Terlalu banyak pesan dalam waktu singkat. Coba lagi beberapa menit lagi." : "Periksa kembali isian: nama, email yang valid, dan pesan minimal 5 karakter."}
        </p>
      )}
      <label className="grid gap-1 text-sm">
        <span className="font-bold">Nama</span>
        <input name="name" required minLength={2} maxLength={80} autoComplete="name" className={input} />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-bold">Email</span>
        <input name="email" type="email" required maxLength={120} autoComplete="email" className={input} />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-bold">Pesan</span>
        <textarea name="body" required minLength={5} maxLength={2000} rows={4} className={input} />
      </label>
      {/* Jebakan bot: tersembunyi dari pengguna dan pembaca layar. */}
      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label>
          Jangan diisi
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <button className="w-fit rounded-full bg-foreground px-6 py-2.5 font-bold text-white hover:bg-black">Kirim</button>
    </form>
  );
}
