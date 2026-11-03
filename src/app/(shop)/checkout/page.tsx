import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { loadCart } from "@/lib/cart-server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <div className="mx-auto w-[min(1100px,100%-32px)] py-8">
      <h1 className="mb-6 text-3xl font-bold">Checkout</h1>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-card bg-header" aria-label="Memuat" />}>
        <Checkout />
      </Suspense>
    </div>
  );
}

async function Checkout() {
  const user = await requireUser("/checkout");
  if ((user as { role?: string }).role === "ADMIN") redirect("/admin");
  const { items, subtotal, buyableCount } = await loadCart();
  if (buyableCount === 0) redirect("/keranjang");

  const address = await db.address.findFirst({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });
  const saved = {
    recipient: address?.recipient ?? user.name,
    phone: address?.phone ?? "",
    street: address?.street ?? "",
    city: address?.city ?? "",
    zip: address?.zip ?? "",
  };

  return (
    <CheckoutForm
      subtotal={subtotal}
      saved={saved}
      items={items.filter((i) => i.qty > 0).map((i) => ({ id: i.product.id, name: i.product.name, qty: i.qty, price: i.product.price }))}
    />
  );
}
