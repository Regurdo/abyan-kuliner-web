-- ============================================================================
-- TOKO KUE IBU — SKEMA DATABASE LENGKAP (Supabase / PostgreSQL)
-- ----------------------------------------------------------------------------
-- ISI FILE INI:
--   Bagian 1 : Tipe data (enum)  — daftar status supaya tidak ada salah tulis
--   Bagian 2 : Tabel             — 8 tabel utama
--   Bagian 3 : Fungsi bantu      — is_admin, normalize_wa, tanggal otomatis,
--                                  buat profil otomatis saat ada user baru
--   Bagian 4 : Fungsi utama      — create_order (checkout + kuota otomatis,
--                                  anti overselling) & track_order (lacak
--                                  pesanan tanpa membuka tabel ke publik)
--   Bagian 5 : RLS               — aturan siapa boleh baca / tulis tiap tabel
--   Bagian 6 : Storage           — bucket product-images (publik)
--                                  dan payment-proofs (privat)
--   Bagian 7 : Data dasar        — 1 baris pengaturan toko (wajib ada)
--
-- CARA PAKAI (lihat juga PANDUAN-SUPABASE.md):
--   1. Buka dashboard Supabase -> SQL Editor -> New query
--   2. Salin SEMUA isi file ini, paste, lalu klik Run
--   3. Aman dijalankan ulang (anti-duplikat)
-- ============================================================================


-- ============================================================================
-- BAGIAN 1 — TIPE DATA (ENUM)
-- Enum = kolom yang isinya hanya boleh dari daftar nilai tertentu.
-- ============================================================================
do $$ begin
  create type public.order_status as enum (
    'baru',                 -- pesanan baru masuk
    'menunggu_pembayaran',  -- menunggu transfer / verifikasi bukti bayar
    'dikonfirmasi',         -- pesanan sudah dikonfirmasi ibu
    'sedang_dibuat',        -- kue sedang dibuat
    'siap_diantar',         -- kue siap, menunggu jadwal antar
    'dalam_pengantaran',    -- sedang diantar ke pembeli
    'selesai',              -- pesanan tuntas
    'dibatalkan'            -- dibatalkan (kuota otomatis dikembalikan)
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_method as enum ('cod', 'transfer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum (
    'belum_bayar',          -- belum ada pembayaran
    'menunggu_verifikasi',  -- bukti transfer sudah diupload, ibu belum cek
    'lunas'                 -- pembayaran selesai
  );
exception when duplicate_object then null; end $$;


-- ============================================================================
-- BAGIAN 2 — TABEL
-- ============================================================================
-- 2a. PRODUK: daftar kue yang dijual ibu
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null default '',
  price       integer not null check (price >= 0),   -- harga Rupiah, bilangan bulat
  image_url   text,                                   -- foto di Supabase Storage
  is_active   boolean not null default true,          -- nonaktif = disembunyikan
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2b. BATCH PO: satu periode pemesanan (hanya satu yang aktif)
create table if not exists public.batches (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  ready_date     date not null,           -- tanggal kue siap / diantar
  order_deadline timestamptz not null,    -- batas akhir pemesanan
  is_active      boolean not null default false,
  created_at     timestamptz not null default now()
);

-- 2c. KUOTA PRODUK PER BATCH: berapa pcs tiap kue dijual di batch ini
create table if not exists public.batch_products (
  id         uuid primary key default gen_random_uuid(),
  batch_id   uuid not null references public.batches(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quota      integer not null check (quota > 0),   -- kuota awal
  remaining  integer not null check (remaining >= 0), -- sisa kuota
  constraint batch_products_unique unique (batch_id, product_id)
);

-- 2d. PESANAN: data pembeli + lokasi + pembayaran + status
create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique,          -- contoh: KUE-20261003-0001
  batch_id          uuid references public.batches(id) on delete set null,
  customer_name     text not null,
  customer_whatsapp text not null,                 -- disimpan normal: 62812xxx
  address_text      text not null,                 -- alamat lengkap (teks)
  lat               double precision,              -- titik lokasi peta
  lng               double precision,
  notes             text not null default '',      -- catatan pesanan pembeli
  payment_method    public.payment_method not null,
  subtotal          integer not null default 0,
  shipping_cost     integer not null default 0,    -- ongkir diisi ibu manual
  total             integer not null default 0,    -- subtotal + ongkir
  status            public.order_status not null default 'baru',
  payment_status    public.payment_status not null default 'belum_bayar',
  payment_proof_url text,                          -- path bukti transfer (bucket privat)
  quota_restored    boolean not null default false, -- penanda kuota sudah dikembalikan
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- 2e. ITEM PESANAN: nama & harga disimpan sebagai SNAPSHOT saat dibeli
--     (kalau ibu mengganti harga produk, pesanan lama tidak ikut berubah)
create table if not exists public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  product_id   uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price   integer not null,
  quantity     integer not null check (quantity > 0),
  subtotal     integer not null,
  created_at   timestamptz not null default now()
);

-- 2f. RIWAYAT STATUS: jejak perubahan status pesanan (tampil di halaman lacak)
create table if not exists public.order_status_history (
  id        uuid primary key default gen_random_uuid(),
  order_id  uuid not null references public.orders(id) on delete cascade,
  status    public.order_status not null,
  note      text not null default '',
  created_at timestamptz not null default now()
);

-- 2g. PENGATURAN TOKO: cukup SATU baris (id selalu = 1)
create table if not exists public.store_settings (
  id              integer primary key default 1 check (id = 1),
  store_name      text not null default 'Kue Ibu',
  whatsapp_number text not null default '6281234567890', -- nomor WA ibu
  bank_info       text not null default '',   -- info rekening / QRIS (teks)
  qris_image_url  text,                       -- gambar QRIS (bucket publik)
  operating_hours text not null default '',   -- jam/hari operasional (teks bebas)
  wa_templates    jsonb not null default '{}'::jsonb, -- template pesan WA
  is_open         boolean not null default false, -- BUKA / TUTUP pemesanan
  updated_at      timestamptz not null default now()
);

-- 2h. PROFIL: melengkapi akun login (Supabase Auth) dengan peran admin
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  role       text not null default 'customer', -- diangkat jadi 'admin' lewat SQL
  created_at timestamptz not null default now()
);

