import Link from "next/link";
import {
  ArrowRight,
  BadgeDollarSign,
  CheckCircle2,
  ClipboardList,
  Hand,
  Mail,
  Package,
  ShoppingBasket,
  UtensilsCrossed,
} from "lucide-react";
import { ToggleToko } from "@/components/admin/ToggleToko";
import { GantiPassword } from "@/components/admin/GantiPassword";
import { BadgeStatusPesanan, BadgeStatusBayar } from "@/components/admin/Badge";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatRupiah, formatTanggalWaktu } from "@/lib/format";
import type { OrderStatus, PaymentStatus } from "@/lib/types";

/** Dashboard admin: ringkasan + saklar toko + pesanan terbaru */
export default async function DashboardAdmin() {
  const supabase = await createServerSupabase();

  const [settingsRes, batchRes, statsRes, terbaruRes] = await Promise.all([
    supabase.from("store_settings").select("is_open").eq("id", 1).maybeSingle(),
    supabase.from("batches").select("*").eq("is_active", true).maybeSingle(),
    supabase.from("orders").select("status, payment_method, payment_status, total"),
    supabase
      .from("orders")
      .select("id, code, customer_name, status, payment_method, payment_status, total, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const isOpen = settingsRes.data?.is_open ?? false;
  const pesanan = (statsRes.data ?? []) as {
    status: OrderStatus;
    payment_method: string;
    payment_status: PaymentStatus;
    total: number;
  }[];

  const baru = pesanan.filter((o) => o.status === "baru").length;
  const diproses = pesanan.filter((o) =>
    ["dikonfirmasi", "sedang_dibuat", "siap_diantar", "dalam_pengantaran"].includes(o.status)
  ).length;
  const selesai = pesanan.filter((o) => o.status === "selesai").length;
  const perluCekBukti = pesanan.filter(
    (o) => o.payment_method === "transfer" && o.payment_status === "menunggu_verifikasi"
  ).length;
  const omzetSelesai = pesanan
    .filter((o) => o.status === "selesai")
    .reduce((s, o) => s + o.total, 0);

  const terbaru = (terbaruRes.data ?? []) as {
    id: string;
    code: string;
    customer_name: string;
    status: OrderStatus;
    payment_method: string;
    payment_status: PaymentStatus;
    total: number;
    created_at: string;
  }[];

  const kartu = [
    { label: "Pesanan Baru", nilai: baru, icon: ClipboardList, warna: "bg-pinksoft" },
    { label: "Sedang Diproses", nilai: diproses, icon: UtensilsCrossed, warna: "bg-peach" },
    { label: "Selesai", nilai: selesai, icon: CheckCircle2, warna: "bg-mint" },
    {
      label: "Omzet Selesai",
      nilai: formatRupiah(omzetSelesai),
      icon: BadgeDollarSign,
      warna: "bg-amber-100",
    },
  ];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      {/* ===== Sambutan + saklar toko ===== */}
      <section>
        <h1 className="text-2xl font-extrabold flex items-center gap-2">Halo, Abyan! <Hand className="h-6 w-6" /></h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Ringkasan toko hari ini — semangat jualan ya!
        </p>
      </section>

      <section aria-label="Status toko">
        <ToggleToko awal={isOpen} />
      </section>

      {/* ===== Info batch aktif ===== */}
      {batchRes.data && (
        <section
          aria-label="Batch aktif"
          className="flex flex-wrap items-center justify-between gap-2 rounded-3xl border border-primary/20 bg-primary/5 px-5 py-4"
        >
          <div className="flex items-center gap-2 text-sm">
            <Package className="h-4.5 w-4.5 text-primary" />
            <span className="font-semibold">{batchRes.data.name}</span>
            <span className="text-muted-foreground">
              — kue siap {batchRes.data.ready_date}
            </span>
          </div>
          <Link
            href="/admin/batch"
            className="text-sm font-semibold text-primary underline-offset-2 hover:underline"
          >
            Kelola batch →
          </Link>
        </section>
      )}

      {/* ===== Kartu statistik ===== */}
      <section aria-label="Ringkasan" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kartu.map((k) => (
          <div key={k.label} className="rounded-3xl border border-border/70 bg-card p-4">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-2xl ${k.warna}`}
            >
              <k.icon className="h-5 w-5 text-foreground/70" />
            </span>
            <p className="mt-2 truncate text-xl font-extrabold">{k.nilai}</p>
            <p className="text-xs text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </section>

      {perluCekBukti > 0 && (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-700">
          <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" /> Ada {perluCekBukti} bukti transfer menunggu ibu cek —</span>{" "}
          <Link href="/admin/pesanan?filter=cek_bukti" className="underline underline-offset-2">
            lihat sekarang
          </Link>
        </section>
      )}

      {/* ===== Pesanan terbaru ===== */}
      <section aria-label="Pesanan terbaru" className="rounded-3xl border border-border/70 bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">Pesanan Terbaru</h2>
          <Link
            href="/admin/pesanan"
            className="flex items-center gap-1 text-sm font-semibold text-primary underline-offset-2 hover:underline"
          >
            Lihat semua <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {terbaru.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-muted/60 px-4 py-6 text-center text-sm text-muted-foreground">
            Belum ada pesanan masuk. Saat ada, muncul di sini ya! <ShoppingBasket className="h-4 w-4 inline" />
          </p>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-border/70">
            {terbaru.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/pesanan/${o.id}`}
                  className="flex items-center justify-between gap-3 py-3 hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-bold text-primary">
                      {o.code}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {o.customer_name} • {formatTanggalWaktu(o.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-bold">{formatRupiah(o.total)}</span>
                    <div className="flex gap-1">
                      <BadgeStatusPesanan status={o.status} />
                      {o.payment_method === "transfer" && (
                        <BadgeStatusBayar status={o.payment_status} />
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ===== Keamanan akun ===== */}
      <GantiPassword />
    </div>
  );
}
