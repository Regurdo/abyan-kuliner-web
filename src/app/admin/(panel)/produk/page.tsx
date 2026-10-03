"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Cookie, CakeSlice, Loader2, Pencil, Plus, Power, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah } from "@/lib/format";
import type { Product } from "@/lib/types";
import { toast } from "sonner";

/** Kelola produk: daftar + tambah/edit/hapus + foto + aktif/nonaktif */
export default function HalamanProduk() {
  const [produk, setProduk] = useState<Product[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [edit, setEdit] = useState<Product | null>(null);
  const [bukaDialog, setBukaDialog] = useState(false);

  const muat = useCallback(async () => {
    setMemuat(true);
    try {
      const supabase = createClient();
      // Admin boleh lihat semua (termasuk nonaktif) — tanpa filter is_active
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");
      if (error) throw error;
      setProduk((data ?? []) as Product[]);
    } catch {
      toast.error("Gagal memuat produk. Muat ulang halaman ya.");
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    void muat();
  }, [muat]);

  async function gantiAktif(p: Product) {
    const supabase = createClient();
    const { error } = await supabase
      .from("products")
      .update({ is_active: !p.is_active })
      .eq("id", p.id);
    if (error) {
      toast.error("Gagal mengubah status produk.");
      return;
    }
    toast.success(p.is_active ? "Produk disembunyikan." : "Produk ditampilkan kembali.");
    void muat();
  }

  async function hapus(p: Product) {
    if (!window.confirm(`Hapus produk "${p.name}"? Riwayat pesanan lama tidak ikut terhapus.`))
      return;
    const supabase = createClient();
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) {
      toast.error("Gagal menghapus produk.");
      return;
    }
    toast.success("Produk dihapus.");
    void muat();
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2"><CakeSlice className="h-6 w-6" /> Produk</h1>
          <p className="text-sm text-muted-foreground">
            Daftar kue yang bisa dijual di batch.
          </p>
        </div>
        <Button
          onClick={() => {
            setEdit(null);
            setBukaDialog(true);
          }}
          className="rounded-full font-bold"
        >
          <Plus className="h-4 w-4" /> Produk Baru
        </Button>
      </div>

      {memuat ? (
        <div className="flex items-center justify-center gap-2 rounded-3xl border border-border/70 bg-card py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Memuat produk...
        </div>
      ) : produk.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/60 py-16 text-center text-sm text-muted-foreground">
          Belum ada produk. Klik "Produk Baru" untuk menambahkan ya! <Cookie className="h-4 w-4 inline" />
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {produk.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-3xl border border-border/70 bg-card p-3"
            >
              {/* Foto */}
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-muted">
                {p.image_url ? (
                  <Image
                    src={p.image_url}
                    alt={p.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <Cookie className="h-8 w-8 text-muted-foreground" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{p.name}</p>
                <p className="truncate text-xs text-muted-foreground">{p.description}</p>
                <p className="mt-0.5 text-sm font-bold text-primary">{formatRupiah(p.price)}</p>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                    p.is_active
                      ? "border-teal-200 bg-teal-50 text-teal-700"
                      : "border-rose-200 bg-rose-50 text-rose-600"
                  }`}
                >
                  {p.is_active ? "AKTIF" : "SEMBUNYI"}
                </span>
                <div className="flex gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => {
                      setEdit(p);
                      setBukaDialog(true);
                    }}
                    aria-label={`Edit ${p.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => void gantiAktif(p)}
                    aria-label={p.is_active ? `Sembunyikan ${p.name}` : `Tampilkan ${p.name}`}
                  >
                    <Power className={`h-4 w-4 ${p.is_active ? "text-teal-600" : "text-rose-400"}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-rose-500 hover:bg-rose-50"
                    onClick={() => void hapus(p)}
                    aria-label={`Hapus ${p.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Dialog tambah/edit */}
      <Dialog open={bukaDialog} onOpenChange={setBukaDialog}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>{edit ? "Edit Produk" : "Produk Baru"}</DialogTitle>
          </DialogHeader>
          <FormProduk
            awal={edit}
            selesai={() => {
              setBukaDialog(false);
              void muat();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ===== Form tambah/edit produk ===== */
function FormProduk({ awal, selesai }: { awal: Product | null; selesai: () => void }) {
  const [nama, setNama] = useState(awal?.name ?? "");
  const [deskripsi, setDeskripsi] = useState(awal?.description ?? "");
  const [harga, setHarga] = useState(awal ? String(awal.price) : "");
  const [aktif, setAktif] = useState(awal?.is_active ?? true);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(awal?.image_url ?? null);
  const [proses, setProses] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function pilihFoto(f: File | null) {
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      toast.error("Format foto harus JPG, PNG, atau WebP ya.");
      return;
    }
    if (f.size > 4 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 4 MB ya.");
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    if (!nama.trim()) {
      toast.error("Nama produk wajib diisi.");
      return;
    }
    const hargaNum = Number(harga.replace(/[^0-9]/g, ""));
    if (!hargaNum || hargaNum < 1000 || hargaNum > 10_000_000) {
      toast.error("Isi harga yang masuk akal (min Rp 1.000).");
      return;
    }

    setProses(true);
    try {
      const supabase = createClient();

      // 1. Upload foto baru bila diganti
      let imageUrl: string | null = awal?.image_url ?? null;
      if (file) {
        const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
        const path = `produk/${Date.now()}.${ext}`;
        const { error: errUpload } = await supabase.storage
          .from("product-images")
          .upload(path, file, { contentType: file.type });
        if (errUpload) {
          toast.error("Gagal upload foto. Coba lagi ya.");
          return;
        }
        const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
        // Hapus foto lama bila ada
        if (awal?.image_url) {
          const lama = awal.image_url.split("/product-images/")[1];
          if (lama) await supabase.storage.from("product-images").remove([decodeURIComponent(lama)]);
        }
        imageUrl = pub.publicUrl;
      }

      const payload = {
        name: nama.trim(),
        description: deskripsi.trim(),
        price: hargaNum,
        is_active: aktif,
        image_url: imageUrl,
      };

      const { error } = awal
        ? await supabase.from("products").update(payload).eq("id", awal.id)
        : await supabase.from("products").insert(payload);

      if (error) {
        toast.error("Gagal menyimpan produk. Coba lagi ya.");
        return;
      }
      toast.success(awal ? "Produk diperbarui" : "Produk baru ditambahkan");
      selesai();
    } finally {
      setProses(false);
    }
  }

  return (
    <form onSubmit={simpan} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="p-nama">Nama produk *</Label>
        <Input
          id="p-nama"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          className="h-11 rounded-2xl"
          placeholder="Brownies Kukus Lumer"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="p-desk">Deskripsi</Label>
        <Textarea
          id="p-desk"
          value={deskripsi}
          onChange={(e) => setDeskripsi(e.target.value)}
          className="rounded-2xl"
          rows={2}
          placeholder="Ciri khas, ukuran, isi per box..."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="p-harga">Harga (Rp) *</Label>
        <Input
          id="p-harga"
          inputMode="numeric"
          value={harga}
          onChange={(e) => setHarga(e.target.value.replace(/[^0-9]/g, ""))}
          className="h-11 rounded-2xl"
          placeholder="85000"
        />
        {harga && (
          <p className="text-xs text-muted-foreground">
            = {formatRupiah(Number(harga.replace(/[^0-9]/g, "") || 0))}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Foto produk</Label>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          aria-label="Pilih foto produk"
          onChange={(e) => pilihFoto(e.target.files?.[0] ?? null)}
        />
        {previewUrl ? (
          <div className="flex items-center gap-3">
            <img
              src={previewUrl}
              alt="Pratinjau foto produk"
              className="h-20 w-20 rounded-2xl object-cover"
            />
            <div className="flex flex-col gap-1">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-full"
                onClick={() => inputRef.current?.click()}
              >
                Ganti Foto
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full text-rose-500"
                onClick={() => {
                  setFile(null);
                  setPreviewUrl(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
              >
                Hapus Foto
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 px-4 py-5 hover:border-primary/60"
          >
            <UploadCloud className="h-6 w-6 text-primary" />
            <span className="text-sm font-semibold text-primary">Pilih Foto</span>
            <span className="text-xs text-muted-foreground">JPG/PNG/WebP • maks 4 MB</span>
          </button>
        )}
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-muted/60 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Tampilkan di katalog</p>
          <p className="text-xs text-muted-foreground">
            Nonaktif = pembeli tidak melihat produk ini.
          </p>
        </div>
        <Switch checked={aktif} onCheckedChange={setAktif} aria-label="Status aktif produk" />
      </div>

      <Button type="submit" disabled={proses} className="h-12 rounded-full font-bold">
        {proses ? <Loader2 className="h-5 w-5 animate-spin" /> : "Simpan Produk"}
      </Button>
    </form>
  );
}
