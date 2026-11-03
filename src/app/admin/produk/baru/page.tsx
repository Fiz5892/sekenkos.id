import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminSkeleton } from "@/components/admin-skeleton";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "Produk baru" };

export default function ProdukBaruPage(props: PageProps<"/admin/produk/baru">) {
  return (
    <>
      <Link href="/admin/produk" className="text-sm text-brand hover:underline">
        ← Semua produk
      </Link>
      <h1 className="mb-4 mt-2 text-3xl font-bold">Produk baru</h1>
      <Suspense fallback={<AdminSkeleton />}>
        <Form searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function Form({ searchParams }: Pick<PageProps<"/admin/produk/baru">, "searchParams">) {
  await requireAdmin();
  const { galat } = await searchParams;
  const categories = await db.category.findMany({ orderBy: { name: "asc" } });
  return <ProductForm categories={categories} error={typeof galat === "string" ? galat : undefined} />;
}