-- Indeks agar pencarian cepat
create index if not exists idx_orders_created_at  on public.orders (created_at);
create index if not exists idx_orders_batch       on public.orders (batch_id);
create index if not exists idx_orders_status      on public.orders (status);
create index if not exists idx_order_items_order  on public.order_items (order_id);
create index if not exists idx_batch_products_b   on public.batch_products (batch_id);

-- ATURAN PENTING: hanya boleh ada SATU batch aktif pada satu waktu.
-- (indeks unik khusus untuk baris yang is_active = true)
create unique index if not exists unique_one_active_batch
  on public.batches (is_active) where is_active;


-- ============================================================================
-- BAGIAN 3 — FUNGSI BANTU
-- ============================================================================
-- 3a. Cek: apakah yang sedang login adalah admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 3b. Samakan format nomor WhatsApp: 0812... / +62812... / 812... -> 62812...
create or replace function public.normalize_wa(p_raw text)
returns text
language plpgsql
immutable
as $$
declare
  v text;
begin
  v := regexp_replace(coalesce(p_raw, ''), '[^0-9]', '', 'g'); -- buang spasi/strip/+
  if v like '62%' then
    return v;
  elsif v like '0%' then
    return '62' || substr(v, 2);
  elsif v like '8%' then
    return '62' || v;
  else
    return v;
  end if;
end;
$$;

-- 3c. Kolom updated_at terisi otomatis setiap kali baris diubah
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

drop trigger if exists trg_settings_updated_at on public.store_settings;
create trigger trg_settings_updated_at
  before update on public.store_settings
  for each row execute function public.set_updated_at();

-- 3d. Saat ada user baru mendaftar (lewat dashboard Supabase),
--     otomatis buat baris profilnya. Peran awal = 'customer'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'customer');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================================
-- BAGIAN 4 — FUNGSI UTAMA (dipanggil website lewat supabase.rpc)
-- ============================================================================

