import type { OrderStatus, PaymentStatus } from "./types";

/**
 * Label + warna badge untuk tiap status pesanan.
 * Warna memakai nuansa pastel agar serasi dengan tema toko.
 */
export const ORDER_STATUS_INFO: Record<
  OrderStatus,
  { label: string; badge: string; note: string }
> = {
  baru: {
    label: "Baru",
    badge: "bg-pink-100 text-pink-700 border-pink-200",
    note: "Pesanan diterima, menunggu konfirmasi ibu",
  },
  menunggu_pembayaran: {
    label: "Menunggu Pembayaran",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    note: "Menunggu pembayaran / verifikasi bukti transfer",
  },
  dikonfirmasi: {
    label: "Dikonfirmasi",
    badge: "bg-teal-100 text-teal-700 border-teal-200",
    note: "Pesanan dikonfirmasi, masuk jadwal dibuat",
  },
  sedang_dibuat: {
    label: "Sedang Dibuat",
    badge: "bg-orange-100 text-orange-700 border-orange-200",
    note: "Kue sedang dibuat dengan penuh cinta",
  },
  siap_diantar: {
    label: "Siap Diantar",
    badge: "bg-lime-100 text-lime-700 border-lime-200",
    note: "Kue selesai dan siap diantar",
  },
  dalam_pengantaran: {
    label: "Dalam Pengantaran",
    badge: "bg-violet-100 text-violet-700 border-violet-200",
    note: "Kurir sedang menuju lokasimu",
  },
  selesai: {
    label: "Selesai",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    note: "Pesanan selesai, terima kasih!",
  },
  dibatalkan: {
    label: "Dibatalkan",
    badge: "bg-rose-100 text-rose-700 border-rose-200",
    note: "Pesanan dibatalkan",
  },
};

export const PAYMENT_STATUS_INFO: Record<
  PaymentStatus,
  { label: string; badge: string }
> = {
  belum_bayar: {
    label: "Belum Bayar",
    badge: "bg-neutral-100 text-neutral-600 border-neutral-200",
  },
  menunggu_verifikasi: {
    label: "Menunggu Verifikasi",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
  },
  lunas: {
    label: "Lunas",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cod: "COD (bayar di tempat)",
  transfer: "Transfer Bank / QRIS",
};
