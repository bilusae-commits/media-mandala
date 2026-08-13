
Generated image: Modern Multimedia Media Homepage Mockup

Edit

Desain homepage media bergaya modern-minimalis dengan layout bersih, dominasi putih, tipografi tegas, dan aksen merah; menampilkan navigasi Beranda, Video, Podcast, Artikel, Tentang, tombol Subscribe, serta hero utama yang terhubung langsung dengan YouTube melalui video player dan tombol “Tonton di YouTube”. Di bawahnya terdapat kategori konten, daftar video terbaru, video pilihan dengan thumbnail besar, newsletter subscription, serta footer lengkap, sehingga keseluruhan website terasa profesional, ringan, dan berfokus pada pengalaman menikmati konten video.


Bagus banget idemu,, nantinya isi website sama dengan playlist ini, tentang agama hindu, tokoh, dharmika, jelajah nusantara dan lain lain
Tpi tetap minimalis seperti yg tadi

Generated image: Mandala Channel Dharma Dashboard


Edit


Generated image: Mandala Channel’s Balinese Temple Edition


Edit


Seperti ini aja kurang lebih

Generated image: Mandala Channel: Nusantara Dharma Stories


Edit


Generated image: Mandala Channel Nusantara Magazine Homepage


Edit


Generated image: Mandala Channel: Nusantara in Harmony


Edit


Untuk playlist pilihan saya ingin tampilannya seperti ini lengkap dengan animasinya

bagaimna kalau sesuai dengan ini semua ?

Generated image: Mandala Channel Website Structure Blueprint


Edit


Betul. Mulai sekarang saya langsung kerjakan step berikutnya, tanpa mengulang penjelasan panjang.

Step berikutnya: satukan WEBSITE + CMS
Kita sekarang punya:

WEBSITE MANDALA
+
CMS FINAL
Yang akan kita kerjakan sekarang adalah menghubungkan website publik dengan database CMS, sehingga konten tidak lagi statis.

Targetnya:

Karyawan
   ↓
Login /admin
   ↓
Buat artikel
   ↓
Publish
   ↓
DATABASE
   ↓
index.html
   ↓
Artikel otomatis tampil
Dan untuk YouTube:

Karyawan
   ↓
Masukkan URL YouTube
   ↓
CMS mengambil ID + thumbnail
   ↓
Publish
   ↓
Website
   ↓
Klik video
   ↓
POPUP VIDEO
Saya akan kerjakan bagian berikutnya:
1. Homepage

Artikel terbaru dari CMS

Artikel populer

Video terbaru

Playlist pilihan

Kategori

Tombol popup YouTube

2. Jelajah Nusantara

Data konten berdasarkan kategori

Card artikel

Video terkait

Tidak perlu edit HTML setiap ada konten baru

3. Halaman artikel

Judul

Cover

Isi

Penulis

Tanggal

Artikel terkait

Video terkait

4. Sistem YouTube

Thumbnail otomatis

Popup video

Playlist

Tidak keluar dari website

5. CMS

Publish artikel → langsung tersedia di website

Publish video → langsung tersedia

Publish playlist → langsung tersedia

6. Struktur final GitHub
Kita jadikan satu struktur yang rapi, bukan file terpisah-pisah.

Saya lanjut mengerjakan integrasi tersebut sekarang. Tidak perlu Anda melakukan apa-apa dulu.


ok lanjut

Sudah saya lanjutkan dan saya satukan website Mandala yang sebelumnya + CMS final + struktur database + integrasi YouTube menjadi satu paket.

Paket yang sekarang kita pakai
Download Mandala Channel — FINAL INTEGRATED

Ini menggantikan paket-paket sebelumnya. Jadi mulai sekarang kita fokus pada file ini saja.

Di dalamnya sudah menyatu:

mandala-channel/
│
├── index.html
├── pages/
├── topics/
├── css/
├── js/
├── data/
├── assets/
│
├── admin/              ← CMS karyawan
│
├── supabase/
│   └── schema.sql      ← database
│
└── docs/
Integrasi yang sudah saya masukkan
Website publik:

Homepage

Artikel

Video

Playlist

Podcast

Topik

Jelajah Nusantara

