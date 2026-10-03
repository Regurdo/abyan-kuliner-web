"use client";

import { CakeSlice } from "lucide-react";

/** Foto produk dengan latar pastel — kalau belum ada foto, tampil ikon kue */
export function ProductImage({
  src,
  alt,
  className = "aspect-square",
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${className} w-full rounded-2xl object-cover`}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`${className} flex w-full items-center justify-center rounded-2xl bg-gradient-to-br from-pinksoft via-peach to-mint`}
      aria-label={`Foto ${alt} belum tersedia`}
      role="img"
    >
      <CakeSlice className="h-12 w-12 text-white/90" strokeWidth={1.5} />
    </div>
  );
}
