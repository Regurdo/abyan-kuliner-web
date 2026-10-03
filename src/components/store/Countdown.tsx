"use client";

import { useEffect, useState } from "react";

/**
 * Hitung mundur menuju batas akhir pemesanan.
 * Menampilkan kotak Hari : Jam : Menit : Detik.
 */
export function Countdown({
  deadlineIso,
  selesaiText = "Batas pemesanan sudah lewat",
}: {
  deadlineIso: string;
  selesaiText?: string;
}) {
  const [sisa, setSisa] = useState<number | null>(null);

  useEffect(() => {
    const target = new Date(deadlineIso).getTime();

    function hitung() {
      setSisa(target - Date.now());
    }
    hitung();
    const timer = setInterval(hitung, 1000);
    return () => clearInterval(timer);
  }, [deadlineIso]);

  if (sisa === null) {
    return (
      <div className="h-14 w-48 animate-pulse rounded-xl bg-white/60" />
    );
  }

  if (sisa <= 0) {
    return (
      <p className="text-sm font-semibold text-rose-600">{selesaiText}</p>
    );
  }

  const hari = Math.floor(sisa / 86400000);
  const jam = Math.floor((sisa % 86400000) / 3600000);
  const menit = Math.floor((sisa % 3600000) / 60000);
  const detik = Math.floor((sisa % 60000) / 1000);

  const kotak = [
    { nilai: hari, label: "Hari" },
    { nilai: jam, label: "Jam" },
    { nilai: menit, label: "Menit" },
    { nilai: detik, label: "Detik" },
  ];

  return (
    <div className="flex items-center gap-2">
      {kotak.map((k, idx) => (
        <div key={k.label} className="flex items-center gap-2">
          <div className="min-w-[52px] rounded-xl bg-white/80 px-2 py-1.5 text-center shadow-sm">
            <div className="font-mono text-lg font-bold leading-none text-primary">
              {String(k.nilai).padStart(2, "0")}
            </div>
            <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {k.label}
            </div>
          </div>
          {idx < kotak.length - 1 && (
            <span className="font-bold text-primary/60">:</span>
          )}
        </div>
      ))}
    </div>
  );
}