Halaman detail

Responsive

CMS:

Login

Dashboard

Artikel

Video

Playlist

Podcast

Media

Kategori

Publish/Draft

YouTube:

URL video → ID otomatis

Thumbnail otomatis dari YouTube

Video diputar popup di dalam website

Playlist YouTube siap diputar dalam popup

Database:

Artikel

Video

Playlist

Podcast

Kategori

Media

Authentication

Storage

Yang penting, saya juga membuat sistem fallback: kalau database belum disambungkan, website masih bisa menggunakan data demo yang sudah ada. Jadi kita tidak membuat website langsung kosong ketika database belum dikonfigurasi.

Sekarang step berikutnya
Jangan upload file lain. Jangan hapus file satu-satu.

Kita sekarang tinggal masuk ke tahap pemasangan paket final ini ke GitHub dan membuat database Supabase. Saya akan berikan langkahnya satu per satu dan langsung, tanpa menyuruh Anda bolak-balik.


a3cdb03f-c0b5-41ae-badf-82e85e49b0dd.png
loh ada file baru lagi. jadi gimana ini yang mana yang saya hapus. dibilang saya gasuka kerja model gini kok. langsung saja satu file kemudian kita lanjut ke tahap berikutnya. kalau kayak gini kan jadinya upload hapus upload lagi. mulai sekarang saya ingin upload kemudian buatkan lagi untuk selanjutnya kmudian saya lakukan kmudian lanjutkan lagi buatkan selanjutnya saya lakukan lagi, PAHAM ??

PAHAM. Mulai sekarang pola kerja kita persis seperti yang Anda minta:

Saya buat 1 tahap → Anda upload/lakukan → Anda bilang selesai → saya buat tahap berikutnya.

Tidak ada lagi upload paket baru setiap kali.

Untuk kondisi GitHub Anda SEKARANG
JANGAN HAPUS APA PUN.

Screenshot Anda sudah menunjukkan struktur yang kita perlukan:

admin/
assets/
css/
data/
docs/
js/
pages/
supabase/
topics/
index.html
Itu kita pertahankan.

STEP 1 SEKARANG — DATABASE
Saya sudah buat SATU FILE untuk tahap ini:

Download mandala-step-1-supabase-schema.sql

Yang Anda lakukan sekarang hanya:

Download file tersebut.

Buka folder GitHub Anda → supabase

Ganti schema.sql yang ada sekarang dengan file ini.

Commit/upload.

Jangan upload file lain. Jangan hapus folder lain.

Setelah selesai, cukup balas:

SELESAI

Baru saya berikan STEP 2 saja.

Kita akan jalan seperti ini sampai final: satu langkah → Anda lakukan → lanjut langkah berikutnya. 


mandala-step-1-supabase-schema.sql
Code


Library
/
mandala-step-1-supabase-schema.sql


-- MANDALA CHANNEL — DATABASE FINAL
-- Step 1: jalankan file ini di Supabase SQL Editor.
-- Tidak perlu mengubah file website lain.

create extension if not exists pgcrypto;

