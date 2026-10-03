"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Copy, MessageCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRupiah, buatLinkWa } from "@/lib/format";
import type { LastOrder } from "@/lib/types";
import { toast } from "sonner";

/** Halaman setelah checkout sukses: kode pesanan + tombol konfirmasi WA */
export default function HalamanSukses() {
  return (
    <Suspense
      fallback={<div className="mt-8 h-72 animate-pulse rounded-2xl bg-card" />}
    >
      <SuksesContent />
    </Suspense>
  );
}

function SuksesContent() {
  const params = useSearchParams();
  const kode = params.get("kode") ?? "";
  const [pesanan, setPesanan] = useState<LastOrder | null>(null);

  // Ambil rincian pesanan yang barusan dibuat (disimpan saat checkout).
  // Harus setelah render pertama karena localStorage hanya ada di browser.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("kue-ibu-pesanan-terakhir");
      if (raw) {
        const data = JSON.parse(raw) as LastOrder;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (!kode || data.code === kode) setPesanan(data);
      }
    } catch {
      // abaikan
    }
  }, [kode]);

  function salinKode() {
    navigator.clipboard.writeText(kode);
    toast.success("Kode pesanan disalin");
  }

  // Susun pesan WhatsApp otomatis
  const teksWa = pesanan
    ? [
        "Halo Toko Kue Ibu! Saya baru saja memesan lewat website",
        "",
        `Kode Pesanan: ${pesanan.code}`,
        `Nama: ${pesanan.customerName}`,
        "",
        "Pesanan:",
        ...pesanan.items.map(
          (i) => `- ${i.name} x${i.qty} = ${formatRupiah(i.subtotal)}`
        ),
        "",
        `Subtotal: ${formatRupiah(pesanan.subtotal)}`,
        "Ongkir: menunggu konfirmasi ibu",
        `Metode bayar: ${pesanan.paymentMethod === "cod" ? "COD" : "Transfer"}`,
        "",
        `Alamat: ${pesanan.addressText}`,
        pesanan.notes ? `Catatan: ${pesanan.notes}` : "",
        "",
        "Mohon dikonfirmasi ya, terima kasih!",
      ]
        .filter(Boolean)
        .join("\n")
    : `Halo Toko Kue Ibu! Saya mau konfirmasi pesanan dengan kode: ${kode}`;

  // Nomor WA ibu disimpan bersama rincian saat checkout? gunakan settings umum:
  // Untuk Tahap 2, tombol WA memakai nomor yang tersimpan di localStorage settings.
  const [nomorIbu, setNomorIbu] = useState<string>("6281234567890");
  useEffect(() => {
    try {
      const raw = localStorage.getItem("kue-ibu-pengaturan-wa");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setNomorIbu(raw);
    } catch {
      // abaikan
    }
  }, []);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-5 pb-8 pt-4 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <CheckCircle2 className="h-10 w-10 text-primary" />
      </span>

      <div>
        <h1 className="text-2xl font-bold">Pesanan diterima!</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Teruskan konfirmasinya ke ibu supaya pesananmu segera diproses.
        </p>
      </div>

      {/* Kode pesanan */}
      <div className="w-full rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Kode Pesananmu
        </p>
        <div className="mt-2 flex items-center justify-center gap-2">
          <p className="font-mono text-2xl font-bold text-primary sm:text-3xl">
            {kode || "—"}
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={salinKode}
            aria-label="Salin kode pesanan"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Simpan kode ini untuk melacak pesanan & menghubungi ibu.
        </p>

        {pesanan && (
          <div className="mt-4 rounded-xl bg-muted/50 p-4 text-left text-sm">
            <p className="font-semibold">Ringkasan:</p>
            <ul className="mt-1.5 flex flex-col gap-1">
              {pesanan.items.map((i) => (
                <li key={i.name} className="flex justify-between gap-2">
                  <span>
                    {i.name} ×{i.qty}
                  </span>
                  <span>{formatRupiah(i.subtotal)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex justify-between border-t border-border pt-2 font-bold">
              <span>Total sementara</span>
              <span className="text-primary">{formatRupiah(pesanan.subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Ongkir akan dikonfirmasi ibu setelah pesanan diterima.
            </p>
          </div>
        )}
      </div>

      {/* Tombol aksi */}
      <div className="flex w-full flex-col gap-2">
        <Button
          asChild
          className="h-11 w-full rounded-lg bg-emerald-600 text-sm font-bold hover:bg-emerald-700"
        >
          <a
            href={buatLinkWa(nomorIbu, teksWa)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle className="h-5 w-5" /> Konfirmasi via WhatsApp
          </a>
        </Button>
        <Button asChild variant="secondary" className="h-11 w-full rounded-lg font-semibold">
          <Link href={`/lacak?kode=${encodeURIComponent(kode)}`}>
            <Search className="h-4 w-4" /> Lacak Pesanan
          </Link>
        </Button>
        <Button asChild variant="ghost" className="rounded-lg text-muted-foreground">
          <Link href="/">&larr; Kembali ke Toko</Link>
        </Button>
      </div>
    </div>
  );
}
