"use client";

export default function AdminError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="grid justify-items-start gap-3 rounded-card border border-line bg-white p-8">
      <h1 className="text-xl font-bold">Terjadi kendala di panel admin</h1>
      <p className="text-sm text-muted">Coba muat ulang. Jika terus terjadi, periksa log server.</p>
      <button onClick={() => retry()} className="rounded-full bg-foreground px-5 py-2 font-bold text-white hover:bg-black">
        Coba lagi
      </button>
    </div>
  );
}