-- 4a. CREATE_ORDER — "kasir otomatis" ibu.
-- Semua pemeriksaan dilakukan di sini (di server database), bukan di HP
-- pembeli, supaya tidak bisa ditipu:
--   * toko harus sedang BUKA
--   * harus ada batch aktif dan belum lewat batas pemesanan
--   * data pembeli divalidasi (nama, nomor WA Indonesia, alamat)
--   * kuota dipotong dengan aman: kalau bersaing dengan pembeli lain,
--     yang cepat mendapat, yang kalah mendapat pesan ramah
--     (TIDAK ADA overselling)
--   * jika satu item gagal, seluruh pesanan dibatalkan otomatis (transaksi)
create or replace function public.create_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings   public.store_settings;
  v_batch      public.batches;
  v_product    public.products;
  v_order_id   uuid;
  v_code       text;
  v_today      date;
  v_seq        int;
  v_item       jsonb;
  v_qty        int;
  v_remaining  int;
  v_subtotal   int := 0;
  v_item_count int := 0;
  v_name       text;
  v_wa         text;
  v_address    text;
  v_notes      text;
  v_pay_method text;
  v_lat        double precision;
  v_lng        double precision;
begin
  -- Kunci antrean penomoran agar 2 pesanan bersamaan tidak dapat nomor sama
  perform pg_advisory_xact_lock(20261003);

  ---------- 1. Toko harus sedang BUKA ----------
  select * into v_settings from public.store_settings where id = 1;
  if not found then
    raise exception 'Pengaturan toko belum tersedia. Hubungi ibu via WhatsApp ya.';
  end if;
  if not v_settings.is_open then
    raise exception 'Pemesanan sedang TUTUP. Kamu masih bisa menghubungi ibu via WhatsApp.';
  end if;

  ---------- 2. Harus ada batch aktif dan belum lewat batas ----------
  select * into v_batch from public.batches where is_active = true;
  if not found then
    raise exception 'Belum ada jadwal pemesanan (batch) yang aktif.';
  end if;
  if v_batch.order_deadline < now() then
    raise exception 'Batas akhir pemesanan batch ini sudah lewat. Tunggu batch berikutnya ya.';
  end if;

  ---------- 3. Validasi data pembeli ----------
  v_name       := btrim(coalesce(payload->>'customer_name', ''));
  v_address    := btrim(coalesce(payload->>'address_text', ''));
  v_notes      := left(coalesce(payload->>'notes', ''), 500);
  v_pay_method := coalesce(payload->>'payment_method', '');
  v_wa         := public.normalize_wa(payload->>'customer_whatsapp');

  if v_name = '' or char_length(v_name) > 100 then
    raise exception 'Nama pemesan wajib diisi (maksimal 100 huruf).';
  end if;
  if v_wa !~ '^62[0-9]{8,12}$' then
    raise exception 'Nomor WhatsApp tidak valid. Contoh format: 081234567890.';
  end if;
  if v_address = '' or char_length(v_address) > 500 then
    raise exception 'Alamat lengkap wajib diisi (maksimal 500 huruf).';
  end if;
  if v_pay_method not in ('cod', 'transfer') then
    raise exception 'Pilih metode pembayaran: COD atau Transfer.';
  end if;

  ---------- 4. Validasi titik peta (boleh kosong, tapi jika ada harus valid) ----------
  if coalesce(payload->>'lat', '') <> '' then
    if payload->>'lat' !~ '^-?[0-9]+(\.[0-9]+)?$' then
      raise exception 'Titik lokasi tidak valid (latitude).';
    end if;
    v_lat := (payload->>'lat')::double precision;
    if v_lat < -90 or v_lat > 90 then
      raise exception 'Titik lokasi tidak valid (latitude di luar jangkauan).';
    end if;
  end if;
  if coalesce(payload->>'lng', '') <> '' then
    if payload->>'lng' !~ '^-?[0-9]+(\.[0-9]+)?$' then
      raise exception 'Titik lokasi tidak valid (longitude).';
    end if;
    v_lng := (payload->>'lng')::double precision;
    if v_lng < -180 or v_lng > 180 then
      raise exception 'Titik lokasi tidak valid (longitude di luar jangkauan).';
    end if;
  end if;

  ---------- 5. Susun kode pesanan: KUE-YYYYMMDD-0001 (zona waktu Indonesia) ----------
  v_today := (now() at time zone 'Asia/Jakarta')::date;
  select count(*) + 1 into v_seq
  from public.orders
  where (created_at at time zone 'Asia/Jakarta')::date = v_today;
  v_code := 'KUE-' || to_char(v_today, 'YYYYMMDD') || '-' || lpad(v_seq::text, 4, '0');

  ---------- 6. Simpan pesanan (total dihitung setelah item diproses) ----------
  insert into public.orders (
    code, batch_id, customer_name, customer_whatsapp, address_text,
    lat, lng, notes, payment_method, subtotal, total
  ) values (
    v_code, v_batch.id, v_name, v_wa, v_address,
    v_lat, v_lng, v_notes, v_pay_method::public.payment_method, 0, 0
  ) returning id into v_order_id;

  ---------- 7. Proses tiap item: cek kuota, potong kuota, simpan snapshot ----------
  if jsonb_typeof(payload->'items') is distinct from 'array' then
    raise exception 'Keranjang kosong. Tambahkan kue dulu ya.';
  end if;

  for v_item in select * from jsonb_array_elements(payload->'items')
  loop
    v_qty := coalesce((v_item->>'quantity')::int, 0);
    if v_qty <= 0 or v_qty > 100 then
      raise exception 'Jumlah pesanan tidak valid (1-100).';
    end if;
    if coalesce(v_item->>'product_id', '') !~ '^[0-9a-fA-F-]{36}$' then
      raise exception 'Ada produk di keranjang yang tidak valid.';
    end if;

    select * into v_product from public.products
    where id = (v_item->>'product_id')::uuid and is_active = true;
    if not found then
      raise exception 'Ada produk yang sudah tidak tersedia. Muat ulang halaman ya.';
    end if;

    -- Lihat sisa kuota produk ini di batch aktif
    select remaining into v_remaining
    from public.batch_products
    where batch_id = v_batch.id and product_id = v_product.id;

    if v_remaining is null then
      raise exception 'Produk "%" tidak dijual di batch ini.', v_product.name;
    end if;
    if v_remaining < v_qty then
      raise exception 'Maaf, sisa kuota "%" tinggal % pcs. Sesuaikan jumlahnya ya.',
        v_product.name, v_remaining;
    end if;

    -- Potong kuota dengan syarat "remaining >= jumlah" (anti overselling).
    -- Kalau bersaing dengan pembeli lain dan kalah, baris tidak terupdate.
    update public.batch_products
    set remaining = remaining - v_qty
    where batch_id = v_batch.id
      and product_id = v_product.id
      and remaining >= v_qty;
    if not found then
      raise exception 'Maaf, kuota "%" baru saja habis. Muat ulang halaman ya.', v_product.name;
    end if;

    -- Simpan item dengan SNAPSHOT nama & harga saat dibeli
    insert into public.order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
    values (v_order_id, v_product.id, v_product.name, v_product.price, v_qty, v_product.price * v_qty);

    v_subtotal   := v_subtotal + (v_product.price * v_qty);
    v_item_count := v_item_count + 1;
  end loop;

  if v_item_count = 0 then
    raise exception 'Keranjang kosong. Tambahkan kue dulu ya.';
  end if;

  ---------- 8. Finalisasi total (ongkir = 0 dulu, diisi ibu kemudian) ----------
  update public.orders
  set subtotal = v_subtotal, total = v_subtotal
  where id = v_order_id;

  ---------- 9. Catat riwayat status pertama ----------
  insert into public.order_status_history (order_id, status, note)
  values (v_order_id, 'baru', 'Pesanan diterima, menunggu konfirmasi ibu.');

  return jsonb_build_object(
    'success', true,
    'code', v_code,
    'order_id', v_order_id,
    'subtotal', v_subtotal,
    'total', v_subtotal
  );
