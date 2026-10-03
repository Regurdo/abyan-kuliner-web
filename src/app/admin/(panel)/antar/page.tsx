"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamicImport from "next/dynamic";
import Link from "next/link";
import { Bike, CheckCircle2, Download, Lightbulb, Loader2, Map, MapPinOff, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BadgeStatusBayar, BadgeStatusPesanan } from "@/components/admin/Badge";
import { createClient } from "@/lib/supabase/client";
import { buatLinkWa, formatRupiah, formatTanggal } from "@/lib/format";
import type { OrderStatus, PaymentStatus } from "@/lib/types";
import { toast } from "sonner";
import type { TitikAntar } from "@/components/admin/PetaAntar";

// Peta hanya dirender di browser (Leaflet butuh window)
const PetaAntar = dynamicImport(() => import("@/components/admin/PetaAntar"), {
  ssr: false,
  loading: () => <div className="h-80 animate-pulse rounded-2xl bg-muted sm:h-96" />,
});

/**
 * REKAP PENGANTARAN — untuk membantu ibu mengantar kue:
 * pilih batch PO -> lihat SEMUA lokasi pembeli di satu peta (PIN bernomor),
 * daftar alamat urut, tombol rute Google Maps, unduh CSV, dan cetak.
 */

interface BatchRow {
  id: string;
  name: string;
  ready_date: string;
  is_active: boolean;
}

interface PesananAntar extends TitikAntar {
  lat: number | null;
  lng: number | null;
  notes: string;
  payment_method: string;
  payment_status: PaymentStatus;
  status: OrderStatus;
}

