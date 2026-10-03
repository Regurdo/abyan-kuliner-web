-- ============================================================================
-- TOKO KUE IBU — DATA CONTOH (SEED)
-- ----------------------------------------------------------------------------
-- Fungsi file ini:
--   1. Mengisi 5 produk kue contoh supaya katalog langsung terlihat
--   2. Membuat 1 batch PO percobaan dengan kuota tiap produk
--
-- Jalankan SETELAH schema.sql.
-- Aman dijalankan ulang: data contoh hanya dibuat jika tabel masih kosong.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) 5 PRODUK KUE CONTOH
--    (foto diisi belakangan lewat dashboard admin, jadi image_url dibiarkan kosong)
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from public.products) then
    insert into public.products (name, description, price, is_active) values
    ('Brownies Kukus Lumer',
     'Brownies kukus lumer dengan lapisan keju parut melimpah di atasnya. Tekstur lembut, tidak terlalu manis. Dijual per loyang 20x20 cm, dipotong 16 potong.',
     85000, true),
    ('Bolu Pandan Kukus',
     'Bolu pandan super lembut tanpa pengawet, wangi pandan asli dari daun segar. Cocok untuk teman minum teh. Satu loyang utuh.',
     90000, true),
    ('Nastar Keju',
     'Kue kering nastar dengan isi selai nanas asli buatan sendiri dan taburan keju melimpah. Renyahnya awet sampai 3 minggu. Per toples 500 gram.',
     95000, true),
    ('Kastengel Cheddar',
     'Kue kering keju cheddar asli, gurih dan renyah, dibuat dari mentega premium. Favorit anak-anak. Per toples 500 gram.',
     100000, true),
    ('Puding Lumut Mini',
     'Puding lumut mini bertabur serundeng kelapa gurih dengan saus santan. Manis pas, segar. Per box isi 20 cup.',
     60000, true);
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 2) 1 BATCH PO PERCOBAAN (hanya dibuat jika belum ada batch sama sekali)
--    * Siap diantar: 7 hari dari sekarang
--    * Batas akhir pemesanan: 3 hari dari sekarang
--    * Status: AKTIF, dengan kuota 20 untuk tiap produk
-- ----------------------------------------------------------------------------
do $$
declare
  v_batch_id uuid;
begin
  if not exists (select 1 from public.batches) then
    insert into public.batches (name, ready_date, order_deadline, is_active)
    values ('Batch Contoh Minggu Depan', current_date + 7, now() + interval '3 days', true)
    returning id into v_batch_id;

    insert into public.batch_products (batch_id, product_id, quota, remaining)
    select v_batch_id, p.id, 20, 20 from public.products p;
  end if;
end $$;

-- ============================================================================
-- SELESAI. Cek lewat menu "Table Editor" di dashboard Supabase:
-- tabel products harus berisi 5 kue, dan batches berisi 1 batch aktif.
-- ============================================================================
