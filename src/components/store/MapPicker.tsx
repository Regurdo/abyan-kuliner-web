"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Peta pemilih titik lokasi (Leaflet + OpenStreetMap, tanpa API key).
 * Pembeli bisa menggeser pin; posisi terbaru dikirim lewat onChange.
 */

// Pin pakai SVG — tidak perlu file ikon bawaan Leaflet
function buatPin(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div class="kue-pin-svg"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40" fill="none"><path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="currentColor"/><circle cx="14" cy="14" r="6" fill="white"/></svg></div>`,
    iconSize: [28, 40],
    iconAnchor: [14, 38],
  });
}

// Geser pusat peta secara halus saat posisi berubah dari luar (cari alamat / lokasi saya)
function Recenter({ pos }: { pos: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (pos) {
      map.setView(pos, Math.max(map.getZoom(), 16), { animate: true });
    }
  }, [pos, map]);
  return null;
}

export default function MapPicker({
  posisi,
  onChange,
  tinggi = "h-72",
}: {
  posisi: { lat: number; lng: number } | null;
  onChange: (lat: number, lng: number) => void;
  tinggi?: string;
}) {
  const pusat: [number, number] = posisi
    ? [posisi.lat, posisi.lng]
    : [-6.2088, 106.8456]; // Monas, Jakarta — pusat default

  const pin = useMemo(() => buatPin(), []);
  const posArr: [number, number] | null = posisi
    ? [posisi.lat, posisi.lng]
    : null;

  return (
    <div className={`overflow-hidden rounded-2xl border border-border ${tinggi}`}>
      <MapContainer
        center={pusat}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter pos={posArr} />
        <Marker
          position={pusat}
          icon={pin}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const target = e.target as L.Marker;
              const { lat, lng } = target.getLatLng();
              onChange(lat, lng);
            },
          }}
        />
      </MapContainer>
    </div>
  );
}
