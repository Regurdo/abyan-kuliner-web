"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  ShoppingBasket,
  Search,
  CakeSlice,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useStore } from "@/context/StoreContext";
import { StatusBadge } from "./StatusBadge";

/** Kepala halaman: nama toko + status + tombol lacak & keranjang */
export function Header() {
  const { count } = useCart();
  const { settings } = useStore();
  const navRef = useRef<HTMLDivElement>(null);

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/30">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-2 px-4">
        {/* Logo / nama toko */}
        <Link href="/" className="flex min-w-0 items-center gap-2.5 group">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-[-8deg] animate-float">
            <CakeSlice className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-extrabold leading-tight tracking-tight">
              {settings?.store_name ?? "Toko Kue Ibu"}
            </span>
            <span className="block text-[11px] leading-tight text-muted-foreground">
              Kue rumahan · pre-order
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1.5">
          <StatusBadge />
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="rounded-xl px-3"
          >
            <Link href="/lacak">
              <Search className="h-4 w-4" />
              <span className="ml-1.5">Lacak</span>
            </Link>
          </Button>

          <Button
            asChild
            size="sm"
            className="relative rounded-xl pl-3 pr-4 gap-1.5 font-bold shadow-sm"
          >
            <Link href="/keranjang">
              <ShoppingBasket className="h-4 w-4" />
              <span className="text-[13px]">Keranjang</span>
              {count > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-xl bg-foreground px-1 text-[10px] font-bold text-background leading-none">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden rounded-xl h-9 w-9"
          onClick={() => navRef.current?.classList.toggle("hidden")}
          aria-label="Menu navigasi"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile dropdown */}
      <div
        ref={navRef}
        className="hidden md:hidden border-t border-border/30 bg-background/95 backdrop-blur-lg px-4 pb-4 pt-3"
      >
        <div className="flex flex-col gap-2">
          <StatusBadge />
          <Button asChild variant="ghost" size="sm" className="justify-start rounded-xl">
            <Link href="/lacak">
              <Search className="h-4 w-4" />
              <span className="ml-1.5">Lacak Pesanan</span>
            </Link>
          </Button>
          <Button asChild size="sm" className="rounded-xl font-bold shadow-sm justify-start">
            <Link href="/keranjang">
              <ShoppingBasket className="h-4 w-4" />
              <span className="ml-1.5">Keranjang</span>
              {count > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-xl bg-foreground px-1 text-[10px] font-bold text-background leading-none">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
