"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, ShoppingBasket, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/CartContext";
import { useStore } from "@/context/StoreContext";
import { ProductImage } from "@/components/store/ProductImage";
import { QtyStepper } from "@/components/store/QtyStepper";
import { EmptyState } from "@/components/store/EmptyState";
import { formatRupiah, buatLinkWa } from "@/lib/format";

/** Halaman keranjang: ubah jumlah, hapus item, lihat subtotal */
export default function HalamanKeranjang() {
  const { items, ubahQty, hapus, subtotal } = useCart();
  const { settings } = useStore();
  const router = useRouter();

  const buka = settings?.is_open ?? false;

  function lanjutCheckout() {
    router.push("/checkout");
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold">Keranjang</h1>
        <p className="text-sm text-muted-foreground">
          Periksa pesananmu sebelum lanjut ke checkout ya.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          judul="Keranjangmu masih kosong"
          deskripsi="Yuk lihat-lihat kue homemade buatan ibu, ada yang manis-manis lho!"
          aksiLabel="Lihat Katalog Kue"
          aksiHref="/"
        />
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[1fr_340px]">
          {/* Daftar item */}
          <ul className="flex flex-col gap-3">
            {items.map((item) => (
              <li
                key={item.productId}
                className="flex gap-3 rounded-2xl border border-border/50 bg-card p-3"
              >
                <div className="w-20 shrink-0 sm:w-24">
                  <ProductImage
                    src={item.imageUrl}
                    alt={item.name}
                    className="aspect-square"
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold sm:text-base">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRupiah(item.price)} / porsi
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 rounded-full text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                      onClick={() => hapus(item.productId)}
                      aria-label={`Hapus ${item.name} dari keranjang`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <QtyStepper
                      kecil
                      qty={item.qty}
                      min={0}
                      max={item.remaining ?? 99}
                      onChange={(v) => ubahQty(item.productId, v)}
                    />
                    <p className="text-sm font-bold">
                      {formatRupiah(item.price * item.qty)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Ringkasan */}
          <aside className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm lg:sticky lg:top-20">
            <h2 className="font-bold">Ringkasan Pesanan</h2>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ongkir</span>
                <span className="text-xs font-medium text-muted-foreground">
                  dikonfirmasi ibu
                </span>
              </div>
              <Separator className="my-1" />
              <div className="flex items-baseline justify-between">
                <span className="font-semibold">Total sementara</span>
                <span className="text-lg font-bold text-primary">
                  {formatRupiah(subtotal)}
                </span>
              </div>
            </div>

            <p className="mt-3 rounded-xl bg-peach/50 p-3 text-xs leading-relaxed text-foreground/75">
              Ongkos kirim tidak dihitung otomatis.{" "}
              <strong>Ongkir akan dikonfirmasi ibu setelah pesanan diterima</strong>,
              sesuai jarak lokasimu.
            </p>

            {buka ? (
              <Button
                onClick={lanjutCheckout}
                className="mt-4 h-11 w-full rounded-lg text-sm font-bold"
              >
                Lanjut ke Checkout &rarr;
              </Button>
            ) : (
              <div className="mt-4">
                <Button
                  disabled
                  className="h-11 w-full rounded-lg text-sm font-bold"
                >
                  Pemesanan sedang TUTUP
                </Button>
                {settings?.whatsapp_number && (
                  <Button
                    asChild
                    variant="outline"
                    className="mt-2 w-full rounded-lg border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  >
                    <a
                      href={buatLinkWa(
                        settings.whatsapp_number,
                        `Halo ${settings.store_name}! Saya mau pesan lewat WhatsApp ya`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="h-4 w-4" /> Pesan lewat WhatsApp
                    </a>
                  </Button>
                )}
              </div>
            )}

            <Button
              asChild
              variant="ghost"
              className="mt-2 w-full rounded-lg text-muted-foreground"
            >
              <Link href="/">&larr; Belanja lagi</Link>
            </Button>
          </aside>
        </div>
      )}
    </div>
  );
}
