"use client";

import { useStore } from "@/context/StoreContext";

/** Pil kecil status toko: BUKA (mint) / TUTUP (peach kemerahan) */
export function StatusBadge({ className = "" }: { className?: string }) {
  const { settings, loading } = useStore();
  const buka = settings?.is_open ?? false;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
        buka
          ? "border-teal-200 bg-teal-50 text-teal-700"
          : "border-rose-200 bg-rose-50 text-rose-600"
      } ${className}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          buka ? "bg-teal-500 animate-pulse" : "bg-rose-400"
        }`}
      />
      {loading ? "Memuat..." : buka ? "Pemesanan DIBUKA" : "Pemesanan TUTUP"}
    </span>
  );
}
