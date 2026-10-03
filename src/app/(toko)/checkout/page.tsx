"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Banknote,
  Landmark,
  Loader2,
  LocateFixed,
  MapPin,
  MessageCircle,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/CartContext";
import { useStore } from "@/context/StoreContext";
import { isSupabaseConfigured, createClient } from "@/lib/supabase/client";
import {
  buatLinkWa,
  formatRupiah,
  isWaValid,
  normalizeWa,
} from "@/lib/format";
import type { PaymentMethod } from "@/lib/types";
import { toast } from "sonner";

// Peta hanya dirender di browser (Leaflet tidak bisa jalan di server)
const MapPicker = dynamic(() => import("@/components/store/MapPicker"), {
  ssr: false,
  loading: () => <div className="h-72 animate-pulse rounded-2xl bg-muted" />,
});

/** Halaman checkout: form pembeli + pin lokasi + metode bayar */
export default function HalamanCheckout() {
  const router = useRouter();
  const { items, subtotal, kosongkan } = useCart();
  const { settings } = useStore();

  const [nama, setNama] = useState("");
  const [wa, setWa] = useState("");
  const [alamat, setAlamat] = useState("");
  const [catatan, setCatatan] = useState("");
  const [metode, setMetode] = useState<PaymentMethod>("cod");
  const [posisi, setPosisi] = useState<{ lat: number; lng: number } | null>(null);

  const [cari, setCari] = useState("");
  const [hasilCari, setHasilCari] = useState<
    { display_name: string; lat: string; lon: string }[]
  >([]);
  const [sedangCari, setSedangCari] = useState(false);
  const [mengirim, setMengirim] = useState(false);
  const [errorForm, setErrorForm] = useState<Record<string, string>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buka = settings?.is_open ?? false;

  // ----- Pencarian alamat (Nominatim/OpenStreetMap, gratis tanpa API key) -----
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (cari.trim().length < 3) {
      setHasilCari([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSedangCari(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=0&limit=5&countrycodes=id&q=${encodeURIComponent(
          cari.trim()
        )}`;
        const res = await fetch(url, { headers: { "Accept-Language": "id" } });
        const data = (await res.json()) as {
          display_name: string;
          lat: string;
          lon: string;
        }[];
        setHasilCari(data);
      } catch {
        setHasilCari([]);
      } finally {
        setSedangCari(false);
      }
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [cari]);

  function pilihHasil(hasil: { display_name: string; lat: string; lon: string }) {
    setPosisi({ lat: parseFloat(hasil.lat), lng: parseFloat(hasil.lon) });
    if (!alamat.trim()) setAlamat(hasil.display_name);
    setHasilCari([]);
    setCari("");
    toast.success("Titik lokasi dipilih");
  }

  function gunakanLokasiSaya() {
    if (!navigator.geolocation) {
      toast.error("Browser kamu tidak mendukung deteksi lokasi.");
      return;
    }
    toast.info("Mencari lokasimu...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosisi({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        toast.success("Lokasimu terpasang di peta (geser pin bila perlu)");
      },
      () => {
        toast.error(
          "Gagal mengambil lokasi. Izinkan akses lokasi di browser lalu coba lagi ya."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function isiAlamatDariPin() {
    if (!posisi) {
      toast.error("Tempel dulu pin lokasinya di peta ya.");
      return;
    }
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=id&lat=${posisi.lat}&lon=${posisi.lng}`;
      const res = await fetch(url);
      const data = (await res.json()) as { display_name?: string };
      if (data.display_name) {
        setAlamat(data.display_name);
        toast.success("Alamat terisi dari pin (boleh diedit)");
      }
    } catch {
      toast.error("Gagal menerjemahkan pin jadi alamat. Tulis manual ya.");
    }
  }

  // ----- Validasi + kirim pesanan -----
  function validasi(): boolean {
    const err: Record<string, string> = {};
    if (nama.trim().length < 2) err.nama = "Nama wajib diisi ya.";
    if (!isWaValid(wa))
      err.wa = "Nomor WhatsApp tidak valid. Contoh: 081234567890";
    if (alamat.trim().length < 10)
      err.alamat = "Tulis alamat lengkap (min. 10 huruf) biar ibu tidak nyasar.";
    if (items.length === 0) err.umum = "Keranjangmu masih kosong.";
    setErrorForm(err);
    return Object.keys(err).length === 0;
  }

  async function kirimPesanan() {
    if (!validasi()) {
      toast.error("Ada data yang belum lengkap, cek lagi ya");
      return;
    }
    setMengirim(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("create_order", {
        payload: {
          customer_name: nama.trim(),
          customer_whatsapp: normalizeWa(wa),
          address_text: alamat.trim(),
          lat: posisi ? String(posisi.lat) : "",
          lng: posisi ? String(posisi.lng) : "",
          notes: catatan.trim(),
          payment_method: metode,
          items: items.map((i) => ({
            product_id: i.productId,
            quantity: i.qty,
          })),
        },
      });

      if (error) {
        // Pesan error sudah ramah dari database (mis. kuota habis / toko tutup)
        toast.error(error.message);
        return;
      }

      const hasil = data as { code: string; total: number };
      // Simpan rincian untuk halaman sukses & tombol WA
      const lastOrder = {
        code: hasil.code,
        customerName: nama.trim(),
        customerWa: normalizeWa(wa),
        addressText: alamat.trim(),
        notes: catatan.trim(),
        paymentMethod: metode,
        subtotal: hasil.total ?? subtotal,
        items: items.map((i) => ({
          name: i.name,
          qty: i.qty,
          price: i.price,
          subtotal: i.price * i.qty,
        })),
      };
      try {
        localStorage.setItem("kue-ibu-pesanan-terakhir", JSON.stringify(lastOrder));
        // Simpan juga nomor WA ibu untuk tombol konfirmasi di halaman sukses
        if (settings?.whatsapp_number) {
          localStorage.setItem("kue-ibu-pengaturan-wa", settings.whatsapp_number);
        }
      } catch {
        // abaikan
      }

      kosongkan();
      toast.success(`Pesanan dibuat! Kode: ${hasil.code}`);
      router.push(`/pesanan/sukses?kode=${encodeURIComponent(hasil.code)}`);
    } catch {
      toast.error("Terjadi kesalahan jaringan. Coba lagi ya.");
    } finally {
      setMengirim(false);
    }
  }

  // ----- Tampilan khusus: keranjang kosong -----
  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-6 pb-8">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 px-6 py-12 text-center">
          <p className="font-bold">Keranjangmu kosong</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tambahkan kue dulu sebelum checkout ya.
          </p>
          <Button asChild className="mt-4 rounded-lg">
            <a href="/">Lihat Katalog Kue</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold">Checkout</h1>
        <p className="text-sm text-muted-foreground">
          Isi data di bawah, tempel pin lokasi, lalu kirim pesananmu.
        </p>
      </div>

      {/* Toko tutup: form dinonaktifkan */}
      {!buka && (
        <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-orange-50 p-5">
          <p className="font-bold">Pemesanan sedang TUTUP</p>
          <p className="mt-1 text-sm leading-relaxed text-foreground/75">
            Kamu bisa isi keranjang dulu, tapi checkout baru bisa dipakai saat
            ibu membuka pemesanan. Mau pesan sekarang juga? Hubungi ibu via
            WhatsApp ya!
          </p>
          {settings?.whatsapp_number && (
            <Button asChild className="mt-3 rounded-lg bg-emerald-600 hover:bg-emerald-700">
              <a
                href={buatLinkWa(
                  settings.whatsapp_number,
                  `Halo ${settings.store_name}! Saya mau pesan kue`
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-4 w-4" /> Hubungi via WhatsApp
              </a>
            </Button>
          )}
        </div>
      )}

      {/* Mode contoh */}
      {!isSupabaseConfigured && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Mode contoh — kunci Supabase belum diisi, pesanan sungguhan belum
          bisa dikirim.
        </div>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_340px]">
        {/* ===== Form ===== */}
        <div className="flex flex-col gap-5 rounded-2xl border border-border/50 bg-card p-5">
          {/* Nama */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nama">Nama kamu *</Label>
            <Input
              id="nama"
              placeholder="Contoh: Sari Dewi"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="h-12 rounded-xl"
              maxLength={100}
            />
            {errorForm.nama && (
              <p className="text-xs font-medium text-rose-600">{errorForm.nama}</p>
            )}
          </div>

          {/* WhatsApp */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="wa">Nomor WhatsApp *</Label>
            <Input
              id="wa"
              inputMode="tel"
              placeholder="Contoh: 081234567890"
              value={wa}
              onChange={(e) => setWa(e.target.value)}
              className="h-12 rounded-xl"
              maxLength={16}
            />
            {errorForm.wa ? (
              <p className="text-xs font-medium text-rose-600">{errorForm.wa}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Dipakai ibu untuk menghubungimu & untuk lacak pesanan.
              </p>
            )}
          </div>

          {/* Alamat */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="alamat">Alamat lengkap *</Label>
            <Textarea
              id="alamat"
              placeholder="Contoh: Jl. Melati No. 12, RT 3 / RW 4, Kel. Sukamaju, Kec. Cibinong, Kab. Bogor, Jawa Barat"
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              className="min-h-24 rounded-xl"
              maxLength={500}
            />
            {errorForm.alamat && (
              <p className="text-xs font-medium text-rose-600">
                {errorForm.alamat}
              </p>
            )}
          </div>

          {/* Peta */}
          <div className="flex flex-col gap-2">
            <Label className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary" /> Titik lokasi rumahmu{" "}
              <span className="font-normal text-muted-foreground">
                (disarankan)
              </span>
            </Label>

            {/* Pencarian alamat */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari alamat... contoh: Jl. Melati Cibinong"
                value={cari}
                onChange={(e) => setCari(e.target.value)}
                className="h-11 rounded-xl pl-9"
              />
              {sedangCari && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
              {hasilCari.length > 0 && (
                <ul className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
                  {hasilCari.map((h, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        className="w-full px-3 py-2.5 text-left text-xs leading-snug hover:bg-pink-50"
                        onClick={() => pilihHasil(h)}
                      >
                        {h.display_name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <MapPicker posisi={posisi} onChange={(lat, lng) => setPosisi({ lat, lng })} />

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-lg"
                onClick={gunakanLokasiSaya}
              >
                <LocateFixed className="h-4 w-4" /> Gunakan lokasi saya
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-lg"
                onClick={isiAlamatDariPin}
              >
                <MapPin className="h-4 w-4" /> Isi alamat dari pin
              </Button>
              <span className="text-xs text-muted-foreground">
                {posisi
                  ? `${posisi.lat.toFixed(5)}, ${posisi.lng.toFixed(5)} — geser pin bila perlu`
                  : "Pin belum dipasang — geser pin atau pakai tombol di atas"}
              </span>
            </div>
          </div>

          {/* Catatan */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="catatan">Catatan pesanan (opsional)</Label>
            <Textarea
              id="catatan"
              placeholder="Contoh: kurangi gula ya, dan tolong tuliskan 'Selamat Ulang Tahun Rina' di box"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="min-h-20 rounded-xl"
              maxLength={500}
            />
          </div>

          {/* Metode pembayaran */}
          <div className="flex flex-col gap-2">
            <Label>Metode pembayaran *</Label>
            <RadioGroup
              value={metode}
              onValueChange={(v) => setMetode(v as PaymentMethod)}
              className="grid gap-2 sm:grid-cols-2"
            >
              <label
                htmlFor="metode-cod"
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                  metode === "cod"
                    ? "border-primary bg-pink-50/60 ring-2 ring-ring/30"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem value="cod" id="metode-cod" className="mt-0.5" />
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    <Banknote className="h-4 w-4 text-primary" /> COD
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Bayar tunai saat kue tiba di rumahmu.
                  </p>
                </div>
              </label>

              <label
                htmlFor="metode-transfer"
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                  metode === "transfer"
                    ? "border-primary bg-pink-50/60 ring-2 ring-ring/30"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem
                  value="transfer"
                  id="metode-transfer"
                  className="mt-0.5"
                />
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    <Landmark className="h-4 w-4 text-primary" /> Transfer / QRIS
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Transfer sesuai total, lalu upload buktinya di halaman lacak.
                  </p>
                </div>
              </label>
            </RadioGroup>
          </div>
        </div>

        {/* ===== Ringkasan pesanan ===== */}
        <aside className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm lg:sticky lg:top-20">
          <h2 className="font-bold">Pesananmu</h2>
          <ul className="mt-3 flex max-h-64 flex-col gap-2 overflow-y-auto scroll-halus text-sm">
            {items.map((i) => (
              <li key={i.productId} className="flex items-start justify-between gap-2">
                <span className="min-w-0">
                  <span className="line-clamp-1">{i.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {i.qty} × {formatRupiah(i.price)}
                  </span>
                </span>
                <span className="shrink-0 font-semibold">
                  {formatRupiah(i.qty * i.price)}
                </span>
              </li>
            ))}
          </ul>

          <Separator className="my-3" />
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold">{formatRupiah(subtotal)}</span>
          </div>
          <div className="mt-1 flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">Ongkir</span>
            <span className="text-xs font-medium text-muted-foreground">
              dikonfirmasi ibu
            </span>
          </div>
          <Separator className="my-3" />
          <div className="flex items-baseline justify-between">
            <span className="font-semibold">Total sementara</span>
            <span className="text-xl font-bold text-primary">
              {formatRupiah(subtotal)}
            </span>
          </div>

          <p className="mt-3 rounded-xl bg-peach/40 p-3 text-xs leading-relaxed text-foreground/75">
            <strong>Ongkir akan dikonfirmasi ibu setelah pesanan diterima</strong>{" "}
            — sesuai jarak lokasimu. Total akhir muncul di halaman lacak pesanan.
          </p>

          <Button
            onClick={kirimPesanan}
            disabled={mengirim || !buka || !isSupabaseConfigured}
            className="mt-4 h-11 w-full rounded-lg text-sm font-bold"
          >
            {mengirim ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Mengirim pesanan...
              </>
            ) : (
              "Kirim Pesanan"
            )}
          </Button>
          <p className="mt-2 text-center text-[11px] leading-relaxed text-muted-foreground">
            Setelah terkirim kamu akan dapat kode pesanan & tombol konfirmasi
            WhatsApp.
          </p>
        </aside>
      </div>
    </div>
  );
}
