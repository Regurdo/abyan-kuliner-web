"use client";

import Link from "next/link";
import { MessageCircleHeart, Clock, Search, CakeSlice, Heart } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { buatLinkWa } from "@/lib/format";

/** Kaki halaman: info toko + link cepat */
export function Footer() {
  const { settings } = useStore();

  return (
    <footer className="relative mt-10 overflow-hidden border-t border-border/40 bg-gradient-to-b from-primary/5 to-transparent">
      {/* Decorative blob */}
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/5 blur-2xl" />
      <div className="mx-auto w-full max-w-5xl px-4 py-8 pb-24 md:pb-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <p className="flex items-center gap-2 text-base font-bold">
              <CakeSlice className="h-5 w-5 text-primary" strokeWidth={2} />
              {settings?.store_name ?? "Toko Kue Ibu"}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Kue dan makanan rumahan dibuat saat kamu memesan — fresh, homemade,
              penuh cinta.
            </p>
            {settings?.operating_hours && (
              <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Jam aktif: {settings.operating_hours}</span>
              </p>
            )}
          </div>

          <nav className="flex flex-col gap-2 text-sm" aria-label="Tautan cepat">
            <Link href="/lacak" className="inline-flex items-center gap-2 font-medium hover:text-primary transition-colors">
              <Search className="h-4 w-4" /> Lacak Pesanan
            </Link>
            <Link href="/" className="inline-flex items-center gap-2 font-medium hover:text-primary transition-colors">
              <CakeSlice className="h-4 w-4" /> Katalog Kue
            </Link>
            {settings?.whatsapp_number && (
              <a
                href={buatLinkWa(
                  settings.whatsapp_number,
                  "Halo, saya mau tanya-tanya soal kue"
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-medium hover:text-primary transition-colors"
              >
                <MessageCircleHeart className="h-4 w-4" /> Hubungi via WhatsApp
              </a>
            )}
            <Link
              href="/admin"
              className="mt-2 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              Masuk Admin
            </Link>
          </nav>
        </div>

        <p className="mt-8 border-t border-border/40 pt-4 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {settings?.store_name ?? "Toko Kue Ibu"} —
          Dibuat dengan <Heart className="inline h-3 w-3 text-primary fill-primary" /> untuk pembeli tersayang
        </p>
      </div>
    </footer>
  );
}
