"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Tombol pengatur jumlah: [-] 3 [+] — dipakai di kartu produk & keranjang */
export function QtyStepper({
  qty,
  onChange,
  min = 0,
  max = 99,
  kecil = false,
}: {
  qty: number;
  onChange: (qty: number) => void;
  min?: number;
  max?: number;
  kecil?: boolean;
}) {
  const ukuran = kecil ? "h-8 w-8" : "h-9 w-9";

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-white p-1 shadow-sm">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onChange(Math.max(min, qty - 1))}
        disabled={qty <= min}
        className={`${ukuran} rounded-full text-primary hover:bg-pink-50 hover:text-primary`}
        aria-label="Kurangi jumlah"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span
        className={`min-w-7 text-center font-bold ${kecil ? "text-sm" : "text-base"}`}
        aria-live="polite"
      >
        {qty}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onChange(Math.min(max, qty + 1))}
        disabled={qty >= max}
        className={`${ukuran} rounded-full text-primary hover:bg-pink-50 hover:text-primary`}
        aria-label="Tambah jumlah"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
