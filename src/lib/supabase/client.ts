"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Koneksi Supabase untuk browser (dipakai halaman pembeli).
 * Kalau .env.local belum diisi, aplikasi tetap jalan dalam
 * "mode contoh" (lihat StoreContext) tanpa error.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** true kalau kunci Supabase sudah diisi */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** Client Supabase sisi browser (panggil hanya saat isSupabaseConfigured === true) */
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
