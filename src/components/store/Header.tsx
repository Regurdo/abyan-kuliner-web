"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBasket, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useStore } from "@/context/StoreContext";

/** Kepala halaman: logo (diam) + nama toko, lacak pesanan & keranjang */
export function Header() {
  const { count } = useCart();
  const { settings } = useStore();
  const jumlah = count > 99 ? "99+" : count;

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/85 backdrop-blur-lg">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-3 px-4">
        {/* Logo statis — tanpa animasi */}
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <Image
            src="/logo.svg"
            alt="Abyan Kuliner"
            width={40}
            height={40}
            priority
            className="h-10 w-10 shrink-0 rounded-2xl bg-white object-contain shadow-sm ring-1 ring-border/50"
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-extrabold leading-tight tracking-tight sm:text-base">
              {settings?.store_name ?? "Toko Kue Ibu"}
            </span>
            <span className="block truncate text-[11px] leading-tight text-muted-foreground">
              Kue rumahan · pre-order
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-10 rounded-xl border-2 border-primary/20 bg-primary/5 px-2.5 font-bold text-primary hover:bg-primary/10 hover:text-primary sm:px-4"
          >
            <Link href="/lacak" aria-label="Lacak pesanan" className="flex items-center gap-1.5">
              <Search className="h-4 w-4 shrink-0" />
              <span className="hidden text-xs sm:inline sm:text-sm">Lacak Pesanan</span>
            </Link>
          </Button>

          <Button
            asChild
            size="sm"
            className="relative h-10 shrink-0 rounded-xl px-2.5 font-bold shadow-sm sm:px-4"
          >
            <Link href="/keranjang" aria-label="Keranjang" className="flex items-center gap-1.5">
              <ShoppingBasket className="h-4 w-4 shrink-0" />
              <span className="hidden text-xs sm:inline sm:text-[13px]">
                Keranjang
              </span>
              {count > 0 && (
                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold leading-none text-background">
                  {jumlah}
                </span>
              )}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
