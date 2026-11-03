"use client";

export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="mx-auto grid w-[min(640px,100%-32px)] justify-items-center gap-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Ada kendala saat memuat halaman</h1>
      <p className="text-muted">Silakan coba lagi sebentar lagi. Jika terus terjadi, hubungi kami lewat WhatsApp.</p>
      <button onClick={() => retry()} className="rounded-full bg-foreground px-6 py-2.5 font-bold text-white hover:bg-black">
        Coba lagi
      </button>
    </div>
  );
}
