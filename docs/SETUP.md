# SETUP PRODUKSI MANDALA

## 1. Supabase
Buat satu project Supabase.
Buka SQL Editor lalu jalankan `supabase/schema.sql`.

## 2. Authentication
Di Supabase Authentication > Users, buat akun karyawan.
Contoh:
- redaksi@mandalachannel.id
- password dibuat dari dashboard Supabase

Untuk produksi jangan menggunakan password demo dari prototype.

## 3. Konfigurasi frontend
Salin/ubah `js/config.js`:
- SUPABASE_URL
- SUPABASE_ANON_KEY

Gunakan hanya ANON/PUBLIC key di frontend. Jangan masukkan service_role key.

## 4. GitHub
Upload folder:
- admin/
- js/
- css/ (jika frontend lama Anda sudah punya, gabungkan)
- supabase/ untuk dokumentasi/schema

CMS: `/admin/`
Website publik tetap di root.

## 5. Alur final
Karyawan login -> buat artikel/video/playlist -> Publish -> data masuk database -> website publik membaca data published.

## 6. YouTube
Video menggunakan YouTube Video ID dan thumbnail `i.ytimg.com`.
Playlist menyimpan YouTube Playlist ID.
Pemutaran video menggunakan popup iframe di website sehingga pengguna tidak pindah halaman.

## 7. Catatan keamanan
RLS harus tetap aktif. Jangan taruh service_role key di GitHub/frontend.
Untuk role admin/editor yang lebih ketat, tahap berikutnya bisa menambahkan tabel profiles/roles dan policy berdasarkan role.
