type AddressParts = {
  street: string;
  village?: string | null;
  district?: string | null;
  city: string;
  province?: string | null;
  zip: string;
};

/**
 * Alamat satu baris, dari yang paling spesifik ke umum. Bagian kosong dilewati sehingga pesanan lama
 * (yang belum punya desa/kecamatan/provinsi) tetap tampil rapi.
 */
export function formatAddress(a: AddressParts): string {
  const area = [a.village, a.district && `Kec. ${a.district}`, a.city, a.province].filter(Boolean).join(", ");
  return [a.street, area].filter(Boolean).join(", ") + (a.zip ? ` ${a.zip}` : "");
}
