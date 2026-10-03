/** Pil warna untuk status pesanan & pembayaran (dipakai di dashboard admin) */
import type { OrderStatus, PaymentStatus } from "@/lib/types";

export const LABEL_STATUS_PESANAN: Record<OrderStatus, string> = {
  baru: "Baru",
  menunggu_pembayaran: "Menunggu Bayar",
  dikonfirmasi: "Dikonfirmasi",
  sedang_dibuat: "Sedang Dibuat",
  siap_diantar: "Siap Diantar",
  dalam_pengantaran: "Diantar",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
};

const GAYA_STATUS: Record<OrderStatus, string> = {
  baru: "border-pink-200 bg-pink-50 text-pink-700",
  menunggu_pembayaran: "border-amber-200 bg-amber-50 text-amber-700",
  dikonfirmasi: "border-violet-200 bg-violet-50 text-violet-700",
  sedang_dibuat: "border-orange-200 bg-orange-50 text-orange-700",
  siap_diantar: "border-cyan-200 bg-cyan-50 text-cyan-700",
  dalam_pengantaran: "border-teal-200 bg-teal-50 text-teal-700",
  selesai: "border-emerald-200 bg-emerald-50 text-emerald-700",
  dibatalkan: "border-rose-200 bg-rose-50 text-rose-600",
};

export function BadgeStatusPesanan({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${GAYA_STATUS[status]}`}
    >
      {LABEL_STATUS_PESANAN[status] ?? status}
    </span>
  );
}

export const LABEL_STATUS_BAYAR: Record<PaymentStatus, string> = {
  belum_bayar: "Belum Bayar",
  menunggu_verifikasi: "Cek Bukti",
  lunas: "Lunas",
};

const GAYA_BAYAR: Record<PaymentStatus, string> = {
  belum_bayar: "border-rose-200 bg-rose-50 text-rose-600",
  menunggu_verifikasi: "border-amber-200 bg-amber-50 text-amber-700",
  lunas: "border-teal-200 bg-teal-50 text-teal-700",
};

export function BadgeStatusBayar({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${GAYA_BAYAR[status]}`}
    >
      {LABEL_STATUS_BAYAR[status] ?? status}
    </span>
  );
}
