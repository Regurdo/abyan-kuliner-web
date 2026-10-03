"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CakeSlice, ChefHat, Loader2, PackageOpen, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BadgeStatusBayar } from "@/components/admin/Badge";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah, formatTanggal } from "@/lib/format";
import type { OrderStatus, PaymentStatus } from "@/lib/types";
import { toast } from "sonner";

/**
 * REKAP PRODUKSI — untuk membantu ibu di dapur:
 * pilih batch PO -> lihat total kue yang harus dibuat per jenis,
 * siapa saja pemesannya, dan daftar pesanan untuk dicocokkan.
 * Bisa dicetak jadi catatan dapur (tombol Cetak).
 */

interface BatchRow {
  id: string;
  name: string;
  ready_date: string;
  is_active: boolean;
}

interface PesananRekap {
  id: string;
  code: string;
  customer_name: string;
  status: OrderStatus;
  payment_method: string;
  payment_status: PaymentStatus;
  total: number;
  order_items: { product_name: string; quantity: number; subtotal: number }[];
}

interface AgregatProduk {
  nama: string;
  qty: number;
  omzet: number;
  pembeli: { nama: string; qty: number }[];
}

export default function HalamanRekap() {
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [batchId, setBatchId] = useState<string>("");
  const [pesanan, setPesanan] = useState<PesananRekap[]>([]);
  const [memuat, setMemuat] = useState(true);

  // Muat daftar batch, pilih batch aktif secara default
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
          "id, code, customer_name, status, payment_method, payment_status, total, order_items(product_name, quantity, subtotal)"
        )
        .eq("batch_id", id)
        .neq("status", "dibatalkan") // pesanan batal tidak ikut rekap
        .order("created_at", { ascending: true });
      if (error) throw error;
      setPesanan((data ?? []) as PesananRekap[]);
    } catch {
      toast.error("Gagal memuat pesanan batch ini.");
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    void muatPesanan(batchId);
  }, [batchId, muatPesanan]);

  // Agregasi: total kue per jenis + daftar pemesan
  const rekap = useMemo<AgregatProduk[]>(() => {
    const map = new Map<string, AgregatProduk>();
    for (const p of pesanan) {
      for (const item of p.order_items) {
        const ada = map.get(item.product_name) ?? {
          nama: item.product_name,
          qty: 0,
          omzet: 0,
          pembeli: [],
        };
        ada.qty += item.quantity;
        ada.omzet += item.subtotal;
        ada.pembeli.push({ nama: p.customer_name, qty: item.quantity });
        map.set(item.product_name, ada);
      }
    }
    return [...map.values()].sort((a, b) => b.qty - a.qty);
  }, [pesanan]);

  const totalKue = useMemo(() => rekap.reduce((s, r) => s + r.qty, 0), [rekap]);
  const omzet = useMemo(() => pesanan.reduce((s, p) => s + p.total, 0), [pesanan]);
  const batchDipilih = batches.find((b) => b.id === batchId);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      {/* ===== Judul + kontrol (tidak ikut tercetak) ===== */}
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ChefHat className="h-6 w-6" /> Rekap Produksi</h1>
          <p className="text-sm text-muted-foreground">
            Total kue yang harus dibuat per jenis — siap dicetak untuk catatan dapur.
          </p>
        </div>
        <Button
          onClick={() => window.print()}
          disabled={pesanan.length === 0}
          className="rounded-2xl font-semibold"
        >
          <Printer className="h-4 w-4" /> Cetak
        </Button>
      </div>

      {/* ===== Pilih batch ===== */}
      <div className="print:hidden">
        <label htmlFor="pilih-batch" className="text-xs font-semibold text-muted-foreground">
          Pilih Batch PO
        </label>
        <select
          id="pilih-batch"
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

      {/* Kartu judul yang hanya muncul saat dicetak */}
      <div className="hidden print:block">
        <h2 className="text-lg font-bold">Rekap Produksi — {batchDipilih?.name ?? "-"}</h2>
        <p className="text-sm">Dibuat: {formatTanggal(new Date())}</p>
      </div>

      {memuat ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : pesanan.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <p className="text-4xl"><PackageOpen className="h-10 w-10 mx-auto text-muted-foreground" /></p>
          <p className="mt-2 font-semibold">Belum ada pesanan di batch ini</p>
          <p className="text-sm text-muted-foreground">
            Rekap akan terisi otomatis begitu ada pesanan masuk.
          </p>
        </div>
      ) : (
        <>
          {/* ===== Ringkasan ===== */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-3xl border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold text-primary">{pesanan.length}</p>
              <p className="text-xs text-muted-foreground">Pesanan aktif</p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold text-primary">{totalKue}</p>
              <p className="text-xs text-muted-foreground">Kue dipesan</p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-4 text-center">
              <p className="text-xl font-bold text-primary">{formatRupiah(omzet)}</p>
              <p className="text-xs text-muted-foreground">Nilai pesanan</p>
            </div>
          </div>

          {/* ===== Tabel rekap per kue ===== */}
          <div className="overflow-hidden rounded-3xl border border-border bg-card">
            <div className="border-b border-border/60 bg-pinksoft/30 px-4 py-3">
              <h2 className="font-bold flex items-center gap-2"><CakeSlice className="h-5 w-5" /> Yang Harus Dibuat</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
                    <th className="px-4 py-2.5">Kue</th>
                    <th className="px-4 py-2.5 text-center">Jumlah</th>
                    <th className="hidden px-4 py-2.5 sm:table-cell">Siapa saja yang pesan</th>
                  </tr>
                </thead>
                <tbody>
                  {rekap.map((r) => (
                    <tr key={r.nama} className="border-b border-border/40 last:border-0">
                      <td className="px-4 py-3 font-semibold">{r.nama}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block min-w-10 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground">
                          {r.qty}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                        {r.pembeli.map((p) => `${p.nama} ×${p.qty}`).join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ===== Daftar pesanan ===== */}
          <div className="overflow-hidden rounded-3xl border border-border bg-card">
            <div className="border-b border-border/60 bg-pinksoft/30 px-4 py-3">
              <h2 className="font-bold">Daftar Pesanan (cocokkan saat serah terima)</h2>
            </div>
            <div className="divide-y divide-border/40">
              {pesanan.map((p, i) => (
                <div key={p.id} className="flex flex-wrap items-start gap-2 px-4 py-3 text-sm">
                  <span className="mt-0.5 font-bold text-muted-foreground">{i + 1}.</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {p.customer_name}{" "}
                      <span className="text-xs font-normal text-muted-foreground">· {p.code}</span>
                    </p>
                    <p className="text-muted-foreground">
                      {p.order_items.map((it) => `${it.product_name} ×${it.quantity}`).join(", ")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="font-semibold">{formatRupiah(p.total)}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold">
                        {p.payment_method === "cod" ? "COD" : "Transfer"}
                      </span>
                      <BadgeStatusBayar status={p.payment_status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
