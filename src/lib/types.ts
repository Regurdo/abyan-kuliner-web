/** Tipe data yang dipakai di seluruh aplikasi (mengikuti skema Supabase) */

export type OrderStatus =
  | "baru"
  | "menunggu_pembayaran"
  | "dikonfirmasi"
  | "sedang_dibuat"
  | "siap_diantar"
  | "dalam_pengantaran"
  | "selesai"
  | "dibatalkan";

export type PaymentMethod = "cod" | "transfer";
export type PaymentStatus = "belum_bayar" | "menunggu_verifikasi" | "lunas";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  is_active: boolean;
}

/** Batch PO aktif */
export interface Batch {
  id: string;
  name: string;
  ready_date: string; // yyyy-mm-dd — tanggal kue siap/diantar
  order_deadline: string; // ISO — batas akhir pemesanan
  is_active: boolean;
}

export interface BatchProduct {
  id: string;
  batch_id: string;
  product_id: string;
  quota: number;
  remaining: number;
}

/** Produk + sisa kuota di batch aktif (remaining null = tidak dijual di batch ini) */
export interface ProductWithQuota extends Product {
  remaining: number | null;
}

export interface StoreSettings {
  id: number;
  store_name: string;
  whatsapp_number: string;
  bank_info: string;
  qris_image_url: string | null;
  operating_hours: string;
  wa_templates: Record<string, string>;
  is_open: boolean;
}

/** Item keranjang di sisi browser */
export interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  qty: number;
  /** sisa kuota terakhir yang diketahui, untuk cek cepat di UI */
  remaining?: number | null;
}

/** Rincian pesanan terakhir (disimpan sementara untuk halaman sukses/WA) */
export interface LastOrder {
  code: string;
  customerName: string;
  customerWa: string;
  addressText: string;
  notes: string;
  paymentMethod: PaymentMethod;
  subtotal: number;
  items: { name: string; qty: number; price: number; subtotal: number }[];
}

export interface OrderItemSnapshot {
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

/* ===== Hasil RPC track_order (halaman lacak pesanan) ===== */

export interface TrackedOrderItem {
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface TrackedOrderHistory {
  status: OrderStatus;
  note: string;
  created_at: string;
}

/** Gabungan orders + items + history + info toko dari RPC track_order */
export interface TrackedOrder {
  id: string;
  code: string;
  batch_id: string | null;
  customer_name: string;
  customer_whatsapp: string;
  address_text: string;
  lat: number | null;
  lng: number | null;
  notes: string;
  payment_method: PaymentMethod;
  subtotal: number;
  shipping_cost: number;
  total: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_proof_url: string | null;
  quota_restored: boolean;
  created_at: string;
  items: TrackedOrderItem[];
  history: TrackedOrderHistory[];
  bank_info: string;
  qris_image_url: string | null;
  store_name: string;
}

export interface TrackResult {
  found: boolean;
  message?: string;
  order?: TrackedOrder;
}
