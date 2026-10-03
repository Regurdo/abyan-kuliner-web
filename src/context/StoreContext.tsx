"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Batch, Product, ProductWithQuota, StoreSettings } from "@/lib/types";

/**
 * Data toko: pengaturan toko + batch PO aktif + katalog produk (dengan sisa kuota).
 * Semua diambil dari Supabase dengan keamanan RLS (hanya data publik).
 * Kalau kunci Supabase belum diisi, aplikasi jalan dalam "mode contoh"
 * memakai data demo supaya tampilan tetap bisa dilihat.
 */

// Data contoh (sama dengan seed.sql) untuk mode demo
const PRODUK_DEMO: ProductWithQuota[] = [
  {
    id: "demo-1",
    name: "Brownies Kukus Lumer",
    description:
      "Brownies kukus lumer dengan lapisan keju parut melimpah. Per loyang 20x20 cm.",
    price: 85000,
    image_url: null,
    is_active: true,
    remaining: 20,
  },
  {
    id: "demo-2",
    name: "Bolu Pandan Kukus",
    description:
      "Bolu pandan super lembut tanpa pengawet, wangi pandan asli. Satu loyang utuh.",
    price: 90000,
    image_url: null,
    is_active: true,
    remaining: 20,
  },
  {
    id: "demo-3",
    name: "Nastar Keju",
    description:
      "Nastar isi selai nanas asli dengan taburan keju melimpah. Per toples 500 gram.",
    price: 95000,
    image_url: null,
    is_active: true,
    remaining: 20,
  },
  {
    id: "demo-4",
    name: "Kastengel Cheddar",
    description:
      "Kue kering keju cheddar asli, gurih dan renyah dari mentega premium. Per toples 500 gram.",
    price: 100000,
    image_url: null,
    is_active: true,
    remaining: 20,
  },
  {
    id: "demo-5",
    name: "Puding Lumut Mini",
    description:
      "Puding lumut mini dengan serundeng gurih dan saus santan. Per box isi 20 cup.",
    price: 60000,
    image_url: null,
    is_active: true,
    remaining: 20,
  },
];

interface StoreContextValue {
  configured: boolean; // kunci Supabase sudah diisi?
  loading: boolean;
  error: string | null;
  settings: StoreSettings | null;
  batch: Batch | null; // batch PO aktif
  products: ProductWithQuota[]; // katalog (produk aktif + sisa kuota)
  muatUlang: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [configured] = useState(isSupabaseConfigured);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [products, setProducts] = useState<ProductWithQuota[]>([]);
  const [tick, setTick] = useState(0);

  const muatUlang = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let batal = false;

    // Mode contoh: tanpa Supabase, pakai data demo
    if (!isSupabaseConfigured) {
      setSettings({
        id: 1,
        store_name: "Kue Ibu (Mode Contoh)",
        whatsapp_number: "6281234567890",
        bank_info: "",
        qris_image_url: null,
        operating_hours: "Setiap hari, 08.00 - 20.00 WIB",
        wa_templates: {},
        is_open: true,
      });
      setBatch({
        id: "demo-batch",
        name: "Batch Contoh",
        ready_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        order_deadline: new Date(Date.now() + 3 * 86400000).toISOString(),
        is_active: true,
      });
      setProducts(PRODUK_DEMO);
      setLoading(false);
      setError(null);
      return;
    }

    async function muat() {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();

        const [settingsRes, batchRes, productsRes] = await Promise.all([
          supabase.from("store_settings").select("*").eq("id", 1).maybeSingle(),
          supabase
            .from("batches")
            .select("*")
            .eq("is_active", true)
            .maybeSingle(),
          supabase.from("products").select("*").eq("is_active", true).order("name"),
        ]);

        if (batal) return;

        if (settingsRes.error) throw settingsRes.error;
        if (productsRes.error) throw productsRes.error;

        setSettings((settingsRes.data as StoreSettings) ?? null);
        const batchAktif = (batchRes.data as Batch) ?? null;
        setBatch(batchAktif);

        const daftar = (productsRes.data as Product[]) ?? [];

        // Ambil kuota tiap produk di batch aktif
        if (batchAktif) {
          const { data: kuota, error: errKuota } = await supabase
            .from("batch_products")
            .select("product_id, quota, remaining")
            .eq("batch_id", batchAktif.id);

          if (batal) return;
          if (errKuota) throw errKuota;

          const map = new Map(
            ((kuota ?? []) as { product_id: string; remaining: number }[]).map(
              (k) => [k.product_id, k.remaining]
            )
          );
          // Produk yang dijual di batch aktif ditampilkan lebih dulu
          setProducts(
            daftar
              .map((p) => ({
                ...p,
                remaining: map.has(p.id) ? (map.get(p.id) as number) : null,
              }))
              .sort(
                (a, b) =>
                  (b.remaining !== null ? 1 : 0) - (a.remaining !== null ? 1 : 0)
              )
          );
        } else {
          setProducts(daftar.map((p) => ({ ...p, remaining: null })));
        }
      } catch (e) {
        if (!batal) {
          console.error(e);
          setError(
            "Gagal memuat data toko. Periksa koneksi internet lalu coba lagi ya."
          );
        }
      } finally {
        if (!batal) setLoading(false);
      }
    }

    muat();
    return () => {
      batal = true;
    };
  }, [tick]);

  const value = useMemo(
    () => ({ configured, loading, error, settings, batch, products, muatUlang }),
    [configured, loading, error, settings, batch, products, muatUlang]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore harus dipakai di dalam StoreProvider");
  return ctx;
}
