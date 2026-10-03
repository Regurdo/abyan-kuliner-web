"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import {
  Banknote,
  Check,
  CircleAlert,
  Clock,
  FileText,
  Landmark,
  Loader2,
  MapPin,
  MessageCircle,
  Search,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/store/EmptyState";
import { UploadBukti } from "@/components/store/UploadBukti";
import { useStore } from "@/context/StoreContext";
import { createClient } from "@/lib/supabase/client";
import {
  buatLinkWa,
  formatRupiah,
  formatTanggalWaktu,
  isWaValid,
} from "@/lib/format";
import type { OrderStatus, TrackResult, TrackedOrder } from "@/lib/types";
import { toast } from "sonner";

/* ===== Metadata status pesanan (urutan alur + label ramah) ===== */
const ALUR: OrderStatus[] = [
  "baru",
  "dikonfirmasi",
  "sedang_dibuat",
  "siap_diantar",
  "dalam_pengantaran",
  "selesai",
];

const LABEL_STATUS: Record<OrderStatus, string> = {
  baru: "Pesanan Masuk",
  menunggu_pembayaran: "Menunggu Pembayaran",
  dikonfirmasi: "Dikonfirmasi Ibu",
  sedang_dibuat: "Sedang Dibuat",
  siap_diantar: "Siap Diantar",
  dalam_pengantaran: "Sedang Diantar",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
};

const LABEL_BAYAR: Record<string, string> = {
  belum_bayar: "Belum Bayar",
  menunggu_verifikasi: "Menunggu Verifikasi",
  lunas: "Lunas",
};

export default function HalamanLacak() {
  return (
    <Suspense fallback={<div className="mt-8 h-72 animate-pulse rounded-2xl bg-card" />}>
      <LacakContent />
    </Suspense>
  );
}

function LacakContent() {
  const { settings } = useStore();

  const [kode, setKode] = useState("");
  const [wa, setWa] = useState("");
  const [mencari, setMencari] = useState(false);
  const [hasil, setHasil] = useState<TrackedOrder | null>(null);
  const [pesanGagal, setPesanGagal] = useState<string | null>(null);
  const [sudahDicoba, setSudahDicoba] = useState(false);

  const lacak = useCallback(async (kodeInput: string, waInput: string) => {
    const k = kodeInput.trim().toUpperCase();
    const w = waInput.trim();
    if (!k || !w) {
      toast.error("Isi kode pesanan dan nomor WhatsApp dulu ya.");
      return;
    }
    if (!isWaValid(w)) {
      toast.error("Nomor WhatsApp tidak valid. Contoh: 0812xxxxxxx");
      return;
    }

    setMencari(true);
    setPesanGagal(null);
    setSudahDicoba(false);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("track_order", {
        p_code: k,
        p_whatsapp: w,
      });
      if (error) throw error;

      const res = data as TrackResult;
      if (!res.found || !res.order) {
        setHasil(null);
        setPesanGagal(res.message ?? "Pesanan tidak ditemukan.");
      } else {
        setHasil(res.order);
        // Simpan biar next kali tinggal buka halaman ini
        try {
          localStorage.setItem(
            "kue-ibu-lacak-terakhir",
            JSON.stringify({ kode: k, wa: w })
          );
        } catch {
          // abaikan
        }
      }
      setSudahDicoba(true);
    } catch {
      setHasil(null);
      setPesanGagal("Gagal menghubungi server. Periksa koneksi lalu coba lagi ya.");
      setSudahDicoba(true);
    } finally {
      setMencari(false);
    }
  }, []);

  // Prefill: kode dari URL (?kode=...) + data terakhir dari localStorage.
  // Bila keduanya lengkap, langsung lacak otomatis.
  useEffect(() => {
    try {
      const dariUrl = new URLSearchParams(window.location.search).get("kode") ?? "";
      const raw = localStorage.getItem("kue-ibu-lacak-terakhir");
      const tersimpan = raw
        ? (JSON.parse(raw) as { kode?: string; wa?: string })
        : {};

      const kodeAwal = (dariUrl || tersimpan.kode || "").toUpperCase();
      const waAwal = tersimpan.wa || "";
      setKode(kodeAwal);
      setWa(waAwal);
      if (kodeAwal && waAwal) void lacak(kodeAwal, waAwal);
    } catch {
      // abaikan
    }
  }, [lacak]);

  const ulangi = useCallback(() => {
    void lacak(kode, wa);
  }, [lacak, kode, wa]);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 pb-8">
      {/* ===== Form lacak ===== */}
      <section aria-label="Form lacak pesanan">
        <h1 className="text-2xl font-bold">Lacak Pesanan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Masukkan kode pesanan & nomor WhatsApp yang kamu pakai saat memesan.
        </p>

        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-border/50 bg-card p-4 sm:p-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="kode">Kode Pesanan</Label>
            <Input
              id="kode"
              placeholder="KUE-20261001-0001"
              value={kode}
              onChange={(e) => setKode(e.target.value.toUpperCase())}
              className="h-12 rounded-xl font-mono"
              autoCapitalize="characters"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="wa">Nomor WhatsApp</Label>
            <Input
              id="wa"
              type="tel"
              inputMode="tel"
              placeholder="0812xxxxxxx"
              value={wa}
              onChange={(e) => setWa(e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>
          <Button
            onClick={() => void lacak(kode, wa)}
            disabled={mencari}
            className="h-11 w-full rounded-lg text-sm font-bold"
          >
            {mencari ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Mencari...
              </>
            ) : (
              <>
                <Search className="h-5 w-5" /> Lacak Pesanan
              </>
            )}
          </Button>
        </div>
      </section>

      {/* ===== Hasil ===== */}
      {!hasil && sudahDicoba && (
        <EmptyState
          judul="Pesanan tidak ketemu"
          deskripsi={`${pesanGagal ?? ""} Pastikan kode & nomor WhatsApp sama persis dengan saat memesan ya.`}
        />
      )}

      {hasil && (
        <HasilLacak
          pesanan={hasil}
          waIbu={settings?.whatsapp_number ?? "6281234567890"}
          onUlangi={ulangi}
        />
      )}
    </div>
  );
}

