const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export function formatRupiah(amount: number): string {
  // Intl menghasilkan "Rp 25.000" dengan spasi non-breaking; rapikan agar seragam dengan desain lama.
  return rupiah.format(amount).replace(/\s/g, "");
}

/** Tanggal dan jam dalam zona WIB agar sama di server maupun browser. */
export function formatDateTime(d: Date | string): string {
  return new Date(d).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });
}
