"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PackageOpen } from "lucide-react";

/** Tampilan kosong yang ramah (keranjang kosong, katalog kosong, dsb.) */
export function EmptyState({
  judul,
  deskripsi,
  aksiLabel,
  aksiHref,
}: {
  judul: string;
  deskripsi: string;
  aksiLabel?: string;
  aksiHref?: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-border/40 bg-card/30 px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        <PackageOpen className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
      </span>
      <h3 className="mt-4 text-base font-bold">{judul}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{deskripsi}</p>
      {aksiLabel && aksiHref && (
        <Button asChild className="mt-5 rounded-xl">
          <Link href={aksiHref}>{aksiLabel}</Link>
        </Button>
      )}
    </div>
  );
}