-- =========================
-- UPDATED AT
-- =========================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================
-- PROFILES / KARYAWAN
-- =========================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'editor'
    check (role in ('admin','editor')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- CATEGORIES / TOPIK
-- =========================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- ARTICLES
-- =========================
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text,
  cover_image_url text,
  category_id uuid references public.categories(id) on delete set null,
  author_id uuid references public.profiles(id) on delete set null,
  status text not null default 'draft'
    check (status in ('draft','published')),
  featured boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- YOUTUBE VIDEOS
-- =========================
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  youtube_url text not null,
  youtube_video_id text not null,
  thumbnail_url text,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  status text not null default 'draft'
    check (status in ('draft','published')),
  featured boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- YOUTUBE PLAYLISTS
-- =========================
create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  youtube_playlist_id text not null,
  description text,
  cover_image_url text,
  category_id uuid references public.categories(id) on delete set null,
  status text not null default 'draft'
    check (status in ('draft','published')),
  featured boolean not null default false,
  sort_order integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- PODCASTS
-- =========================
create table if not exists public.podcasts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  cover_image_url text,
  youtube_url text,
  youtube_video_id text,
  category_id uuid references public.categories(id) on delete set null,
  status text not null default 'draft'
    check (status in ('draft','published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- MEDIA
-- =========================
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_url text not null,
  alt_text text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- =========================
-- INDEXES
-- =========================
create index if not exists idx_articles_status_published
  on public.articles(status, published_at desc);

create index if not exists idx_articles_category
  on public.articles(category_id);

create index if not exists idx_videos_status_published
  on public.videos(status, published_at desc);

create index if not exists idx_playlists_status_sort
  on public.playlists(status, sort_order);

create index if not exists idx_podcasts_status_published
  on public.podcasts(status, published_at desc);

-- =========================
-- TRIGGERS
-- =========================
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists categories_updated_at on public.categories;
create trigger categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists articles_updated_at on public.articles;
create trigger articles_updated_at
before update on public.articles
for each row execute function public.set_updated_at();

drop trigger if exists videos_updated_at on public.videos;
create trigger videos_updated_at
before update on public.videos
for each row execute function public.set_updated_at();

drop trigger if exists playlists_updated_at on public.playlists;
create trigger playlists_updated_at
before update on public.playlists
for each row execute function public.set_updated_at();

drop trigger if exists podcasts_updated_at on public.podcasts;
create trigger podcasts_updated_at
before update on public.podcasts
for each row execute function public.set_updated_at();

-- =========================
-- AUTO PROFILE AFTER SIGNUP
-- =========================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- =========================
-- HELPER: STAFF
-- =========================
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin','editor')
  );
$$;

-- =========================
-- ROW LEVEL SECURITY
-- =========================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.articles enable row level security;
alter table public.videos enable row level security;
alter table public.playlists enable row level security;
alter table public.podcasts enable row level security;
alter table public.media enable row level security;

-- Public can read published content.
drop policy if exists "public read active categories" on public.categories;
create policy "public read active categories"
on public.categories for select
using (is_active = true);

drop policy if exists "public read published articles" on public.articles;
create policy "public read published articles"
on public.articles for select
using (status = 'published');

drop policy if exists "public read published videos" on public.videos;
create policy "public read published videos"
on public.videos for select
using (status = 'published');

drop policy if exists "public read published playlists" on public.playlists;
create policy "public read published playlists"
on public.playlists for select
using (status = 'published');

drop policy if exists "public read published podcasts" on public.podcasts;
create policy "public read published podcasts"
on public.podcasts for select
using (status = 'published');

-- Staff can manage CMS data.
drop policy if exists "staff manage categories" on public.categories;
create policy "staff manage categories"
on public.categories for all
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "staff manage articles" on public.articles;
create policy "staff manage articles"
on public.articles for all
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "staff manage videos" on public.videos;
create policy "staff manage videos"
on public.videos for all
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "staff manage playlists" on public.playlists;
create policy "staff manage playlists"
on public.playlists for all
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "staff manage podcasts" on public.podcasts;
create policy "staff manage podcasts"
on public.podcasts for all
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "staff manage media" on public.media;
create policy "staff manage media"
on public.media for all
using (public.is_staff())
with check (public.is_staff());

-- A user can read/update their own profile.
drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile"
on public.profiles for select
using (id = auth.uid());

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

-- =========================
-- DEFAULT CATEGORIES
-- =========================
insert into public.categories (name, slug, description, sort_order)
values
  ('Jelajah Nusantara', 'jelajah-nusantara', 'Perjalanan, tempat suci, budaya, dan kisah Nusantara.', 1),
  ('Tokoh', 'tokoh', 'Tokoh dan figur yang memberi inspirasi.', 2),
  ('Dharmika', 'dharmika', 'Kehidupan, pengabdian, dan aktivitas dharmika.', 3),
  ('Tradisi & Budaya', 'tradisi-budaya', 'Tradisi, budaya, dan warisan Hindu Nusantara.', 4),
  ('Kabar Umat', 'kabar-umat', 'Berita dan informasi umat Hindu.', 5),
  ('Podcast', 'podcast', 'Percakapan dan wawancara Mandala Channel.', 6)
on conflict (slug) do nothing;
