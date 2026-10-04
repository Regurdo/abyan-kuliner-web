"use client";

import { MapPin, ShoppingBasket, MessageCircle, Sparkles, ArrowRight } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { StoreBanner } from "@/components/store/StoreBanner";
import { ProductCard } from "@/components/store/ProductCard";
import { EmptyState } from "@/components/store/EmptyState";
import { Galeri } from "@/components/store/Galeri";
import { Testimoni } from "@/components/store/Testimoni";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buatLinkWa } from "@/lib/format";

const LANGKAH = [
  {
    no: 1,
    Icon: ShoppingBasket,
    warna: "bg-pinksoft",
    judul: "Pilih Kue Favoritmu",
    isi: "Masukkan kue ke keranjang, atur jumlah sesuai kuota yang tersedia.",
  },
  {
    no: 2,
    Icon: MapPin,
    warna: "bg-peach",
    judul: "Checkout & Pin Lokasi",
    isi: "Isi nama dan alamat, tempel pin di peta biar kami gampang nyari rumahmu.",
  },
  {
    no: 3,
    Icon: MessageCircle,
    warna: "bg-mint",
    judul: "Konfirmasi via WA",
    isi: "Dapat kode pesanan, konfirmasi via WhatsApp, kue diantar sesuai jadwal.",
  },
];

/** Halaman utama: hero, cara pesan, katalog kue, galeri, testimoni */
export default function HalamanUtama() {
  const { settings, batch, products, loading } = useStore();
  const buka = settings?.is_open ?? false;

  const dijual = products.filter((p) => p.remaining !== null);
  const daftar = dijual.length > 0 ? dijual : products;

  return (
    <div className="flex flex-col gap-10 pb-10 sm:gap-12">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-pinksoft via-peach to-mint px-5 py-10 sm:px-10 sm:py-16">
        {/* Dekorasi pastel (statis) */}
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/50 sm:h-64 sm:w-64" />
        <div aria-hidden className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-white/40" />
        <div aria-hidden className="pointer-events-none absolute right-6 bottom-6 hidden h-16 w-16 rounded-full bg-primary/20 sm:block" />
        <span aria-hidden className="pointer-events-none absolute right-5 top-5 text-4xl sm:right-12 sm:top-10 sm:text-6xl">🧁</span>
        <span aria-hidden className="pointer-events-none absolute bottom-5 right-14 text-3xl sm:bottom-12 sm:right-40 sm:text-5xl">🍰</span>

        <div className="relative max-w-lg">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3.5 py-1.5 text-xs font-bold text-primary shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Pre-order kue rumahan
          </div>
          <h1 className="text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-5xl">
            {settings?.store_name ?? "Toko Kue Ibu"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-foreground/75 sm:text-base">
            Dibuat fresh saat ada yang pesan. Pilih kue favoritmu, tempel pin lokasimu, selesai!
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 gap-2 rounded-2xl px-6 text-sm font-extrabold shadow-lg shadow-primary/25">
              <Link href="#katalog">
                Lihat Menu <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            {settings?.whatsapp_number && (
              <Button asChild variant="outline" size="lg" className="h-12 gap-2 rounded-2xl border-white bg-white/70 px-5 text-sm font-bold hover:bg-white">
                <a
                  href={buatLinkWa(settings.whatsapp_number, "Halo, saya mau tanya-tanya soal kue")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4" /> Tanya via WA
                </a>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* ===== Status toko + batch aktif ===== */}
      <section aria-label="Status pemesanan">
        <StoreBanner />
      </section>

      {/* ===== Cara Pesan ===== */}
      <section aria-label="Cara memesan">
        <div className="mb-5 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
            Mudah banget
          </span>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
            Cara Pesan
          </h2>
        </div>

        <ol className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {LANGKAH.map(({ no, Icon, judul, isi, warna }) => (
            <li
              key={no}
              className="flex items-start gap-4 rounded-3xl border border-border/60 bg-card p-4 shadow-sm sm:flex-col sm:gap-3 sm:p-5"
            >
              {/* Ikon dengan nomor di pojok kanan atas ikon */}
              <div className="relative shrink-0">
                <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${warna}`}>
                  <Icon className="h-7 w-7 text-foreground/80" strokeWidth={2} />
                </span>
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-extrabold leading-none text-primary-foreground ring-2 ring-card">
                  {no}
                </span>
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold sm:text-base">{judul}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {isi}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ===== Katalog ===== */}
      <section id="katalog" aria-label="Katalog kue" className="scroll-mt-20">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Menu Kue</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {batch
                ? buka
                  ? "Batch aktif — pesan sebelum batas waktu ya!"
                  : "Katalog tetap bisa dilihat, checkout dibuka saat Kami buka pemesanan."
                : "Belum ada batch pemesanan aktif saat ini."}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-3xl border-2 border-border/30 bg-card"
              >
                <div className="m-3 mb-0 aspect-square animate-pulse rounded-2xl bg-muted" />
                <div className="space-y-2 p-4">
                  <div className="h-4 w-3/4 animate-pulse rounded-lg bg-muted" />
                  <div className="h-3 w-full animate-pulse rounded-lg bg-muted" />
                  <div className="h-6 w-1/2 animate-pulse rounded-lg bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : daftar.length === 0 ? (
          <EmptyState
            judul="Katalog masih kosong"
            deskripsi="Ibu belum menambahkan kue. Mampir lagi nanti ya!"
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
            {daftar.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <Galeri products={products} />
      <Testimoni />
    </div>
  );
}
