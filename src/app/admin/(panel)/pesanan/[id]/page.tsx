import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, MapPinned, Navigation } from "lucide-react";
import { BadgeStatusPesanan, BadgeStatusBayar } from "@/components/admin/Badge";
import {
  AksiStatusPesanan,
  PanelOngkir,
  TombolWaPembeli,
  VerifikasiBukti,
} from "@/components/admin/AksiPesanan";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatRupiah, formatTanggalWaktu } from "@/lib/format";
import { LABEL_STATUS_PESANAN } from "@/components/admin/Badge";
import type {
  OrderStatus,
  PaymentStatus,
  TrackedOrderItem,
  TrackedOrderHistory,
} from "@/lib/types";

/** Detail satu pesanan + semua aksi ibu */
export default async function DetailPesanan({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  const [res, settingsRes] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "*, order_items(*), order_status_history(*)"
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("store_settings")
      .select("whatsapp_number, bank_info, wa_templates")
      .eq("id", 1)
      .maybeSingle(),
  ]);

  if (!res.data) notFound();

  const p = res.data as {
    id: string;
    code: string;
    customer_name: string;
    customer_whatsapp: string;
    address_text: string;
    lat: number | null;
    lng: number | null;
    notes: string;
    payment_method: string;
    payment_status: PaymentStatus;
    payment_proof_url: string | null;
    subtotal: number;
    shipping_cost: number;
    total: number;
    status: OrderStatus;
    created_at: string;
    order_items: TrackedOrderItem[];
    order_status_history: TrackedOrderHistory[];
  };

  const settings = settingsRes.data as
    | { whatsapp_number: string; bank_info: string; wa_templates: Record<string, string> }
    | null;

  const aksi = {
    id: p.id,
    code: p.code,
    customer_name: p.customer_name,
    status: p.status,
    subtotal: p.subtotal,
    shipping_cost: p.shipping_cost,
    total: p.total,
    payment_method: p.payment_method,
    payment_status: p.payment_status,
    payment_proof_url: p.payment_proof_url,
  };

  const riwayat = [...(p.order_status_history ?? [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      {/* ===== Header ===== */}
      <div>
        <Link
          href="/admin/pesanan"
          className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke daftar
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="font-mono text-2xl font-extrabold text-primary">{p.code}</h1>
          <BadgeStatusPesanan status={p.status} />
          {p.payment_method === "transfer" && <BadgeStatusBayar status={p.payment_status} />}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Masuk {formatTanggalWaktu(p.created_at)}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ===== Kolom kiri: info pesanan ===== */}
        <div className="flex flex-col gap-5">
          {/* Pembeli & alamat */}
          <section className="rounded-3xl border border-border/70 bg-card p-5">
            <h2 className="text-base font-bold">Pembeli & Alamat</h2>
            <dl className="mt-3 flex flex-col gap-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Nama</dt>
                <dd className="text-right font-semibold">{p.customer_name}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">WhatsApp</dt>
                <dd className="text-right font-mono">{p.customer_whatsapp}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Metode</dt>
                <dd className="font-semibold">{p.payment_method === "cod" ? "COD" : "Transfer"}</dd>
              </div>
            </dl>
            <div className="mt-3 flex flex-col gap-2 rounded-2xl bg-muted/60 p-4 text-sm">
              <p className="flex gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  <span className="font-semibold">Alamat:</span> {p.address_text}
                </span>
              </p>
              {p.notes && (
                <p>
                  <span className="font-semibold">Catatan:</span> {p.notes}
                </p>
              )}
              {p.lat != null && p.lng != null ? (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=driving`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 font-semibold text-primary underline-offset-2 hover:underline"
                >
                  <Navigation className="h-4 w-4" /> Buka rute di Google Maps
                </a>
              ) : (
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPinned className="h-4 w-4" /> Pembeli tidak memasang pin lokasi
                </p>
              )}
            </div>
          </section>

          {/* Item & total */}
          <section className="rounded-3xl border border-border/70 bg-card p-5">
            <h2 className="text-base font-bold">Item Pesanan</h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {p.order_items.map((i) => (
                <li key={i.product_name} className="flex justify-between gap-2">
                  <span>
                    {i.product_name} ×{i.quantity}{" "}
                    <span className="text-muted-foreground">
                      (@ {formatRupiah(i.unit_price)})
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold">{formatRupiah(i.subtotal)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-col gap-1 border-t border-border pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatRupiah(p.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ongkir</span>
                <span>{formatRupiah(p.shipping_cost)}</span>
              </div>
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="text-primary">{formatRupiah(p.total)}</span>
              </div>
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <PanelOngkir pesanan={aksi} />
            </div>
          </section>

          {/* Riwayat status */}
          <section className="rounded-3xl border border-border/70 bg-card p-5">
            <h2 className="text-base font-bold">Riwayat Status</h2>
            <ol className="mt-3 flex flex-col gap-2 text-sm">
              {riwayat.map((h, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary/60" />
                  <div>
                    <p className="font-semibold">{LABEL_STATUS_PESANAN[h.status] ?? h.status}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTanggalWaktu(h.created_at)}
                      {h.note ? ` — ${h.note}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* ===== Kolom kanan: aksi ===== */}
        <div className="flex flex-col gap-5">
          <section className="rounded-3xl border border-border/70 bg-card p-5">
            <h2 className="text-base font-bold">Ubah Status</h2>
            <div className="mt-3">
              <AksiStatusPesanan pesanan={aksi} />
            </div>
          </section>

          {p.payment_method === "transfer" && (
            <section className="rounded-3xl border border-border/70 bg-card p-5">
              <h2 className="text-base font-bold">Pembayaran Transfer</h2>
              <div className="mt-3">
                <VerifikasiBukti pesanan={aksi} />
              </div>
            </section>
          )}

          <section className="rounded-3xl border border-border/70 bg-card p-5">
            <h2 className="text-base font-bold">Kabar ke Pembeli</h2>
            <p className="mb-2 mt-1 text-xs text-muted-foreground">
              Pilih template, pratinjau muncul, lalu kirim via WhatsApp.
            </p>
            <TombolWaPembeli
              pesanan={aksi}
              nomorIbu={settings?.whatsapp_number ?? ""}
              templates={settings?.wa_templates ?? {}}
              bankInfo={settings?.bank_info ?? ""}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
