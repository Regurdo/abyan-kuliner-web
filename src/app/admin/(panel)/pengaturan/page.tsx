"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ImagePlus, Loader2, RotateCcw, Save, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { isWaValid, normalizeWa } from "@/lib/format";
import { toast } from "sonner";

/**
 * PENGATURAN TOKO — data yang dipakai seluruh website:
 * nama toko, nomor WA, jam operasional, info rekening/QRIS,
 * status buka/tutup, dan template pesan WhatsApp.
 * Semua di satu tempat, tombol Simpan sekali saja.
 */

const DEFAULT_TEMPLATES: Record<string, string> = {
  konfirmasi_pesanan:
    "Halo {nama}! Pesananmu dengan kode {kode} sudah dikonfirmasi ya. Total pesanan: {total} (termasuk ongkir {ongkir}). Metode bayar: {pembayaran}. Terima kasih sudah memesan!",
  tagihan_transfer:
    "Halo {nama}! Untuk pesanan {kode}, mohon transfer sebesar {total} ke: {rekening}. Setelah transfer, unggah buktinya di halaman Lacak Pesanan ya. Terima kasih!",
  sedang_diantar:
    "Halo {nama}! Pesanan {kode} sedang diantar ke alamatmu ya. Mohon ditunggu di rumah ya!",
  pesanan_selesai:
    "Halo {nama}! Pesanan {kode} sudah selesai. Terima kasih sudah memesan kue di toko kami, sampai jumpa di batch berikutnya!",
};

const DAFTAR_TPL: { key: string; label: string; penjelasan: string }[] = [
  {
    key: "konfirmasi_pesanan",
    label: "Konfirmasi Pesanan",
    penjelasan: "Dikirim saat ibu menekan tombol Konfirmasi di halaman pesanan.",
  },
  {
    key: "tagihan_transfer",
    label: "Tagihan Transfer",
    penjelasan: "Pengingat pembayaran transfer berisi nomor rekening.",
  },
  {
    key: "sedang_diantar",
    label: "Sedang Diantar",
    penjelasan: "Pemberitahuan kue sudah diantar ke rumah pembeli.",
  },
  {
    key: "pesanan_selesai",
    label: "Pesanan Selesai",
    penjelasan: "Ucapan terima kasih setelah pesanan selesai.",
  },
];

interface FormToko {
  store_name: string;
  whatsapp_number: string;
  operating_hours: string;
  bank_info: string;
  qris_image_url: string | null;
  is_open: boolean;
  wa_templates: Record<string, string>;
}

