import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminSkeleton } from "@/components/admin-skeleton";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { requireAdmin } from "@/lib/session";
import { markHandled } from "./actions";

export const metadata: Metadata = { title: "Pesan masuk" };

export default function AdminPesanPage() {
  return (
    <>
      <h1 className="mb-4 text-3xl font-bold">Pesan masuk</h1>
      <Suspense fallback={<AdminSkeleton />}>
        <Daftar />
      </Suspense>
    </>
  );
}

async function Daftar() {
  await requireAdmin();
  const messages = await db.message.findMany({ orderBy: [{ handled: "asc" }, { createdAt: "desc" }], take: 100 });
  if (messages.length === 0) return <p className="rounded-card bg-header p-8 text-center text-muted">Belum ada pesan.</p>;

  return (
    <ul className="grid gap-3">
      {messages.map((m) => (
        <li key={m.id} className={`rounded-card border p-4 ${m.handled ? "border-line opacity-70" : "border-brand"}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <b>{m.name}</b> · <a href={`mailto:${m.email}`} className="text-brand hover:underline">{m.email}</a>
            </div>
            <span className="text-sm text-muted">{formatDateTime(m.createdAt)}</span>
          </div>
          {/* Isi pesan dirender sebagai teks biasa oleh React (tidak ada HTML mentah). */}
          <p className="mt-2 whitespace-pre-wrap text-sm">{m.body}</p>
          <form action={markHandled} className="mt-3">
            <input type="hidden" name="id" value={m.id} />
            <input type="hidden" name="handled" value={m.handled ? "0" : "1"} />
            <button className="text-sm text-brand hover:underline">{m.handled ? "Tandai belum selesai" : "Tandai selesai"}</button>
          </form>
        </li>
      ))}
    </ul>
  );
}
