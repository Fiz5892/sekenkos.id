export type Totals = { subtotal: number; discount: number; shipping: number; total: number };

/** Semua nilai rupiah bulat. Diskon dibulatkan ke rupiah terdekat dan tak pernah melebihi subtotal. */
export function calcTotals(subtotal: number, shipping: number, promoPercent = 0): Totals {
  const percent = Math.min(Math.max(promoPercent, 0), 100);
  const discount = Math.min(Math.round((subtotal * percent) / 100), subtotal);
  return { subtotal, discount, shipping, total: subtotal - discount + shipping };
}
