"use client";

import { CalendarClock, MessageCircle, Rocket, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/context/StoreContext";
import { buatLinkWa, formatTanggal, formatTanggalWaktu } from "@/lib/format";
import { Countdown } from "./Countdown";

/**
 * Kartu status pemesanan di bawah banner:
 * - BUKA  : info batch aktif + hitung mundur batas pemesanan
 * - TUTUP : pesan ramah + tombol WhatsApp
 * - Mode contoh: petunjuk menghubungkan Supabase
 */
export function StoreBanner() {
  const { settings, batch, loading, error, configured } = useStore();
  const buka = settings?.is_open ?? false;

  // Mode contoh (kunci .env.local belum diisi)
  if (!configured) {
    return (
      <div className="relative overflow-hidden rounded-3xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 text-sm text-amber-800">
        <div aria-hidden className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-amber-200/30 blur-xl" />
        <p className="font-bold">Mode Contoh</p>
        <p className="mt-1 leading-relaxed">
          Kunci Supabase belum diisi di file{" "}
          <code className="rounded bg-amber-100 px-1">.env.local</code>.
          Tampilan masih memakai data contoh. Isi kuncinya untuk menghubungkan toko
          sungguhan.
        </p>
      </div>
    );
  }

  if (loading) {
    return <div className="h-44 animate-pulse rounded-3xl bg-muted/70" />;
  }

  if (error) {
    return (
      <div className="relative overflow-hidden rounded-3xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-orange-50 p-5 text-sm text-rose-700">
        <div aria-hidden className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-rose-200/30 blur-xl" />
        <p className="font-bold">Yah, datanya gagal dimuat</p>
        <p className="mt-1">{error}</p>
      </div>
    );
  }

  // TOKO BUKA — tampilkan info batch + countdown
  if (buka && batch) {
    const deadlineLewat = new Date(batch.order_deadline).getTime() < Date.now();
    return (
      <div className="relative overflow-hidden rounded-3xl border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50 p-5 sm:p-6">
        <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-teal-200/30 blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-6 left-1/3 h-20 w-20 rounded-full bg-emerald-200/20 blur-xl" />
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-600 px-3 py-1 text-xs font-bold text-white">
            <Rocket className="h-3.5 w-3.5" /> Pemesanan DIBUKA
          </span>
          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-teal-800">
            {batch.name}
          </span>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-white/70 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-teal-700">
              <CalendarClock className="h-4 w-4" /> Kue siap / diantar
            </p>
            <p className="mt-0.5 text-sm font-bold">
              {formatTanggal(batch.ready_date)}
            </p>
          </div>
          <div className="rounded-xl bg-white/70 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-teal-700">
              <CalendarClock className="h-4 w-4" /> Batas akhir pesan
            </p>
            <p className="mt-0.5 text-sm font-bold">
              {formatTanggalWaktu(batch.order_deadline)}
            </p>
          </div>
        </div>

        <div className="mt-4">
          {!deadlineLewat ? (
            <>
              <p className="mb-2 text-xs font-semibold text-teal-800">
                Sisa waktu pemesanan:
              </p>
              <Countdown deadlineIso={batch.order_deadline} />
            </>
          ) : (
            <p className="text-sm font-semibold text-rose-600">
              Batas pemesanan batch ini sudah lewat. Tunggu batch berikutnya ya!
            </p>
          )}
        </div>
      </div>
    );
  }

  // TOKO TUTUP
  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-orange-50 p-5 sm:p-6">
      <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-rose-200/30 blur-2xl" />
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-3 py-1 text-xs font-bold text-white">
        <XCircle className="h-3.5 w-3.5" /> Pemesanan TUTUP
      </span>
      <p className="mt-3 text-sm leading-relaxed text-foreground/80">
        Ibu sedang tidak membuka pemesanan. Tenang, katalog tetap bisa dilihat
        kok — kamu juga bisa bertanya kapan buka batch berikutnya lewat WhatsApp.
      </p>
      {settings?.whatsapp_number && (
        <Button asChild className="mt-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold">
          <a
            href={buatLinkWa(
              settings.whatsapp_number,
              `Halo ${settings.store_name}! Kapan dibuka pemesanan batch berikutnya ya?`
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle className="h-4 w-4" /> Hubungi via WhatsApp
          </a>
        </Button>
      )}
    </div>
  );
}
