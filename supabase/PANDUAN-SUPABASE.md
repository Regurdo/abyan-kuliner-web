# Panduan Setup Supabase — Untuk Pemula

> **Supabase itu apa?**
> Bayangkan seperti "kantor pos + gudang" untuk website ibu:
> - **Buku catatan pesanan** (database) — menyimpan siapa pesan apa, alamat, dan statusnya.
> - **Gudang foto** (Storage) — tempat menyimpan foto kue dan bukti transfer.
> - **Kunci pintu** (Auth + RLS) — hanya ibu yang bisa membuka dashboard admin.
>
> Gratis untuk skala toko kue rumahan. Tidak perlu install apa-apa di komputer.

---

## Langkah 1 — Daftar akun Supabase (± 5 menit)

1. Buka https://supabase.com
2. Klik **Start your project** (atau **Sign In**).
3. Daftar pakai akun **Google**, **GitHub**, atau email. Pilih yang paling mudah untukmu.

## Langkah 2 — Buat project baru (± 3 menit)

1. Setelah masuk, klik **New Project**.
2. Isi formulirnya:
   - **Name**: `toko-kue-ibu` (atau nama lain, bebas)
   - **Database Password**: buat password yang kuat, lalu **catat di notepad**.
     (Password ini jarang dipakai lagi, tapi penting untuk disimpan.)
   - **Region**: pilih **Singapore (Southeast Asia)** — paling dekat dengan Indonesia, supaya website cepat.
3. Klik **Create new project**.
4. Tunggu ± 2 menit sampai status project menjadi **Active**.

## Langkah 3 — Jalankan `schema.sql` (paling penting!)

File ini "membangun seluruh lemari" database: tabel, aturan keamanan, dan mesin penghitung kuota.

1. Di menu kiri dashboard, klik **SQL Editor** (ikon dengan tulisan `>_`).
2. Klik tombol **New query**.
3. Buka file `supabase/schema.sql` di proyek ini, **salin seluruh isinya**
   (buka file-nya, tekan `Ctrl+A` lalu `Ctrl+C`).
4. Tempel (paste) ke kotak besar SQL Editor, lalu klik **Run** (atau tekan `Ctrl+Enter`).
5. Kalau muncul tulisan `Success. No rows returned` → **BERHASIL**.
6. Tenang, file ini **aman dijalankan ulang** kalau tidak sengaja klik Run dua kali
   (tidak akan menduplikasi data).

## Langkah 4 — Jalankan `seed.sql` (isi data contoh)

1. Klik **New query** lagi (jangan pakai tab yang lama).
2. Salin seluruh isi file `supabase/seed.sql`, paste, klik **Run**.
3. Ini akan membuat **5 produk kue contoh** dan **1 batch PO percobaan**
   supaya website langsung terlihat hidup.

## Langkah 5 — Cek hasilnya (± 1 menit)

- Menu kiri **Table Editor**: harus muncul 8 tabel:
  `products`, `batches`, `batch_products`, `orders`, `order_items`,
  `order_status_history`, `store_settings`, `profiles`.
- Menu kiri **Storage**: harus muncul 2 bucket:
  - `product-images` (publik — foto kue)
  - `payment-proofs` (privat — bukti transfer)

## Langkah 6 — Ambil "kunci" website (simpan di notepad!)

1. Menu kiri bawah: klik ikon **gerigi (Project Settings)** → **API** (atau **Data API**).
2. Salin **3 hal** ini ke notepad, nanti diminta saat Tahap 2:
   - **Project URL** → alamat database, contoh: `https://abcdefg.supabase.co`
   - **anon / public key** → kunci publik, aman dipakai oleh pembeli.
   - **service_role key** → kunci induk.

> **PERINGATAN PENTING**
> `service_role key` itu seperti **kunci induk rumah**. Jangan pernah dibagikan
> ke siapa pun, jangan diposting, dan tidak akan dimasukkan ke kode yang
> dilihat pembeli — hanya di file rahasia `.env.local` di server.

## Langkah 7 — Membuat akun admin ibu (dijelaskan lengkap di Tahap 6)

Intinya nanti hanya 2 langkah:
1. Buat user di menu **Authentication → Users**.
2. Jalankan 1 perintah SQL pendek untuk mengangkatnya jadi admin.

---

## Masalah yang sering muncul (FAQ)

**"Aku sudah klik Run dua kali, apakah rusak?"**
Tidak. File dibuat anti-duplikat, aman dijalankan berulang.

**"Muncul `Success. No rows returned`, padahal aku membuat tabel?"**
Itu memang tanda SUKSES. Hasilnya dicek lewat menu **Table Editor**, bukan di SQL Editor.

**"Lupa Database Password?"**
Website tidak memakai password itu (memakai API key). Kalau benar-benar perlu, bisa direset di **Settings → Database**.

**"Bedanya anon key dan service_role key?"**
- `anon` = kunci pintu depan: semua orang boleh lihat katalog, tapi hanya bisa pesan lewat mesin kasir yang sudah diatur.
- `service_role` = kunci induk: bisa semua hal, dipakai server di belakang layar saja.
