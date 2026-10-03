"use client";

import { Quote } from "lucide-react";
import { TESTIMONI } from "@/lib/testimoni";

/** Testimoni pembeli — otomatis tersembunyi kalau belum ada data */
export function Testimoni() {
  if (TESTIMONI.length === 0) return null;

  const warna = ["bg-pinksoft", "bg-peach", "bg-mint"];

  return (
    <section aria-label="Testimoni pembeli">
      <div className="mb-4 text-center">
        <span className="inline-flex rounded-full bg-mint px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-accent-foreground">
          Kata Mereka
        </span>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
          Pembeli Senang, Ibu Senang
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {TESTIMONI.map((t, i) => (
          <blockquote
            key={`${t.nama}-${i}`}
            className={`relative rounded-3xl p-5 ${warna[i % warna.length]}`}
          >
            <Quote
              aria-hidden
              className="absolute right-4 top-4 h-6 w-6 text-foreground/15"
            />
            <p className="text-sm leading-relaxed">{t.teks}</p>
            <footer className="mt-3 text-xs font-bold">
              {t.nama}
              {t.info && (
                <span className="font-medium text-muted-foreground">
                  {" "}
                  · {t.info}
                </span>
              )}
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}
