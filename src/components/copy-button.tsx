"use client";

import { useState } from "react";

export function CopyButton({ text, label = "Salin" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard ditolak browser (mis. bukan HTTPS): biarkan pengguna menyalin manual dari teksnya.
        }
      }}
      className="rounded-full border border-line bg-white px-3 py-1 text-xs font-bold hover:border-brand hover:text-brand"
      aria-live="polite"
    >
      {copied ? "Tersalin ✓" : label}
    </button>
  );
}
