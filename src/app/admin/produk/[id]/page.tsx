import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminSkeleton } from "@/components/admin-skeleton";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "Ubah produk" };

export default function UbahProdukPage(props: PageProps<"/admin/produk/[id]">) {
  return (
    <>
      <Link href="/admin/produk" className="text-sm text-brand hover:underline">
        ← Semua produk
      </Link>
      <h1 className="mb-4 mt-2 text-3xl font-bold">Ubah produk</h1>
      <Suspense fallback={<AdminSkeleton />}>
        <Form params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function Form({ params, searchParams }: Pick<PageProps<"/admin/produk/[id]">, "params" | "searchParams">) {
  await requireAdmin();
  const { id } = await params;
  const { galat, tersimpan } = await searchParams;
  const [product, categories] = await Promise.all([db.product.findUnique({ where: { id } }), db.category.findMany({ orderBy: { name: "asc" } })]);
  if (!product) notFound();
  return <ProductForm product={product} categories={categories} error={typeof galat === "string" ? galat : undefined} saved={Boolean(tersimpan)} />;
}
