"use client";

import { useState } from "react";
import {
  BanknoteIcon,
  CheckCircle2,
  Loader2,
  MessageCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { buatLinkWa, formatRupiah } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";
import { toast } from "sonner";

interface RincianUntukAksi {
  id: string;
  code: string;
  customer_name: string;
  status: OrderStatus;
  subtotal: number;
  shipping_cost: number;
  total: number;
  payment_method: string;
  payment_status: string;
  payment_proof_url: string | null;
}

async function catatRiwayat(orderId: string, status: OrderStatus, note: string) {
  const supabase = createClient();
  await supabase.from("order_status_history").insert({ order_id: orderId, status, note });
}

/* ===== Panel ubah status pesanan ===== */
const LANGKAH: { status: OrderStatus; label: string; note: string }[] = [
  { status: "dikonfirmasi", label: "Konfirmasi Pesanan", note: "Pesanan dikonfirmasi ibu." },
  { status: "sedang_dibuat", label: "Mulai Dibuat", note: "Kue sedang dibuat." },
  { status: "siap_diantar", label: "Siap Diantar", note: "Kue siap, menunggu jadwal antar." },
  { status: "dalam_pengantaran", label: "Mulai Diantar", note: "Kue sedang diantar ke pembeli." },
  { status: "selesai", label: "Tandai Selesai", note: "Pesanan selesai. Terima kasih!" },
];

export function AksiStatusPesanan({ pesanan }: { pesanan: RincianUntukAksi }) {
  const [proses, setProses] = useState<OrderStatus | "batal" | null>(null);
  const selesaiSemua = pesanan.status === "selesai" || pesanan.status === "dibatalkan";

  async function ubah(status: OrderStatus, note: string) {
    setProses(status);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", pesanan.id);
      if (error) {
        toast.error("Gagal mengubah status. Coba lagi ya.");
        return;
      }
      await catatRiwayat(pesanan.id, status, note);
      toast.success("Status pesanan diperbarui");
      window.location.reload(); // sederhana: muat ulang data terbaru
    } catch {
      toast.error("Koneksi bermasalah. Coba lagi ya.");
    } finally {
      setProses(null);
    }
  }

  async function batalkan() {
    if (
      !window.confirm(
        "Batalkan pesanan ini? Kuota batch akan otomatis dikembalikan. Lanjutkan?"
      )
    )
      return;
    setProses("batal");
    try {
      await ubah("dibatalkan", "Pesanan dibatalkan oleh ibu. Kuota dikembalikan.");
    } finally {
      setProses(null);
    }
  }

  if (selesaiSemua) {
    return (
      <p className="rounded-2xl bg-muted/60 px-4 py-3 text-center text-sm text-muted-foreground">
        Pesanan ini sudah {pesanan.status === "selesai" ? "selesai" : "dibatalkan"} — tidak
        ada aksi lagi.
      </p>
    );
  }

  // Tampilkan hanya langkah BERIKUTNYA yang masuk akal
  const urutan: OrderStatus[] = [
    "baru",
    "dikonfirmasi",
    "sedang_dibuat",
    "siap_diantar",
    "dalam_pengantaran",
    "selesai",
  ];
  const mulaiIdx = urutan.indexOf(pesanan.status);
  // LANGKAH[0] = dikonfirmasi = langkah tepat SETELAH 'baru'
  const berikutnya = LANGKAH.slice(Math.max(mulaiIdx, 0));

  return (
    <div className="flex flex-col gap-2">
      {berikutnya.map((l) => (
        <Button
          key={l.status}
          onClick={() => void ubah(l.status, l.note)}
          disabled={proses !== null}
          className="h-11 justify-start rounded-2xl font-semibold"
          variant={l.status === "selesai" ? "default" : "secondary"}
        >
          {proses === l.status ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          {l.label}
        </Button>
      ))}
      <Button
        onClick={batalkan}
        disabled={proses !== null}
        variant="ghost"
        className="h-11 justify-start rounded-2xl font-semibold text-rose-600 hover:bg-rose-50"
      >
        {proses === "batal" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <XCircle className="h-4 w-4" />
        )}
        Batalkan Pesanan
      </Button>
      <p className="text-xs text-muted-foreground">
        Tips: tombol hanya menampilkan langkah berikutnya supaya tidak salah klik.
      </p>
    </div>
  );
}

