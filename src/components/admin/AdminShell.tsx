"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CakeSlice,
  ChefHat,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Package,
  Settings,
  Store,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pesanan", label: "Pesanan", icon: ClipboardList },
  { href: "/admin/rekap", label: "Rekap Produksi", icon: ChefHat },
  { href: "/admin/antar", label: "Pengantaran", icon: MapPin },
  { href: "/admin/produk", label: "Produk", icon: CakeSlice },
  { href: "/admin/batch", label: "Batch", icon: Package },
  { href: "/admin/pengaturan", label: "Pengaturan", icon: Settings },
];

/** Kerangka dashboard admin: sidebar (desktop) + topbar (mobile) */
export function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuBuka, setMenuBuka] = useState(false);

  async function keluar() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Sampai jumpa, Ibu!");
    router.replace("/admin/login");
    router.refresh();
  }

  const itemAktif = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const navLinks = (
    <>
      {NAV.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          onClick={() => setMenuBuka(false)}
          className={`flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
            itemAktif(n.href)
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <n.icon className="h-4.5 w-4.5" />
          {n.label}
        </Link>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-muted/40">
      {/* ===== Topbar mobile ===== */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border/60 bg-card/95 px-4 py-3 backdrop-blur print:hidden lg:hidden">
        <button
          onClick={() => setMenuBuka((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-muted"
          aria-label={menuBuka ? "Tutup menu" : "Buka menu"}
        >
          {menuBuka ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <span className="flex items-center gap-1.5 font-bold">
          <CakeSlice className="h-5 w-5 text-primary" /> Admin Toko Kue
        </span>
        <Button asChild variant="ghost" size="icon" className="rounded-xl" aria-label="Lihat toko">
          <Link href="/" target="_blank">
            <Store className="h-5 w-5" />
          </Link>
        </Button>
      </header>

      {/* ===== Menu mobile (dropdown) ===== */}
      {menuBuka && (
        <nav className="sticky top-[57px] z-30 flex flex-col gap-1 border-b border-border/60 bg-card p-3 print:hidden lg:hidden">
          {navLinks}
          <button
            onClick={keluar}
            className="flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"
          >
            <LogOut className="h-4.5 w-4.5" /> Keluar
          </button>
        </nav>
      )}

      <div className="flex">
        {/* ===== Sidebar desktop ===== */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border/60 bg-card p-4 print:hidden lg:flex">
          <div className="flex items-center gap-2 px-2 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pinksoft">
              <CakeSlice className="h-5 w-5 text-primary" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">Dashboard Ibu</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
          </div>

          <nav className="mt-4 flex flex-col gap-1">{navLinks}</nav>

          <div className="mt-auto flex flex-col gap-1 border-t border-border/60 pt-3">
            <Button asChild variant="secondary" className="justify-start rounded-2xl font-semibold">
              <Link href="/" target="_blank">
                <Store className="h-4 w-4" /> Lihat Toko
              </Link>
            </Button>
            <button
              onClick={keluar}
              className="flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="h-4.5 w-4.5" /> Keluar
            </button>
          </div>
        </aside>

        {/* ===== Konten ===== */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 print:p-0">{children}</main>
      </div>
    </div>
  );
}
