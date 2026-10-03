"use client";

import Link from "next/link";
import { ShoppingBasket, Search, CakeSlice } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useStore } from "@/context/StoreContext";
import { StatusBadge } from "./StatusBadge";

/** Kepala halaman: logo (diam) + nama toko, status, lacak & keranjang */
export function Header() {
  const { count } = useCart();
  const { settings } = useStore();
  const jumlah = count > 99 ? "99+" : count;

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/85 backdrop-blur-lg">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-3 px-4">
        {/* Logo statis — tanpa animasi */}
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <CakeSlice className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-extrabold leading-tight tracking-tight sm:text-base">
              {settings?.store_name ?? "Toko Kue Ibu"}
            </span>
            <span className="block truncate text-[11px] leading-tight text-muted-foreground">
              Kue rumahan · pre-order
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-1.5">
          <StatusBadge className="hidden md:inline-flex" />

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-10 rounded-xl px-2.5 sm:px-3"
          >
            <Link href="/lacak" aria-label="Lacak pesanan">
              <Search className="h-4 w-4" />
              <span className="ml-1.5 hidden sm:inline">Lacak</span>
            </Link>
          </Button>

          <Button
            asChild
            size="sm"
            className="relative h-10 rounded-xl px-3 font-bold shadow-sm sm:px-4"
          >
            <Link href="/keranjang" aria-label="Keranjang">
              <ShoppingBasket className="h-4 w-4" />
              <span className="ml-1.5 hidden text-[13px] sm:inline">
                Keranjang
              </span>
              {count > 0 && (
                <span className="ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold leading-none text-background">
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