/* ===== Panel set ongkir ===== */
export function PanelOngkir({ pesanan }: { pesanan: RincianUntukAksi }) {
  const [ongkir, setOngkir] = useState(String(pesanan.shipping_cost || ""));
  const [proses, setProses] = useState(false);

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(ongkir.replace(/[^0-9]/g, "") || 0);
    if (n < 0 || n > 10_000_000) {
      toast.error("Nominal ongkir tidak masuk akal. Periksa lagi ya.");
      return;
    }
    setProses(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("orders")
        .update({ shipping_cost: n, total: pesanan.subtotal + n })
        .eq("id", pesanan.id);
      if (error) {
        toast.error("Gagal menyimpan ongkir. Coba lagi ya.");
        return;
      }
      toast.success(`Ongkir disimpan — total jadi ${formatRupiah(pesanan.subtotal + n)}`);
      window.location.reload();
    } finally {
      setProses(false);
    }
  }

  return (
    <form onSubmit={simpan} className="flex items-end gap-2">
      <div className="flex-1">
        <Label htmlFor="ongkir" className="text-xs text-muted-foreground">
          Ongkir (Rp)
        </Label>
        <Input
          id="ongkir"
          inputMode="numeric"
          value={ongkir}
          onChange={(e) => setOngkir(e.target.value.replace(/[^0-9]/g, ""))}
          className="mt-1 h-11 rounded-2xl"
          placeholder="0"
        />
      </div>
      <Button type="submit" disabled={proses} className="h-11 rounded-2xl font-semibold">
        {proses ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
      </Button>
    </form>
  );
}