export default function HalamanPengaturan() {
  const router = useRouter();
  const [form, setForm] = useState<FormToko | null>(null);
  const [proses, setProses] = useState(false);
  const [unggahQris, setUnggahQris] = useState(false);
  const fileQris = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("store_settings")
          .select("*")
          .eq("id", 1)
          .single();
        if (error) throw error;
        setForm({
          store_name: data.store_name ?? "",
          whatsapp_number: data.whatsapp_number ?? "",
          operating_hours: data.operating_hours ?? "",
          bank_info: data.bank_info ?? "",
          qris_image_url: data.qris_image_url ?? null,
          is_open: data.is_open ?? false,
          wa_templates: { ...DEFAULT_TEMPLATES, ...(data.wa_templates ?? {}) },
        });
      } catch {
        toast.error("Gagal memuat pengaturan toko.");
      }
    })();
  }, []);

  if (!form) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const set = <K extends keyof FormToko>(k: K, v: FormToko[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  const setTpl = (key: string, v: string) =>
    setForm((f) => (f ? { ...f, wa_templates: { ...f.wa_templates, [key]: v } } : f));

  /* ===== Simpan semua pengaturan ===== */
  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    if (form.store_name.trim().length < 2) {
      toast.error("Nama toko minimal 2 huruf ya.");
      return;
    }
    if (!isWaValid(form.whatsapp_number)) {
      toast.error("Nomor WA belum benar. Contoh: 081234567890 atau 6281234567890");
      return;
    }
    setProses(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("store_settings")
        .update({
          store_name: form.store_name.trim(),
          whatsapp_number: normalizeWa(form.whatsapp_number),
          operating_hours: form.operating_hours.trim(),
          bank_info: form.bank_info.trim(),
          qris_image_url: form.qris_image_url,
          is_open: form.is_open,
          wa_templates: form.wa_templates,
        })
        .eq("id", 1);
      if (error) {
        toast.error("Gagal menyimpan. Coba lagi ya.");
        return;
      }
      toast.success("Pengaturan toko tersimpan");
      router.refresh();
    } catch {
      toast.error("Koneksi bermasalah. Coba lagi ya.");
    } finally {
      setProses(false);
    }
  }

  /* ===== Upload / hapus gambar QRIS (bucket publik product-images) ===== */
  async function pilihQris(file: File) {
    const ok = ["image/jpeg", "image/png", "image/webp"].includes(file.type);
    if (!ok) {
      toast.error("Foto harus JPG, PNG, atau WebP ya.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 5 MB ya.");
      return;
    }
    setUnggahQris(true);
    try {
      const supabase = createClient();
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `qris/qris-${Date.now()}.${ext}`;
      const { error: errUnggah } = await supabase.storage
        .from("product-images")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (errUnggah) {
        toast.error("Gagal mengunggah gambar QRIS.");
        return;
      }
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      // Hapus file lama supaya bucket tetap rapi
      const lama = form.qris_image_url;
      if (lama && lama.includes("/product-images/")) {
        const pathLama = lama.split("/product-images/")[1].split("?")[0];
        await supabase.storage.from("product-images").remove([pathLama]);
      }
      set("qris_image_url", urlData.publicUrl);
      toast.success("Gambar QRIS siap. Jangan lupa klik Simpan ya!");
    } catch {
      toast.error("Koneksi bermasalah saat mengunggah.");
    } finally {
      setUnggahQris(false);
      if (fileQris.current) fileQris.current.value = "";
    }
  }

  async function hapusQris() {
    if (!form?.qris_image_url) return;
    if (!window.confirm("Hapus gambar QRIS ini?")) return;
    const supabase = createClient();
    if (form.qris_image_url.includes("/product-images/")) {
      const pathLama = form.qris_image_url.split("/product-images/")[1].split("?")[0];
      await supabase.storage.from("product-images").remove([pathLama]);
    }
    set("qris_image_url", null);
    toast.success("Gambar QRIS dihapus. Klik Simpan untuk menerapkan.");
  }

  return (
    <form onSubmit={simpan} className="mx-auto flex max-w-3xl flex-col gap-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="h-6 w-6" /> Pengaturan Toko</h1>
        <p className="text-sm text-muted-foreground">
          Data di sini dipakai di seluruh website: halaman pembeli, pesanan, dan pesan WhatsApp.
        </p>
      </div>

      {/* ===== Identitas toko ===== */}
      <section className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5">
        <h2 className="font-bold">Identitas Toko</h2>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="store_name">Nama Toko</Label>
          <Input
            id="store_name"
            value={form.store_name}
            onChange={(e) => set("store_name", e.target.value)}
            className="h-11 rounded-2xl"
            placeholder="Contoh: Kue Ibu Ratna"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="wa">Nomor WhatsApp Ibu</Label>
          <Input
            id="wa"
            inputMode="tel"
            value={form.whatsapp_number}
            onChange={(e) => set("whatsapp_number", e.target.value)}
            className="h-11 rounded-2xl"
            placeholder="081234567890"
          />
          <p className="text-xs text-muted-foreground">
            Semua tombol WA di website akan menghubungi nomor ini. Format: 08xx atau 62xx.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="jam">Jam / Hari Operasional</Label>
          <Input
            id="jam"
            value={form.operating_hours}
            onChange={(e) => set("operating_hours", e.target.value)}
            className="h-11 rounded-2xl"
            placeholder="Contoh: Setiap hari, 08.00 - 20.00 WIB"
          />
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-muted/50 px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Status Toko</p>
            <p className="text-xs text-muted-foreground">
              Sama dengan saklar Buka/Tutup di halaman Dashboard.
            </p>
          </div>
          <Switch checked={form.is_open} onCheckedChange={(v) => set("is_open", v)} />
        </div>
      </section>

      {/* ===== Pembayaran ===== */}
      <section className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5">
        <h2 className="font-bold">Pembayaran</h2>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bank">Info Rekening / Transfer</Label>
          <Textarea
            id="bank"
            value={form.bank_info}
            onChange={(e) => set("bank_info", e.target.value)}
            rows={3}
            className="rounded-2xl"
            placeholder={"BCA 1234567890 a.n. Nama Ibu\nMandiri 9876543210 a.n. Nama Ibu"}
          />
          <p className="text-xs text-muted-foreground">
            Tampil saat pembeli memilih Transfer. Tulis satu rekening per baris.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Gambar QRIS (opsional)</Label>
          {form.qris_image_url ? (
            <div className="flex items-start gap-3">
              <img
                src={form.qris_image_url}
                alt="Gambar QRIS"
                className="h-28 w-28 rounded-2xl border border-border object-cover"
              />
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl font-semibold"
                  onClick={() => fileQris.current?.click()}
                  disabled={unggahQris}
                >
                  {unggahQris ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} Ganti
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-2xl font-semibold text-rose-600 hover:bg-rose-50"
                  onClick={hapusQris}
                >
                  <Trash2 className="h-4 w-4" /> Hapus
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => fileQris.current?.click()}
              disabled={unggahQris}
              className="h-11 justify-start rounded-2xl font-semibold"
            >
              {unggahQris ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} Unggah Gambar QRIS
            </Button>
          )}
          <input
            ref={fileQris}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => e.target.files?.[0] && void pilihQris(e.target.files[0])}
          />
          <p className="text-xs text-muted-foreground">
            JPG/PNG/WebP, maksimal 5 MB. Akan tampil di halaman pembayaran pembeli.
          </p>
        </div>
      </section>

      {/* ===== Template WA ===== */}
      <section className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5">
        <div>
          <h2 className="font-bold">Template Pesan WhatsApp</h2>
          <p className="text-sm text-muted-foreground">
            Pesan otomatis saat ibu menekan tombol WA di halaman pesanan. Bisa diubah sesuka hati.
          </p>
        </div>
        <div className="rounded-2xl bg-pinksoft/30 px-4 py-3 text-xs">
          <p className="font-semibold">Kata ajaib yang bisa dipakai (diganti otomatis):</p>
          <p className="mt-1 text-muted-foreground">
            {"{nama}"} nama pembeli · {"{kode}"} kode pesanan · {"{total}"} total bayar ·{" "}
            {"{ongkir}"} ongkir · {"{rekening}"} info rekening · {"{pembayaran}"} COD/Transfer
          </p>
        </div>
        {DAFTAR_TPL.map((t) => (
          <div key={t.key} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor={`tpl-${t.key}`}>{t.label}</Label>
              <button
                type="button"
                onClick={() => setTpl(t.key, DEFAULT_TEMPLATES[t.key])}
                className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" /> Kembalikan
              </button>
            </div>
            <Textarea
              id={`tpl-${t.key}`}
              value={form.wa_templates[t.key] ?? ""}
              onChange={(e) => setTpl(t.key, e.target.value)}
              rows={3}
              className="rounded-2xl text-sm"
            />
            <p className="text-xs text-muted-foreground">{t.penjelasan}</p>
          </div>
        ))}
      </section>

      {/* ===== Tombol simpan ===== */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-card/95 px-4 py-3 backdrop-blur lg:left-60">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <p className="hidden text-xs text-muted-foreground sm:block">
            Perubahan langsung terlihat di website setelah disimpan.
          </p>
          <Button type="submit" disabled={proses} className="h-11 flex-1 rounded-2xl font-bold sm:flex-none sm:px-8">
            {proses ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan Pengaturan
          </Button>
        </div>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" /> Data tersimpan di Supabase — aman walau HP berganti.
      </p>
    </form>
  );
}