end;
$$;


-- 4b. TRACK_ORDER — lacak pesanan TANPA login.
-- Pembeli memasukkan kode pesanan + nomor WA; keduanya harus cocok.
-- Dengan begitu tabel orders TIDAK perlu dibuka ke publik (aman).
create or replace function public.track_order(p_code text, p_whatsapp text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order    public.orders;
  v_wa       text;
  v_items    jsonb;
  v_history  jsonb;
  v_settings public.store_settings;
begin
  -- 1. Samakan format nomor WA pembeli dengan yang tersimpan
  v_wa := public.normalize_wa(p_whatsapp);

  -- 2. Cari pesanan berdasarkan kode (huruf besar/kecil diperlakukan sama)
  select * into v_order from public.orders
  where upper(code) = upper(btrim(coalesce(p_code, '')));

  -- 3. Kode tidak ada ATAU nomor WA tidak cocok -> tolak dengan pesan ramah
  if not found or v_order.customer_whatsapp is distinct from v_wa then
    return jsonb_build_object(
      'found', false,
      'message', 'Kode pesanan atau nomor WhatsApp tidak cocok. Periksa kembali ya.'
    );
  end if;

  -- 4. Ambil rincian item pesanan
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'product_name', oi.product_name,
        'unit_price',   oi.unit_price,
        'quantity',     oi.quantity,
        'subtotal',     oi.subtotal
      ) order by oi.created_at
    ), '[]'::jsonb)
  into v_items
  from public.order_items oi
  where oi.order_id = v_order.id;

  -- 5. Ambil riwayat perubahan status
  select coalesce(
    jsonb_agg(
      jsonb_build_object('status', h.status, 'note', h.note, 'created_at', h.created_at)
      order by h.created_at
    ), '[]'::jsonb)
  into v_history
  from public.order_status_history h
  where h.order_id = v_order.id;

  -- 6. Info rekening/QRIS ditampilkan bila metode pembayaran transfer
  select * into v_settings from public.store_settings where id = 1;

  -- 7. Susun hasil lengkap
  return jsonb_build_object(
    'found', true,
    'order', to_jsonb(v_order)
      || jsonb_build_object('items', v_items)
      || jsonb_build_object('history', v_history)
      || jsonb_build_object('bank_info',      v_settings.bank_info)
      || jsonb_build_object('qris_image_url', v_settings.qris_image_url)
      || jsonb_build_object('store_name',     v_settings.store_name)
  );