/* ===== Tampilan hasil lacak ===== */
function HasilLacak({
  pesanan: p,
  waIbu,
  onUlangi,
}: {
  pesanan: TrackedOrder;
  waIbu: string;
  onUlangi: () => void;
}) {
  const dibatalkan = p.status === "dibatalkan";
  const indeksAlur = ALUR.indexOf(p.status);
  const waktuPerStatus = new Map<string, string>(
    p.history.map((h) => [h.status, h.created_at])
  );
  const statusSekarang = p.history[p.history.length - 1];

  const pesanWa = [
    `Halo ${p.store_name}! Saya mau tanya pesanan saya`,
    "",
    `Kode Pesanan: ${p.code}`,
    `Nama: ${p.customer_name}`,
    "",
    "Mohon infonya ya, terima kasih!",
  ].join("\n");

  return (
    <div className="flex flex-col gap-5">
      {/* ----- Kartu status utama ----- */}
      <section
        aria-label="Status pesanan"
        className="rounded-2xl border border-border/50 bg-card p-5 text-center"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Status Pesanan
        </p>
        <p className="mt-1 font-mono text-xl font-bold text-primary">{p.code}</p>

        {dibatalkan ? (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-rose-600">
            <XCircle className="h-5 w-5 shrink-0" />
            <span className="text-sm font-bold">
              {LABEL_STATUS.dibatalkan} — kuota pesananmu sudah dikembalikan
            </span>
          </div>
        ) : p.status === "menunggu_pembayaran" ? (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-amber-700">
            <CircleAlert className="h-5 w-5 shrink-0" />
            <span className="text-sm font-bold">
              {LABEL_STATUS.menunggu_pembayaran} — selesaikan transfer ya
            </span>
          </div>
        ) : (
          <p className="mt-3 text-2xl font-extrabold">
            {LABEL_STATUS[p.status] ?? p.status}
          </p>
        )}

        {statusSekarang?.note && (
          <p className="mt-2 text-sm text-muted-foreground">{statusSekarang.note}</p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          Dipesan {formatTanggalWaktu(p.created_at)}
        </p>
      </section>

      {/* ----- Timeline alur pesanan ----- */}
      {!dibatalkan && p.status !== "menunggu_pembayaran" && (
        <section
          aria-label="Riwayat status"
          className="rounded-2xl border border-border/50 bg-card p-5"
        >
          <h2 className="text-base font-bold">Perjalanan Pesananmu</h2>
          <ol className="mt-4 flex flex-col">
            {ALUR.map((s, i) => {
              const selesai = i < indeksAlur || (indeksAlur === i && s === "selesai");
              const sekarang = i === indeksAlur && !selesai;
              const waktu = waktuPerStatus.get(s);
              const terakhir = i === ALUR.length - 1;

              return (
                <li key={s} className="flex gap-3">
                  {/* Kolom ikon + garis */}
                  <div className="flex flex-col items-center">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                        selesai || sekarang
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-muted text-muted-foreground"
                      } ${sekarang ? "animate-pulse" : ""}`}
                    >
                      {selesai ? (
                        <Check className="h-4 w-4" />
                      ) : sekarang ? (
                        <Clock className="h-4 w-4" />
                      ) : (
                        <span className="text-xs font-bold">{i + 1}</span>
                      )}
                    </span>
                    {!terakhir && (
                      <span
                        className={`w-0.5 flex-1 ${selesai ? "bg-primary" : "bg-border"}`}
                        style={{ minHeight: "1.75rem" }}
                      />
                    )}
                  </div>
                  {/* Label + waktu */}
                  <div className={terakhir ? "pb-0" : "pb-5"}>
                    <p
                      className={`text-sm font-semibold ${
                        selesai || sekarang ? "" : "text-muted-foreground"
                      }`}
                    >
                      {LABEL_STATUS[s]}
                    </p>
                    {waktu && (
                      <p className="text-xs text-muted-foreground">
                        {formatTanggalWaktu(waktu)}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* ----- Rincian pesanan ----- */}
      <section
        aria-label="Rincian pesanan"
        className="rounded-2xl border border-border/50 bg-card p-5"
      >
        <h2 className="text-base font-bold">Rincian Pesanan</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {p.items.map((i) => (
            <li key={i.product_name} className="flex justify-between gap-2 text-sm">
              <span>
                {i.product_name} ×{i.quantity}
              </span>
              <span className="shrink-0">{formatRupiah(i.subtotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-col gap-1 border-t border-border pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatRupiah(p.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ongkir</span>
            <span>
              {p.shipping_cost > 0
                ? formatRupiah(p.shipping_cost)
                : "Menunggu konfirmasi ibu"}
            </span>
          </div>
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span className="text-primary">{formatRupiah(p.total)}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 rounded-2xl bg-muted/60 p-4 text-sm">
          <p className="flex gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              <span className="font-semibold">Alamat:</span> {p.address_text}
            </span>
          </p>
          {p.notes && (
            <p className="flex gap-2">
              <span aria-hidden><FileText className="h-4 w-4 shrink-0 text-primary" /></span>
              <span>
                <span className="font-semibold">Catatan:</span> {p.notes}
              </span>
            </p>
          )}
        </div>
      </section>

      {/* ----- Pembayaran ----- */}
      <PembayaranSection pesanan={p} onUlangi={onUlangi} />

      {/* ----- Hubungi ibu ----- */}
      <Button
        asChild
        className="h-11 w-full rounded-lg bg-emerald-600 text-sm font-bold hover:bg-emerald-700"
      >
        <a href={buatLinkWa(waIbu, pesanWa)} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="h-5 w-5" /> Tanya Pesanan via WhatsApp
        </a>
      </Button>
    </div>
  );
}

/* ===== Bagian pembayaran (beda tampilan untuk COD vs Transfer) ===== */
function PembayaranSection({
  pesanan: p,
  onUlangi,
}: {
  pesanan: TrackedOrder;
  onUlangi: () => void;
}) {
  if (p.payment_method === "cod") {
    return (
      <section
        aria-label="Pembayaran"
        className="rounded-2xl border border-border/50 bg-card p-5"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base font-bold">
            <Banknote className="h-5 w-5 text-primary" /> Pembayaran COD
          </h2>
          <BadgeBayar status={p.payment_status} />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Siapkan {formatRupiah(p.total)} (belum termasuk ongkir bila ada) dan bayar
          tunai saat kue tiba di rumahmu ya.
        </p>
      </section>
    );
  }

  // ===== Transfer =====
  const sudahUpload = Boolean(p.payment_proof_url);

  return (
    <section
      aria-label="Pembayaran transfer"
      className="rounded-2xl border border-border/50 bg-card p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-bold">
          <Landmark className="h-5 w-5 text-primary" /> Pembayaran Transfer
        </h2>
        <BadgeBayar status={p.payment_status} />
      </div>

      {p.bank_info && (
        <div className="mt-3 rounded-2xl bg-primary/5 p-4 text-sm">
          <p className="whitespace-pre-line font-semibold text-primary">{p.bank_info}</p>
        </div>
      )}
      <p className="mt-3 text-sm text-muted-foreground">
        Transfer tepat{" "}
        <span className="font-bold text-foreground">{formatRupiah(p.total)}</span>{" "}
        (tunggu info ongkir dari ibu bila belum termasuk), lalu unggah foto buktinya
        di sini.
      </p>

      {p.payment_status === "lunas" ? (
        <p className="mt-3 rounded-xl bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-700">
          Pembayaran sudah lunas & terverifikasi. Terima kasih!
        </p>
      ) : sudahUpload ? (
        <div className="mt-3 flex flex-col gap-3">
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
            Bukti transfer sudah diterima. Ibu akan cek & konfirmasi via WhatsApp ya.
          </p>
          <UploadBukti
            kode={p.code}
            wa={p.customer_whatsapp}
            sudahAdaBukti
            onSukses={onUlangi}
          />
        </div>
      ) : (
        <div className="mt-3">
          <p className="mb-2 text-sm font-semibold">Upload bukti transfermu:</p>
          <UploadBukti
            kode={p.code}
            wa={p.customer_whatsapp}
            sudahAdaBukti={false}
            onSukses={onUlangi}
          />
        </div>
      )}
    </section>
  );
}

/* ===== Pil status pembayaran ===== */
function BadgeBayar({ status }: { status: string }) {
  const gaya =
    status === "lunas"
      ? "border-teal-200 bg-teal-50 text-teal-700"
      : status === "menunggu_verifikasi"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-rose-200 bg-rose-50 text-rose-600";

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${gaya}`}
    >
      {LABEL_BAYAR[status] ?? status}
    </span>
  );
}
