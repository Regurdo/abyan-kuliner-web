"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartItem } from "@/lib/types";

/**
 * Keranjang belanja — disimpan di HP pembeli (localStorage),
 * jadi tidak perlu login dan tidak hilang saat halaman ditutup.
 */
interface CartContextValue {
  items: CartItem[];
  count: number; // total pcs
  subtotal: number;
  tambah: (item: Omit<CartItem, "qty">, qty?: number) => void;
  ubahQty: (productId: string, qty: number) => void;
  hapus: (productId: string) => void;
  kosongkan: () => void;
  qtyProduk: (productId: string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "kue-ibu-keranjang-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [siap, setSiap] = useState(false);

  // Muat keranjang tersimpan saat pertama kali dibuka (hanya di browser).
  // Ini memang harus setelah render pertama (SSR tidak punya localStorage),
  // jadi setState di sini disengaja dan aman.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // data rusak -> abaikan
    }
    setSiap(true);
  }, []);

  // Simpan setiap perubahan
  useEffect(() => {
    if (!siap) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // penyimpanan penuh -> abaikan
    }
  }, [items, siap]);

  const tambah = useCallback(
    (item: Omit<CartItem, "qty">, qty = 1) => {
      setItems((prev) => {
        const lama = prev.find((i) => i.productId === item.productId);
        // Batasi jumlah agar tidak melewati sisa kuota
        const maks = item.remaining ?? 99;
        if (lama) {
          const qtyBaru = Math.min(lama.qty + qty, maks);
          return prev.map((i) =>
            i.productId === item.productId ? { ...i, ...item, qty: qtyBaru } : i
          );
        }
        return [...prev, { ...item, qty: Math.min(qty, maks) }];
      });
    },
    []
  );

  const ubahQty = useCallback((productId: string, qty: number) => {
    setItems((prev) =>
      prev.flatMap((i) => {
        if (i.productId !== productId) return [i];
        const maks = i.remaining ?? 99;
        if (qty <= 0) return []; // otomatis hapus kalau 0
        return [{ ...i, qty: Math.min(qty, maks) }];
      })
    );
  }, []);

  const hapus = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const kosongkan = useCallback(() => setItems([]), []);

  const qtyProduk = useCallback(
    (productId: string) => items.find((i) => i.productId === productId)?.qty ?? 0,
    [items]
  );

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((a, i) => a + i.qty, 0);
    const subtotal = items.reduce((a, i) => a + i.qty * i.price, 0);
    return { items, count, subtotal, tambah, ubahQty, hapus, kosongkan, qtyProduk };
  }, [items, tambah, ubahQty, hapus, kosongkan, qtyProduk]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart harus dipakai di dalam CartProvider");
  return ctx;
}
