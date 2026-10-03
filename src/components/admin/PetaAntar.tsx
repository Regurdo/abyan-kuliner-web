"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { formatRupiah } from "@/lib/format";

/**
 * Peta rekap pengantaran: menampilkan PIN bernomor untuk semua lokasi
 * pembeli dalam satu batch. Klik PIN = popup berisi info + tombol rute.
 * (Leaflet + OpenStreetMap, tanpa API key.)
 */

export interface TitikAntar {
  id: string;
  code: string;
  customer_name: string;
  customer_whatsapp: string;
  address_text: string;
  lat: number;
  lng: number;
  total: number;
  payment_method: string;
  payment_status: string;
  status: string;
}

// PIN bulat bernomor — urutannya sama dengan daftar di sebelah/bawah peta
function buatPinNomor(n: number): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div class="kue-pin-num">${n}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

// Pas pusat peta supaya SEMUA pin terlihat
function PasSemua({ titik }: { titik: TitikAntar[] }) {
  const map = useMap();
  useEffect(() => {
    if (titik.length === 0) return;
    if (titik.length === 1) {
      map.setView([titik[0].lat, titik[0].lng], 16);
      return;
    }
    const bounds = L.latLngBounds(titik.map((t) => [t.lat, t.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
  }, [titik, map]);
  return null;
}

const labelBayar: Record<string, string> = {
  belum_bayar: "Belum Bayar",
  menunggu_verifikasi: "Cek Bukti",
  lunas: "Lunas",
};

export default function PetaAntar({ titik }: { titik: TitikAntar[] }) {
  const pins = useMemo(() => titik.map((_, i) => buatPinNomor(i + 1)), [titik]);

  // Pusat awal: rata-rata semua titik (fallback Monas)
  const pusat: [number, number] = useMemo(() => {
    if (titik.length === 0) return [-6.2088, 106.8456];
    const lat = titik.reduce((s, t) => s + t.lat, 0) / titik.length;
    const lng = titik.reduce((s, t) => s + t.lng, 0) / titik.length;
    return [lat, lng];
  }, [titik]);

  return (
    <div className="h-80 overflow-hidden rounded-2xl border border-border sm:h-96">
      <MapContainer center={pusat} zoom={14} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <PasSemua titik={titik} />
        {titik.map((t, i) => (
          <Marker key={t.id} position={[t.lat, t.lng]} icon={pins[i]}>
            <Popup>
              <div className="min-w-48 text-sm">
                <p className="font-bold">
                  {i + 1}. {t.customer_name}
                </p>
                <p className="text-xs text-neutral-600">{t.code}</p>
                <p className="mt-1">{t.address_text}</p>
                <p className="mt-1 font-semibold">{formatRupiah(t.total)}</p>
                <p className="text-xs text-neutral-600">
                  {t.payment_method === "cod" ? "COD" : "Transfer"} · {labelBayar[t.payment_status] ?? t.payment_status}
                </p>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${t.lat},${t.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block rounded-lg bg-pink-500 px-2.5 py-1.5 text-xs font-bold text-white"
                >
                  Rute ke Sini
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