end;
$$;


-- 4c. SAAT PESANAN DIBATALKAN — kembalikan kuota otomatis
create or replace function public.handle_order_cancellation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item record;
begin
  if new.status = 'dibatalkan'
     and old.status is distinct from 'dibatalkan'
     and not new.quota_restored then
    for v_item in select * from public.order_items
                  where order_id = new.id and product_id is not null
    loop
      update public.batch_products
      set remaining = least(quota, remaining + v_item.quantity)
      where batch_id = new.batch_id and product_id = v_item.product_id;
    end loop;
    new.quota_restored := true; -- penanda agar tidak dikembalikan dua kali
  end if;
  return new;
end;
$$;

drop trigger if exists trg_orders_cancel_restore on public.orders;
create trigger trg_orders_cancel_restore
  before update on public.orders
  for each row execute function public.handle_order_cancellation();


-- ============================================================================
-- BAGIAN 5 — ROW LEVEL SECURITY (RLS)
-- RLS = "satpam" tiap tabel. Aturannya:
--   * Semua orang         : boleh LIHAT produk aktif, batch aktif, kuota,
--                           dan pengaturan toko (katalog tetap tampil).
--   * Pembeli tanpa login : boleh MEMBUAT pesanan, tetapi HANYA lewat
--                           fungsi create_order (penuh pemeriksaan).
--                           Tabel orders TIDAK bisa dibaca publik —
--                           pelacakan lewat fungsi track_order.
--   * Admin (ibu)         : boleh baca & ubah semuanya.
-- ============================================================================
alter table public.products             enable row level security;
alter table public.batches              enable row level security;
alter table public.batch_products       enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.order_status_history enable row level security;
alter table public.store_settings       enable row level security;
alter table public.profiles             enable row level security;

-- ---------- PRODUCTS ----------
drop policy if exists "Publik lihat produk aktif" on public.products;
create policy "Publik lihat produk aktif" on public.products
  for select using (is_active = true);

drop policy if exists "Admin penuh atas produk" on public.products;
create policy "Admin penuh atas produk" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- BATCHES ----------
drop policy if exists "Publik lihat batch aktif" on public.batches;
create policy "Publik lihat batch aktif" on public.batches
  for select using (is_active = true);

drop policy if exists "Admin penuh atas batch" on public.batches;
create policy "Admin penuh atas batch" on public.batches
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- BATCH_PRODUCTS (kuota) ----------
drop policy if exists "Publik lihat kuota batch aktif" on public.batch_products;
create policy "Publik lihat kuota batch aktif" on public.batch_products
  for select using (
    exists (
      select 1 from public.batches b
      where b.id = batch_id and b.is_active = true
    )
  );

