import { randomInt } from "node:crypto";

// Tanpa huruf/angka yang mudah tertukar (0/O, 1/I) karena kode diketik ulang oleh pembeli.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateOrderCode(): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return `PLY-${s}`;
}

/** Menerima input pengguna ("ply-7k3m9q", " PLY7K3M9Q ") dan menormalkannya; null bila bukan bentuk kode. */
export function normalizeOrderCode(input: string): string | null {
  const raw = input.trim().toUpperCase().replace(/^PLY-?/, "");
  return /^[A-HJ-NP-Z2-9]{6}$/.test(raw) ? `PLY-${raw}` : null;
}