export default function HalamanAntar() {
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [batchId, setBatchId] = useState<string>("");
  const [pesanan, setPesanan] = useState<PesananAntar[]>([]);
  const [memuat, setMemuat] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("batches")
          .select("id, name, ready_date, is_active")
          .order("created_at", { ascending: false })
          .limit(30);
        if (error) throw error;
        const daftar = (data ?? []) as BatchRow[];
        setBatches(daftar);
        const aktif = daftar.find((b) => b.is_active);
        if (aktif) setBatchId(aktif.id);
      } catch {
        toast.error("Gagal memuat daftar batch.");
      }
    })();
  }, []);

  const muatPesanan = useCallback(async (id: string) => {
    if (!id) return;
    setMemuat(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, code, customer_name, customer_whatsapp, address_text, lat, lng, notes, payment_method, payment_status, status, total"
        )
        .eq("batch_id", id)
        .neq("status", "dibatalkan")
        .order("created_at", { ascending: true });
      if (error) throw error;
      setPesanan((data ?? []) as PesananAntar[]);
    } catch {
      toast.error("Gagal memuat pesanan batch ini.");
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    void muatPesanan(batchId);
  }, [batchId, muatPesanan]);

  // Pisahkan: ada pin vs tidak ada koordinat
  const denganPin = useMemo(() => pesanan.filter((p) => p.lat != null && p.lng != null), [pesanan]);
  const tanpaPin = useMemo(() => pesanan.filter((p) => p.lat == null || p.lng == null), [pesanan]);
  const batchDipilih = batches.find((b) => b.id === batchId);

  /* ===== Unduh CSV (bisa dibuka di Excel) ===== */
  function unduhCsv() {
    const header = ["No", "Kode", "Nama", "WhatsApp", "Alamat", "Metode", "Status Bayar", "Total", "Catatan", "Lat", "Lng"];
    const baris = pesanan.map((p, i) => [
      String(i + 1),
      p.code,
      p.customer_name,
      p.customer_whatsapp,
      p.address_text.replace(/\s+/g, " "),
      p.payment_method === "cod" ? "COD" : "Transfer",
      p.payment_status,
      String(p.total),
      (p.notes ?? "").replace(/\s+/g, " "),
      p.lat != null ? String(p.lat) : "",
      p.lng != null ? String(p.lng) : "",
    ]);
    // BOM UTF-8 supaya Excel membaca dengan benar
    const csv =
      "\uFEFF" +
      [header, ...baris]
        .map((r) => r.map((c) => `"${c.replaceAll('"', '""')}"`).join(","))
        .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const slug = (batchDipilih?.name ?? "batch").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    a.href = url;
    a.download = `pengantaran-${slug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("File CSV diunduh");
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      {/* ===== Judul + aksi (tidak ikut tercetak) ===== */}
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Bike className="h-6 w-6" /> Rekap Pengantaran</h1>
          <p className="text-sm text-muted-foreground">
            Semua lokasi pembeli di satu peta — plus daftar alamat, CSV, dan cetak.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={unduhCsv}
            disabled={pesanan.length === 0}
            variant="secondary"
            className="rounded-2xl font-semibold"
          >
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button
            onClick={() => window.print()}
            disabled={pesanan.length === 0}
            className="rounded-2xl font-semibold"
          >
            <Printer className="h-4 w-4" /> Cetak
          </Button>
        </div>
      </div>

      {/* ===== Pilih batch ===== */}
      <div className="print:hidden">
        <label htmlFor="pilih-batch-antar" className="text-xs font-semibold text-muted-foreground">
          Pilih Batch PO
        </label>
        <select
          id="pilih-batch-antar"
          value={batchId}
          onChange={(e) => setBatchId(e.target.value)}
          className="mt-1 h-11 w-full rounded-2xl border border-border bg-card px-3 text-sm font-semibold outline-none focus:border-primary sm:max-w-md"
        >
          {batches.length === 0 && <option value="">Belum ada batch</option>}
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} {b.is_active ? "(aktif)" : ""} — siap {formatTanggal(b.ready_date)}
            </option>
          ))}
        </select>
      </div>

      <div className="hidden print:block">
        <h2 className="text-lg font-bold">Daftar Pengantaran — {batchDipilih?.name ?? "-"}</h2>
        <p className="text-sm">Dicetak: {formatTanggal(new Date())}</p>
      </div>

      {memuat ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : pesanan.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <p className="text-4xl"><Map className="h-10 w-10 mx-auto" /></p>
          <p className="mt-2 font-semibold">Belum ada pesanan di batch ini</p>
        </div>
      ) : (
        <>
          {/* ===== Peta semua lokasi ===== */}
          <div className="print:hidden">
            <PetaAntar titik={denganPin.map((p) => ({ ...p, lat: p.lat as number, lng: p.lng as number }))} />
            <p className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1">
              <Lightbulb className="h-3 w-3" /> Klik pin nomor untuk melihat alamat & tombol rute. Geser/zoom peta bebas.
            </p>
          </div>

          {/* ===== Daftar alamat bernomor (nomor = nomor pin) ===== */}
          <div className="overflow-hidden rounded-3xl border border-border bg-card">
            <div className="border-b border-border/60 bg-pinksoft/30 px-4 py-3">
              <h2 className="font-bold">Daftar Alamat ({pesanan.length} tujuan)</h2>
            </div>
            <div className="divide-y divide-border/40">
              {denganPin.map((p, i) => (
                <div key={p.id} className="flex items-start gap-3 px-4 py-3 text-sm">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {p.customer_name}{" "}
                      <span className="text-xs font-normal text-muted-foreground">· {p.code}</span>
                    </p>
                    <p className="text-muted-foreground">{p.address_text}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <BadgeStatusPesanan status={p.status} />
                      <BadgeStatusBayar status={p.payment_status} />
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold">
                        {p.payment_method === "cod" ? "COD" : "Transfer"} · {formatRupiah(p.total)}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1.5 print:hidden">
                    <Button asChild size="sm" variant="secondary" className="rounded-xl font-semibold">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Rute
                      </a>
                    </Button>
                    <Button asChild size="sm" variant="ghost" className="rounded-xl font-semibold text-emerald-700 hover:bg-emerald-50">
                      <a href={buatLinkWa(p.customer_whatsapp, `Halo ${p.customer_name}! Pesanan ${p.code} mau kami antar ya.`)} target="_blank" rel="noopener noreferrer">
                        WA
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ===== Pesanan tanpa koordinat ===== */}
          {tanpaPin.length > 0 && (
            <div className="overflow-hidden rounded-3xl border border-amber-300 bg-amber-50">
              <div className="flex items-center gap-2 border-b border-amber-200 px-4 py-3">
                <MapPinOff className="h-4 w-4 text-amber-600" />
                <h2 className="font-bold text-amber-800">Tanpa Pin Lokasi ({tanpaPin.length})</h2>
              </div>
              <div className="divide-y divide-amber-100">
                {tanpaPin.map((p) => (
                  <div key={p.id} className="px-4 py-3 text-sm">
                    <p className="font-semibold">
                      {p.customer_name}{" "}
                      <span className="text-xs font-normal text-muted-foreground">· {p.code}</span>
                    </p>
                    <p className="text-muted-foreground">{p.address_text || "(alamat kosong)"}</p>
                    <div className="mt-1 print:hidden">
                      <Link href={`/admin/pesanan/${p.id}`} className="text-xs font-semibold text-primary underline">
                        Buka detail pesanan →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
