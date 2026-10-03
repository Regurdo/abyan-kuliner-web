"use client";

import { MapPin, ShoppingBasket, MessageCircle, Sparkles, ArrowRight, ChefHat, Truck } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { StoreBanner } from "@/components/store/StoreBanner";
import { ProductCard } from "@/components/store/ProductCard";
import { EmptyState } from "@/components/store/EmptyState";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buatLinkWa } from "@/lib/format";

/** Halaman utama: hero besar, cara pesan, katalog kue */
export default function HalamanUtama() {
  const { settings, batch, products, loading } = useStore();
  const buka = settings?.is_open ?? false;

  const dijual = products.filter((p) => p.remaining !== null);
  const daftar = dijual.length > 0 ? dijual : products;

  return (
    <div className="flex flex-col gap-10 pb-10">
      {/* ===== HERO BESAR ===== */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 px-6 py-12 sm:px-10 sm:py-16 text-primary-foreground">
        {/* Decorative blobs */}
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 left-0 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute right-1/4 top-10 h-20 w-20 rounded-full bg-white/15" />
        <div aria-hidden className="pointer-events-none absolute left-1/3 bottom-6 h-14 w-14 rounded-full bg-white/10" />

        {/* Floating decorative icons */}
        <div aria-hidden className="pointer-events-none absolute right-6 top-6 rotate-12 text-white/20 sm:right-14 sm:top-10">
          <ChefHat className="h-16 w-16 sm:h-24 sm:w-24" strokeWidth={1} />
        </div>
        <div aria-hidden className="pointer-events-none absolute bottom-10 right-1/4 -rotate-6 text-white/15">
          <Truck className="h-12 w-12 sm:h-16 sm:w-16" strokeWidth={1} />
        </div>

        <div className="relative max-w-lg">
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1.5 text-xs font-bold backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Pre-order kue premium
          </div>
          <h1 className="text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-5xl">
            {settings?.store_name ?? "Toko Kue Ibu"}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/80 sm:text-base sm:leading-relaxed">
            Dibuat fresh saat ada yang pesan, diantar langsung oleh ibu ke
            rumahmu. Pilih kue favoritmu, tempel pin lokasimu, selesai!
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-2xl bg-white text-primary font-extrabold shadow-lg shadow-black/10 hover:bg-white/90 gap-2 h-12 px-6 text-sm">
              <Link href="#katalog">
                Lihat Menu <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            {settings?.whatsapp_number && (
              <Button asChild variant="outline" size="lg" className="rounded-2xl border-white/30 bg-white/10 text-white font-bold backdrop-blur-sm hover:bg-white/20 gap-2 h-12 px-5 text-sm">
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
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary uppercase tracking-wider">
            Mudah banget
          </span>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
            Cara Pesan
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="group relative overflow-hidden rounded-3xl border-2 border-primary/15 bg-card p-6 transition-all hover:border-primary/35 hover:shadow-lg hover:-translate-y-1">
            <div aria-hidden className="pointer-events-none absolute -right-5 -bottom-5 h-24 w-24 rounded-full bg-primary/5 transition-transform group-hover:scale-125" />
            <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShoppingBasket className="h-7 w-7" strokeWidth={2} />
            </span>
            <span className="relative mt-1 inline-flex h-7 w-7 items-center justify-center rounded-xl bg-primary text-[11px] font-extrabold text-primary-foreground">
              1
            </span>
            <p className="relative mt-2 text-sm font-bold">
              Pilih Kue Favoritmu
            </p>
            <p className="relative mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
              Masukkan kue ke keranjang, atur jumlah sesuai kuota yang tersedia.
            </p>
          </div>

          <div className="group relative overflow-hidden rounded-3xl border-2 border-primary/15 bg-card p-6 transition-all hover:border-primary/35 hover:shadow-lg hover:-translate-y-1">
            <div aria-hidden className="pointer-events-none absolute -right-5 -bottom-5 h-24 w-24 rounded-full bg-primary/5 transition-transform group-hover:scale-125" />
            <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MapPin className="h-7 w-7" strokeWidth={2} />
            </span>
            <span className="relative mt-1 inline-flex h-7 w-7 items-center justify-center rounded-xl bg-primary text-[11px] font-extrabold text-primary-foreground">
              2
            </span>
            <p className="relative mt-2 text-sm font-bold">
              Checkout & Pin Lokasi
            </p>
            <p className="relative mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
              Isi nama dan alamat, tempel pin di peta biar ibu gampang nyari rumahmu.
            </p>
          </div>

          <div className="group relative overflow-hidden rounded-3xl border-2 border-primary/15 bg-card p-6 transition-all hover:border-primary/35 hover:shadow-lg hover:-translate-y-1">
            <div aria-hidden className="pointer-events-none absolute -right-5 -bottom-5 h-24 w-24 rounded-full bg-primary/5 transition-transform group-hover:scale-125" />
            <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MessageCircle className="h-7 w-7" strokeWidth={2} />
            </span>
            <span className="relative mt-1 inline-flex h-7 w-7 items-center justify-center rounded-xl bg-primary text-[11px] font-extrabold text-primary-foreground">
              3
            </span>
            <p className="relative mt-2 text-sm font-bold">
              Konfirmasi via WA
            </p>
            <p className="relative mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
              Dapat kode pesanan, konfirmasi via WhatsApp, kue diantar sesuai jadwal.
            </p>
          </div>
        </div>
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
                  : "Katalog tetap bisa dilihat, checkout dibuka saat ibu buka pemesanan."
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
    </div>
  );
}
