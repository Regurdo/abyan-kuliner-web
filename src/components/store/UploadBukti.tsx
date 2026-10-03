"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon, Loader2, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Widget upload foto bukti transfer.
 * Foto dikirim ke /api/upload-bukti (server) karena bucket-nya privat.
 * Pratinjau foto ditampilkan sebelum dikirim, bisa diganti/dihapus.
 */
export function UploadBukti({
  kode,
  wa,
  sudahAdaBukti,
  onSukses,
}: {
  kode: string;
  wa: string;
  sudahAdaBukti: boolean;
  onSukses: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mengirim, setMengirim] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Buat URL pratinjau lokal & bersihkan saat berganti/lepas mount
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function pilih(f: File | null) {
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      toast.error("Format foto harus JPG, PNG, atau WebP ya.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 5 MB. Coba kompres dulu ya.");
      return;
    }
    setFile(f);
  }

  async function kirim() {
    if (!file) return;
    setMengirim(true);
    try {
      const fd = new FormData();
      fd.set("kode", kode);
      fd.set("wa", wa);
      fd.set("file", file);

      const res = await fetch("/api/upload-bukti", { method: "POST", body: fd });
      const data = (await res.json()) as { ok: boolean; message?: string };

      if (!res.ok || !data.ok) {
        toast.error(data.message ?? "Gagal mengirim bukti. Coba lagi ya.");
        return;
      }
      toast.success(data.message ?? "Bukti transfer terkirim!");
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      onSukses();
    } catch {
      toast.error("Koneksi bermasalah. Periksa internet lalu coba lagi ya.");
    } finally {
      setMengirim(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-label="Pilih foto bukti transfer"
        onChange={(e) => pilih(e.target.files?.[0] ?? null)}
      />

      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 px-4 py-6 text-center transition hover:border-primary/60 hover:bg-primary/10"
        >
          <UploadCloud className="h-8 w-8 text-primary" />
          <span className="text-sm font-semibold text-primary">
            Pilih / Foto Bukti Transfer
          </span>
          <span className="text-xs text-muted-foreground">
            JPG, PNG, atau WebP • maksimal 5 MB
          </span>
        </button>
      ) : (
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-3">
          {preview && (
            <img
              src={preview}
              alt="Pratinjau bukti transfer"
              className="max-h-64 w-full rounded-xl object-contain"
            />
          )}
          <div className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
              <ImageIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{file.name}</span>
            </span>
            <span className="flex shrink-0 gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => inputRef.current?.click()}
                aria-label="Ganti foto"
              >
                <UploadCloud className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-50"
                onClick={() => {
                  setFile(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                aria-label="Hapus foto terpilih"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </span>
          </div>
          <Button
            type="button"
            onClick={kirim}
            disabled={mengirim}
            className="h-11 w-full rounded-lg font-bold"
          >
            {mengirim ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Mengirim...
              </>
            ) : sudahAdaBukti ? (
              "Ganti Bukti Transfer"
            ) : (
              "Kirim Bukti Transfer"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