/* ===== Verifikasi bukti transfer ===== */
export function VerifikasiBukti({ pesanan }: { pesanan: RincianUntukAksi }) {
  const [urlBukti, setUrlBukti] = useState<string | null>(null);
  const [proses, setProses] = useState(false);
  const sudahLunas = pesanan.payment_status === "lunas";

  async function lihatBukti() {
    if (!pesanan.payment_proof_url) return;
    try {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from("payment-proofs")
        .createSignedUrl(pesanan.payment_proof_url, 600);
      if (error || !data) {
        toast.error("Gagal membuka bukti. Coba lagi ya.");
        return;
      }
      window.open(data.signedUrl, "_blank", "noopener");
    } catch {
      toast.error("Koneksi bermasalah. Coba lagi ya.");
    }
  }

  async function tandaiLunas() {
    setProses(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("orders")
        .update({ payment_status: "lunas" })
        .eq("id", pesanan.id);
      if (error) {
        toast.error("Gagal menandai lunas. Coba lagi ya.");
        return;
      }
      await catatRiwayat(pesanan.id, pesanan.status, "Pembayaran transfer terverifikasi (lunas).");
      toast.success("Pembayaran ditandai LUNAS");
      window.location.reload();
    } finally {
      setProses(false);
    }
  }

  async function tolakBukti() {
    if (!window.confirm("Tandai bukti ini tidak valid? Pembeli diminta upload ulang."))
      return;
    setProses(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("orders")
        .update({ payment_status: "belum_bayar" })
        .eq("id", pesanan.id);
      if (error) {
        toast.error("Gagal menyimpan. Coba lagi ya.");
        return;
      }
      await catatRiwayat(
        pesanan.id,
        pesanan.status,
        "Bukti transfer ditolak — pembeli diminta upload ulang."
      );
      toast.success("Bukti ditandai tidak valid.");
      window.location.reload();
    } finally {
      setProses(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={lihatBukti}
        disabled={!pesanan.payment_proof_url || proses}
        variant="secondary"
        className="h-11 justify-start rounded-2xl font-semibold"
      >
        <BanknoteIcon className="h-4 w-4" />
        {pesanan.payment_proof_url ? "Lihat Foto Bukti" : "Belum ada bukti diunggah"}
      </Button>
      {sudahLunas ? (
        <p className="rounded-2xl bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-700">
          <span className="rounded-full bg-teal-100 border border-teal-300 px-3 py-1.5 text-sm font-semibold text-teal-800 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-teal-700" /> Sudah terverifikasi lunas. Terima kasih!
          </span>
        </p>
      ) : (
        <div className="flex gap-2">
          <Button
            onClick={tandaiLunas}
            disabled={proses}
            className="h-11 flex-1 rounded-2xl font-bold"
          >
            {proses ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tandai Lunas"}
          </Button>
          <Button
            onClick={tolakBukti}
            disabled={proses}
            variant="ghost"
            className="h-11 rounded-2xl font-semibold text-rose-600 hover:bg-rose-50"
          >
            Bukti Tidak Valid
          </Button>
        </div>
      )}
    </div>
  );
}

/* ===== Tombol WA dengan template dari pengaturan toko ===== */
export function TombolWaPembeli({
  pesanan,
  nomorIbu,
  templates,
  bankInfo,
}: {
  pesanan: RincianUntukAksi;
  nomorIbu: string;
  templates: Record<string, string>;
  bankInfo: string;
}) {
  const [pesan, setPesan] = useState<string | null>(null);
  const [memuat, setMemuat] = useState(false);

  function isiTemplate(tpl: string): string {
    return tpl
      .replaceAll("{nama}", pesanan.customer_name)
      .replaceAll("{kode}", pesanan.code)
      .replaceAll("{total}", formatRupiah(pesanan.total))
      .replaceAll("{ongkir}", formatRupiah(pesanan.shipping_cost))
      .replaceAll("{rekening}", bankInfo || "-")
      .replaceAll("{pembayaran}", pesanan.payment_method === "cod" ? "COD" : "Transfer");
  }

  const pilihan: { key: string; label: string }[] = [
    { key: "konfirmasi_pesanan", label: "Konfirmasi" },
    { key: "tagihan_transfer", label: "Tagihan Transfer" },
    { key: "sedang_diantar", label: "Sedang Diantar" },
    { key: "pesanan_selesai", label: "Selesai" },
  ].filter((p) => templates[p.key]);

  async function buat(key: string) {
    setMemuat(true);
    try {
      const tpl = templates[key] ?? "";
      setPesan(isiTemplate(tpl));
    } finally {
      setMemuat(false);
    }
  }

  if (pilihan.length === 0) {
    return (
      <Button asChild className="h-11 w-full rounded-2xl bg-emerald-600 font-bold hover:bg-emerald-700">
        <a
          href={buatLinkWa(
            pesanan.customer_whatsapp,
            `Halo ${pesanan.customer_name}! Soal pesanan ${pesanan.code}, mau konfirmasi ya.`
          )}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle className="h-4 w-4" /> WhatsApp Pembeli
        </a>
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {pilihan.map((p) => (
          <button
            key={p.key}
            onClick={() => buat(p.key)}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:border-primary/50"
          >
            {p.label}
          </button>
        ))}
      </div>
      {pesan && (
        <div className="flex flex-col gap-2">
          <textarea
            readOnly
            value={pesan}
            rows={5}
            className="w-full rounded-2xl border border-border bg-muted/40 p-3 text-sm"
            aria-label="Pesan WhatsApp yang akan dikirim"
          />
          <Button
            asChild
            className="h-11 rounded-2xl bg-emerald-600 font-bold hover:bg-emerald-700"
          >
            <a
              href={buatLinkWa(pesanan.customer_whatsapp, pesan)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-4 w-4" /> Kirim ke WhatsApp Pembeli
            </a>
          </Button>
          <p className="text-[11px] text-muted-foreground">
            Dikirim dari nomor toko {nomorIbu} — buka WhatsApp di HP yang memakai nomor itu ya.
          </p>
        </div>
      )}
      {memuat && <Loader2 className="h-4 w-4 animate-spin" />}
    </div>
  );
}
