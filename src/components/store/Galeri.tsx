"use client";

import type { ProductWithQuota } from "@/lib/types";

/** Galeri foto kue — diambil dari foto produk yang sudah diunggah di admin */
export function Galeri({ products }: { products: ProductWithQuota[] }) {
  const foto = products.filter((p) => p.image_url).slice(0, 8);
  if (foto.length < 2) return null;

  return (
    <section aria-label="Galeri kue">
      <div className="mb-4 text-center">
        <span className="inline-flex rounded-full bg-peach px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-secondary-foreground">
          Galeri
        </span>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
          Intip Kue-kue Ibu
        </h2>
      </div>

      {/* HP: geser samping. Desktop: grid */}
      <div className="scroll-halus -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0">
        {foto.map((p, i) => (
          <figure
            key={p.id}
            className={`relative aspect-square w-40 shrink-0 snap-start overflow-hidden rounded-3xl bg-muted sm:w-auto ${
              i === 0 ? "sm:col-span-2 sm:row-span-2" : ""
            }`}
          >
            <img
              src={p.image_url as string}
              alt={p.name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <figcaption className="absolute inset-x-2 bottom-2 truncate rounded-full bg-white/90 px-3 py-1 text-center text-[11px] font-bold text-foreground shadow-sm">
              {p.name}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