drop policy if exists "Admin penuh atas kuota" on public.batch_products;
create policy "Admin penuh atas kuota" on public.batch_products
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- ORDERS ----------
-- Tidak ada kebijakan baca untuk publik: pelacakan lewat track_order.
drop policy if exists "Admin penuh atas pesanan" on public.orders;
create policy "Admin penuh atas pesanan" on public.orders
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- ORDER_ITEMS ----------
drop policy if exists "Admin penuh atas item pesanan" on public.order_items;
create policy "Admin penuh atas item pesanan" on public.order_items
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- ORDER_STATUS_HISTORY ----------
drop policy if exists "Admin penuh atas riwayat status" on public.order_status_history;
create policy "Admin penuh atas riwayat status" on public.order_status_history
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- STORE_SETTINGS ----------
drop policy if exists "Publik lihat pengaturan toko" on public.store_settings;
create policy "Publik lihat pengaturan toko" on public.store_settings
  for select using (true);

drop policy if exists "Admin ubah pengaturan toko" on public.store_settings;
create policy "Admin ubah pengaturan toko" on public.store_settings
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------- PROFILES ----------
drop policy if exists "User lihat profil sendiri" on public.profiles;
create policy "User lihat profil sendiri" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Admin lihat semua profil" on public.profiles;
create policy "Admin lihat semua profil" on public.profiles
  for select using (public.is_admin());


-- ============================================================================
-- BAGIAN 6 — STORAGE (tempat menyimpan gambar)
--   * product-images : PUBLIK — foto produk bisa dilihat siapa saja,
--                               hanya admin yang boleh upload/ubah/hapus.
--   * payment-proofs : PRIVAT — bukti transfer TIDAK bisa dilihat publik.
--                               Upload pembeli dilakukan lewat server
--                               (API route) agar tetap aman & terverifikasi;
--                               admin melihatnya lewat signed URL.
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

drop policy if exists "Publik lihat foto produk" on storage.objects;
create policy "Publik lihat foto produk" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "Admin kelola foto produk" on storage.objects;
create policy "Admin kelola foto produk" on storage.objects
  for all using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admin kelola bukti transfer" on storage.objects;
create policy "Admin kelola bukti transfer" on storage.objects
  for all using (bucket_id = 'payment-proofs' and public.is_admin())
  with check (bucket_id = 'payment-proofs' and public.is_admin());


-- ============================================================================
-- BAGIAN 7 — DATA DASAR (WAJIB ADA)
-- Baris pengaturan toko. Website tidak jalan tanpa baris ini.
-- Template WA memakai placeholder: {nama} {kode} {total} {ongkir}
-- {rekening} {pembayaran} — diganti otomatis saat ibu klik "Kirim WhatsApp".
-- ============================================================================
insert into public.store_settings (id, store_name, whatsapp_number, bank_info, operating_hours, wa_templates)
values (
  1,
  'Kue Ibu',
  '6281234567890',
  'BCA 1234567890 a.n. Nama Ibu | QRIS tersedia',
  'Setiap hari, 08.00 - 20.00 WIB',
  $tpl${
    "konfirmasi_pesanan": "Halo {nama}! Pesananmu dengan kode {kode} sudah dikonfirmasi ya. Total pesanan: {total} (termasuk ongkir {ongkir}). Metode bayar: {pembayaran}. Terima kasih sudah memesan!",
    "tagihan_transfer": "Halo {nama}! Untuk pesanan {kode}, mohon transfer sebesar {total} ke: {rekening}. Setelah transfer, unggah buktinya di halaman Lacak Pesanan ya. Terima kasih!",
    "sedang_diantar": "Halo {nama}! Pesanan {kode} sedang diantar ke alamatmu ya. Mohon ditunggu di rumah ya!",
    "pesanan_selesai": "Halo {nama}! Pesanan {kode} sudah selesai. Terima kasih sudah memesan kue di toko kami, sampai jumpa di batch berikutnya!"
  }$tpl$::jsonb
)
on conflict (id) do nothing;

-- ============================================================================
-- SELESAI. Lanjutkan dengan menjalankan seed.sql (data contoh).
-- ============================================================================
