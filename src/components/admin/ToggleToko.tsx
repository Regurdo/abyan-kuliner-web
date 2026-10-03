"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PowerOff, Power } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

/** Saklar BUKA / TUTUP pemesanan (tabel store_settings.is_open) */
export function ToggleToko({ awal }: { awal: boolean }) {
  const router = useRouter();
  const [buka, setBuka] = useState(awal);
  const [proses, mulaiProses] = useTransition();

  function ganti(nilaiBaru: boolean) {
    mulaiProses(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("store_settings")
        .update({ is_open: nilaiBaru })
        .eq("id", 1);
      if (error) {
        toast.error("Gagal mengubah status toko. Coba lagi ya.");
        return;
      }
      setBuka(nilaiBaru);
      toast.success(
        nilaiBaru
          ? "Pemesanan DIBUKA! Pembeli sudah bisa checkout"
          : "Pemesanan DITUTUP. Katalog masih bisa dilihat."
      );
      router.refresh();
    });
  }

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-3xl border p-4 ${
        buka ? "border-teal-200 bg-teal-50" : "border-rose-200 bg-rose-50"
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm font-bold">
          {buka ? "Pemesanan SEDANG BUKA" : "Pemesanan SEDANG TUTUP"}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {buka
            ? "Pembeli bisa checkout di website sekarang."
            : "Buka saat siap menerima pesanan batch berikutnya."}
        </p>
      </div>

      <button
        onClick={() => ganti(!buka)}
        disabled={proses}
        className={`relative h-9 w-16 shrink-0 rounded-full transition-colors ${
          buka ? "bg-teal-500" : "bg-rose-400"
        }`}
        role="switch"
        aria-checked={buka}
        aria-label={buka ? "Tutup pemesanan" : "Buka pemesanan"}
      >
        <span
          className={`absolute top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow transition-all ${
            buka ? "left-8" : "left-1"
          }`}
        >
          {proses ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          ) : buka ? (
            <Power className="h-3.5 w-3.5 text-teal-600" />
          ) : (
            <PowerOff className="h-3.5 w-3.5 text-rose-500" />
          )}
        </span>
      </button>
    </div>
  );
}
