"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { formatRupiah } from "@/lib/format";
import type { ProductWithQuota } from "@/lib/types";
import { ProductImage } from "./ProductImage";
import { QtyStepper } from "./QtyStepper";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShoppingBasket } from "lucide-react";

/** Kartu kue di katalog: foto, nama, harga, sisa kuota, tombol tambah */
export function ProductCard({ product }: { product: ProductWithQuota }) {
  const { tambah, qtyProduk, ubahQty } = useCart();
  const [menambah, setMenambah] = useState(false);

  const habis = product.remaining !== null && product.remaining <= 0;
  const tidakDijual = product.remaining === null; // tidak ikut batch aktif
  const qty = qtyProduk(product.id);
  const sisa = product.remaining;

  function handleTambah() {
    setMenambah(true);
    try {
      tambah(
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.image_url,
          remaining: sisa,
        },
        1
      );
      toast.success(`${product.name} masuk keranjang`);
    } finally {
      setMenambah(false);
    }
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm transition-all hover:border-primary/30 hover:shadow-md sm:hover:-translate-y-0.5">
      <div className="relative p-2.5 pb-0 sm:p-3 sm:pb-0">
        <ProductImage src={product.image_url} alt={product.name} />

        {/* Lencana sisa kuota / habis */}
        <div className="absolute left-4 top-4 sm:left-5 sm:top-5">
          {habis ? (
            <span className="rounded-full bg-rose-500/95 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
              Habis
            </span>
          ) : tidakDijual ? (
            <span className="rounded-full bg-neutral-500/90 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
              Tidak dijual di batch ini
            </span>
          ) : typeof sisa === "number" ? (
            <span className="rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-bold text-teal-700 shadow-sm">
              Sisa {sisa}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <h3 className="text-sm font-semibold leading-snug sm:text-base">
          {product.name}
        </h3>
        <p className="line-clamp-2 text-xs text-muted-foreground sm:text-[13px]">
          {product.description || "Kue rumahan buatan ibu."}
        </p>
        <p className="mt-auto pt-1 text-base font-extrabold text-primary sm:text-lg">
          {formatRupiah(product.price)}
        </p>

        {/* Aksi */}
        <div className="pt-1.5">
          {habis || tidakDijual ? (
            <Button
              disabled
              variant="secondary"
              className="w-full rounded-xl opacity-70"
            >
              {habis ? "Habis" : "Tidak tersedia"}
            </Button>
          ) : qty > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-1 sm:gap-2">
              <QtyStepper
                qty={qty}
                min={0}
                max={sisa ?? 99}
                onChange={(v) => ubahQty(product.id, v)}
              />
              <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
                di keranjang
              </span>
            </div>
          ) : (
            <Button
              onClick={handleTambah}
              disabled={menambah}
              className="h-10 w-full gap-1.5 rounded-xl font-bold"
            >
              <ShoppingBasket className="h-4 w-4" /> Tambah
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
