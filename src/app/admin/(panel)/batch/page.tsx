"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarPlus, Loader2, Lock, PartyPopper, Trash2, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { formatTanggalWaktu } from "@/lib/format";
import type { Batch, Product } from "@/lib/types";
import { toast } from "sonner";

interface BatchDenganKuota extends Batch {
  kuota?: { product_id: string; quota: number; remaining: number }[];
}

/** Kelola batch PO: buat baru, tutup/aktifkan, lihat kuota */
export default function HalamanBatch() {
  const [batch, setBatch] = useState<BatchDenganKuota[]>([]);
  const [produk, setProduk] = useState<Product[]>([]);
  const [kuotaPerProduk, setKuotaPerProduk] = useState<Map<string, { quota: number; remaining: number }>>(
    new Map()
  );
  const [memuat, setMemuat] = useState(true);
  const [bukaForm, setBukaForm] = useState(false);
  const [proses, setProses] = useState<string | null>(null);

  const muat = useCallback(async () => {
    setMemuat(true);
    try {
      const supabase = createClient();
      const [batchRes, produkRes] = await Promise.all([
        supabase.from("batches").select("*").order("created_at", { ascending: false }).limit(20),
        supabase.from("products").select("*").eq("is_active", true).order("name"),
      ]);
      if (batchRes.error) throw batchRes.error;
      const daftar = (batchRes.data ?? []) as BatchDenganKuota[];
      setProduk((produkRes.data ?? []) as Product[]);

      // Ambil kuota untuk semua batch yang tampil
      const map = new Map<string, { quota: number; remaining: number }>();
      if (daftar.length > 0) {
        const { data: kp, error: errKp } = await supabase
          .from("batch_products")
          .select("batch_id, product_id, quota, remaining")
          .in(
            "batch_id",
            daftar.map((b) => b.id)
          );
        if (errKp) throw errKp;
        for (const r of (kp ?? []) as {
          batch_id: string;
          product_id: string;
          quota: number;
          remaining: number;
        }[]) {
          // Tampilkan kuota batch paling baru bila produk ada di beberapa batch
          if (!map.has(r.batch_id + r.product_id))
            map.set(r.batch_id + r.product_id, { quota: r.quota, remaining: r.remaining });
        }
      }
      setKuotaPerProduk(map);
      setBatch(daftar);
    } catch {
      toast.error("Gagal memuat batch. Muat ulang halaman ya.");
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    void muat();
  }, [muat]);

  async function tutupBatch(b: Batch) {
    if (!window.confirm(`Tutup batch "${b.name}"? Pembeli tidak bisa pesan lagi di batch ini.`))
      return;
    setProses(b.id);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("batches").update({ is_active: false }).eq("id", b.id);
      if (error) {
        toast.error("Gagal menutup batch.");
        return;
      }
      toast.success("Batch ditutup. Jangan lupa buka batch baru ya!");
      void muat();
    } finally {
      setProses(null);
    }
  }

  async function aktifkanBatch(b: Batch) {
    if (
      !window.confirm(
        `Aktifkan batch "${b.name}"? Batch aktif lain akan otomatis ditutup (hanya boleh 1 batch aktif).`
      )
    )
      return;
    setProses(b.id);
    try {
      const supabase = createClient();
      // 1) Tutup semua batch aktif lain, 2) aktifkan batch ini
      await supabase.from("batches").update({ is_active: false }).eq("is_active", true);
      const { error } = await supabase.from("batches").update({ is_active: true }).eq("id", b.id);
      if (error) {
        toast.error("Gagal mengaktifkan batch. Coba lagi ya.");
        void muat();
        return;
      }
      toast.success("Batch diaktifkan!");
      void muat();
    } finally {
      setProses(null);
    }
  }

  async function hapusBatch(b: BatchDenganKuota) {
    setProses(b.id);
    try {
      const supabase = createClient();

      // Cek apakah ada pesanan yang terkait batch ini
      const { count, error: errCount } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("batch_id", b.id);
      if (errCount) throw errCount;

      if (count && count > 0) {
        toast.error(
          `Tidak bisa hapus — ada ${count} pesanan di batch ini. Batalkan/hapus pesanan dulu, atau tutup batch saja.`
        );
        return;
      }

      if (
        !window.confirm(
          `Hapus batch "${b.name}"? Batch yang sudah dihapus tidak bisa dikembalikan.`
        )
      )
        return;

      // Hapus kuota produk dulu (batch_products)
      const { error: errKp } = await supabase
        .from("batch_products")
        .delete()
        .eq("batch_id", b.id);
      if (errKp) {
        toast.error("Gagal menghapus kuota produk di batch ini.");
        return;
      }

      // Hapus batch
      const { error } = await supabase.from("batches").delete().eq("id", b.id);
      if (error) {
        toast.error("Gagal menghapus batch. Coba lagi ya.");
        return;
      }

      toast.success("Batch dihapus.");
      void muat();
    } catch {
      toast.error("Gagal menghapus batch. Coba lagi ya.");
    } finally {
      setProses(null);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold">Batch PO</h1>
          <p className="text-sm text-muted-foreground">
            Satu jadwal pemesanan = satu batch. Hanya 1 batch yang boleh aktif.
          </p>
        </div>
        <Button onClick={() => setBukaForm((v) => !v)} className="rounded-full font-bold">
          <CalendarPlus className="h-4 w-4" /> Buat Batch Baru
        </Button>
      </div>

      {bukaForm && (
        <FormBatchBaru
          produk={produk}
          selesai={() => {
            setBukaForm(false);
            void muat();
          }}
        />
      )}

      {memuat ? (
        <div className="flex items-center justify-center gap-2 rounded-3xl border border-border/70 bg-card py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Memuat batch...
        </div>
      ) : batch.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/60 py-16 text-center text-sm text-muted-foreground">
          Belum ada batch. Buat batch baru supaya pembeli bisa memesan ya!
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {batch.map((b) => {
            const kuota = [...kuotaPerProduk.entries()].filter(([k]) => k.startsWith(b.id));
            return (
              <li
                key={b.id}
                className={`rounded-3xl border p-4 ${
                  b.is_active ? "border-primary/40 bg-primary/5" : "border-border/70 bg-card"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold">{b.name}</p>
                      {b.is_active && (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                          AKTIF
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Batas pesan: {formatTanggalWaktu(b.order_deadline)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Kue siap: {b.ready_date}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {b.is_active ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="rounded-full font-semibold"
                        disabled={proses === b.id}
                        onClick={() => void tutupBatch(b)}
                      >
                        {proses === b.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Lock className="h-4 w-4" />
                        )}
                        Tutup
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="rounded-full font-semibold"
                        disabled={proses === b.id}
                        onClick={() => void aktifkanBatch(b)}
                      >
                        {proses === b.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Unlock className="h-4 w-4" />
                        )}
                        Aktifkan
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={proses === b.id}
                      onClick={() => void hapusBatch(b)}
                      title="Hapus batch"
                    >
                      {proses === b.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Kuota per produk */}
                {kuota.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {kuota.map(([k, v]) => {
                      const nama = produk.find((pr) => pr.id === k.slice(b.id.length))?.name ?? "Produk";
                      const habis = v.remaining <= 0;
                      return (
                        <span
                          key={k}
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                            habis
                              ? "border-rose-200 bg-rose-50 text-rose-600"
                              : "border-border bg-card"
                          }`}
                        >
                          {nama}: {v.remaining}/{v.quota}
                        </span>
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ===== Form batch baru + pilih produk & kuota ===== */
function FormBatchBaru({
  produk,
  selesai,
}: {
  produk: Product[];
  selesai: () => void;
}) {
  const [nama, setNama] = useState("");
  const [siap, setSiap] = useState("");
  const [deadline, setDeadline] = useState("");
  const [pilih, setPilih] = useState<Map<string, boolean>>(new Map());
  const [kuota, setKuota] = useState<Map<string, string>>(new Map());
  const [proses, setProses] = useState(false);

  function togglePilih(id: string, nilai: boolean) {
    setPilih((m) => new Map(m).set(id, nilai));
    if (nilai && !kuota.get(id)) setKuota((m) => new Map(m).set(id, "20"));
  }

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    if (!nama.trim() || !siap || !deadline) {
      toast.error("Lengkapi nama, tanggal siap, dan batas pesan ya.");
      return;
    }
    const terpilih = produk.filter((p) => pilih.get(p.id));
    if (terpilih.length === 0) {
      toast.error("Pilih minimal 1 produk yang dijual di batch ini.");
      return;
    }
    for (const p of terpilih) {
      const q = Number(kuota.get(p.id) || 0);
      if (!q || q < 1 || q > 500) {
        toast.error(`Kuota "${p.name}" harus angka 1-500.`);
        return;
      }
    }

    setProses(true);
    try {
      const supabase = createClient();

      // 1. Tutup batch aktif lain (hanya boleh 1 aktif)
      await supabase.from("batches").update({ is_active: false }).eq("is_active", true);

      // 2. Buat batch (aktif langsung)
      const { data: baru, error } = await supabase
        .from("batches")
        .insert({
          name: nama.trim(),
          ready_date: siap,
          order_deadline: new Date(deadline).toISOString(),
          is_active: true,
        })
        .select("id")
        .single();
      if (error || !baru) {
        toast.error("Gagal membuat batch. Coba lagi ya.");
        return;
      }

      // 3. Isi kuota produk
      const rows = terpilih.map((p) => ({
        batch_id: baru.id,
        product_id: p.id,
        quota: Number(kuota.get(p.id)),
        remaining: Number(kuota.get(p.id)),
      }));
      const { error: errKp } = await supabase.from("batch_products").insert(rows);
      if (errKp) {
        toast.error("Batch dibuat, tapi gagal isi kuota. Cek halaman ini ya.");
        return;
      }

      toast.success("Batch baru aktif! Pembeli sudah bisa memesan");
      selesai();
    } finally {
      setProses(false);
    }
  }

  return (
    <form
      onSubmit={simpan}
      className="flex flex-col gap-4 rounded-3xl border border-primary/30 bg-card p-5"
    >
      <h2 className="text-base font-bold">Batch Baru</h2>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="b-nama">Nama batch</Label>
          <Input
            id="b-nama"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="h-11 rounded-2xl"
            placeholder="Batch Lebaran"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="b-siap">Kue siap (tanggal)</Label>
          <Input
            id="b-siap"
            type="date"
            value={siap}
            onChange={(e) => setSiap(e.target.value)}
            className="h-11 rounded-2xl"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="b-deadline">Batas akhir pesan</Label>
          <Input
            id="b-deadline"
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="h-11 rounded-2xl"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Produk yang dijual + kuota</Label>
        {produk.length === 0 ? (
          <p className="rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
            Belum ada produk aktif. Tambahkan dulu di menu Produk ya.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {produk.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Switch
                    checked={Boolean(pilih.get(p.id))}
                    onCheckedChange={(v) => togglePilih(p.id, v)}
                    aria-label={`Jual ${p.name} di batch ini`}
                  />
                  <span className="truncate text-sm font-semibold">{p.name}</span>
                </div>
                {pilih.get(p.id) && (
                  <div className="flex shrink-0 items-center gap-2">
                    <Label htmlFor={`q-${p.id}`} className="text-xs text-muted-foreground">
                      Kuota
                    </Label>
                    <Input
                      id={`q-${p.id}`}
                      inputMode="numeric"
                      value={kuota.get(p.id) ?? ""}
                      onChange={(e) =>
                        setKuota((m) =>
                          new Map(m).set(p.id, e.target.value.replace(/[^0-9]/g, ""))
                        )
                      }
                      className="h-9 w-20 rounded-xl text-center"
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button type="submit" disabled={proses} className="h-12 rounded-full font-bold">
        {proses ? <Loader2 className="h-5 w-5 animate-spin" /> : "Buat & Aktifkan Batch"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Catatan: batch baru langsung AKTIF dan batch aktif sebelumnya otomatis ditutup.
      </p>
    </form>
  );
}
