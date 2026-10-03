"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Mail, ScrollText, SearchX } from "lucide-react";
import { BadgeStatusPesanan, BadgeStatusBayar } from "@/components/admin/Badge";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah, formatTanggalWaktu } from "@/lib/format";
import type { OrderStatus, PaymentStatus } from "@/lib/types";
import { toast } from "sonner";

interface BarisPesanan {
  id: string;
  code: string;
  customer_name: string;
  customer_whatsapp: string;
  status: OrderStatus;
  payment_method: string;
  payment_status: PaymentStatus;
  total: number;
  created_at: string;
  order_items: { product_name: string; quantity: number }[];
}

const TAB: { nilai: string; label: string }[] = [
  { nilai: "semua", label: "Semua" },
  { nilai: "baru", label: "Baru" },
  { nilai: "dikonfirmasi", label: "Dikonfirmasi" },
  { nilai: "sedang_dibuat", label: "Dibuat" },
  { nilai: "siap_diantar", label: "Siap Antar" },
  { nilai: "dalam_pengantaran", label: "Diantar" },
  { nilai: "selesai", label: "Selesai" },
  { nilai: "dibatalkan", label: "Batal" },
];

export default function HalamanPesanan() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-card" />}>
      <IsiPesanan />
    </Suspense>
  );
}

function IsiPesanan() {
  const params = useSearchParams();
  const [pesanan, setPesanan] = useState<BarisPesanan[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [tab, setTab] = useState(params.get("filter") === "cek_bukti" ? "cek_bukti" : "semua");
  const [cari, setCari] = useState("");

  const muat = useCallback(async () => {
    setMemuat(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, code, customer_name, customer_whatsapp, status, payment_method, payment_status, total, created_at, order_items(product_name, quantity)"
        )
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      setPesanan((data ?? []) as BarisPesanan[]);
    } catch {
      toast.error("Gagal memuat pesanan. Coba muat ulang halaman ya.");
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    void muat();
  }, [muat]);

  const daftar = useMemo(() => {
    let hasil = pesanan;
    if (tab === "cek_bukti") {
      hasil = hasil.filter(
        (o) => o.payment_method === "transfer" && o.payment_status === "menunggu_verifikasi"
      );
    } else if (tab !== "semua") {
      hasil = hasil.filter((o) => o.status === tab);
    }
    const q = cari.trim().toLowerCase();
    if (q) {
      hasil = hasil.filter(
        (o) =>
          o.code.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.customer_whatsapp.includes(q.replace(/[^0-9]/g, ""))
      );
    }
    return hasil;
  }, [pesanan, tab, cari]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold flex items-center gap-2"><ScrollText className="h-6 w-6" /> Pesanan</h1>
        <Input
          placeholder="Cari kode / nama / nomor WA..."
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          className="h-10 w-full rounded-2xl sm:w-64"
        />
      </div>

      {/* Tab filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TAB.map((t) => (
          <button
            key={t.nilai}
            onClick={() => setTab(t.nilai)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
              tab === t.nilai
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40"
            }`}
          >
            {t.label}
          </button>
        ))}
        <button
          onClick={() => setTab("cek_bukti")}
          className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
            tab === "cek_bukti"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-amber-300 bg-amber-50 text-amber-700 hover:border-amber-400"
          }`}
        >
          <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> Cek Bukti</span>
        </button>
      </div>

      {/* Daftar */}
      {memuat ? (
        <div className="flex items-center justify-center gap-2 rounded-3xl border border-border/70 bg-card py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Memuat pesanan...
        </div>
      ) : daftar.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-border bg-card/60 py-16 text-center">
          <SearchX className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Tidak ada pesanan pada filter ini.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {daftar.map((o) => (
            <li key={o.id}>
              <Link
                href={`/admin/pesanan/${o.id}`}
                className="block rounded-3xl border border-border/70 bg-card p-4 transition hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-bold text-primary">{o.code}</p>
                    <p className="mt-0.5 truncate text-sm font-semibold">
                      {o.customer_name}{" "}
                      <span className="font-normal text-muted-foreground">
                        ({o.customer_whatsapp})
                      </span>
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {o.order_items?.map((i) => `${i.product_name} ×${i.quantity}`).join(", ") ||
                        "—"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatTanggalWaktu(o.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="font-bold">{formatRupiah(o.total)}</span>
                    <div className="flex flex-wrap justify-end gap-1">
                      <BadgeStatusPesanan status={o.status} />
                      {o.payment_method === "transfer" && (
                        <BadgeStatusBayar status={o.payment_status} />
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
