
-- MANDALA CHANNEL DATABASE
-- Supabase/PostgreSQL
-- Jalankan seluruh file ini di Supabase SQL Editor.

create extension if not exists pgcrypto;

create type public.content_status as enum ('draft','published','archived');

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  body text not null default '',
  cover_url text,
  author_name text default 'Mandala Editorial',
  category_id uuid references public.categories(id) on delete set null,
  status public.content_status not null default 'draft',
  featured boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  youtube_video_id text not null,
  description text,
  thumbnail_url text,
  category_id uuid references public.categories(id) on delete set null,
  article_id uuid references public.articles(id) on delete set null,
  status public.content_status not null default 'draft',
  featured boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  youtube_playlist_id text not null,
  description text,
  cover_url text,
  category_id uuid references public.categories(id) on delete set null,
  sort_order integer not null default 0,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.podcasts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  youtube_video_id text,
  cover_url text,
  category_id uuid references public.categories(id) on delete set null,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  storage_path text not null,
  public_url text,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists articles_status_date_idx on public.articles(status, published_at desc);
create index if not exists videos_status_date_idx on public.videos(status, published_at desc);
create index if not exists playlists_sort_idx on public.playlists(status, sort_order);
create index if not exists podcasts_status_date_idx on public.podcasts(status, published_at desc);

-- Seed kategori awal
insert into public.categories (name, slug, sort_order) values
('Tokoh Hindu','tokoh-hindu',1),
('Dharmika','dharmika',2),
('Jelajah Nusantara','jelajah-nusantara',3),
('Tradisi & Budaya','tradisi-budaya',4),
('Dharma & Ajaran','dharma-ajaran',5),
('Kabar Umat','kabar-umat',6),
('Spiritual','spiritual',7)
on conflict (slug) do nothing;

-- RLS
alter table public.categories enable row level security;
alter table public.articles enable row level security;
alter table public.videos enable row level security;
alter table public.playlists enable row level security;
alter table public.podcasts enable row level security;
alter table public.media enable row level security;

-- Website publik hanya membaca konten published.
create policy "public read published categories"
on public.categories for select
using (true);

create policy "public read published articles"
on public.articles for select
using (status = 'published');

create policy "public read published videos"
on public.videos for select
using (status = 'published');

create policy "public read published playlists"
on public.playlists for select
using (status = 'published');

create policy "public read published podcasts"
on public.podcasts for select
using (status = 'published');

-- Admin/karyawan terautentikasi dapat mengelola konten.
create policy "authenticated manage categories"
on public.categories for all
to authenticated
using (true) with check (true);

create policy "authenticated manage articles"
on public.articles for all
to authenticated
using (true) with check (true);

create policy "authenticated manage videos"
on public.videos for all
to authenticated
using (true) with check (true);

create policy "authenticated manage playlists"
on public.playlists for all
to authenticated
using (true) with check (true);

create policy "authenticated manage podcasts"
on public.podcasts for all
to authenticated
using (true) with check (true);

create policy "authenticated manage media"
on public.media for all
to authenticated
using (true) with check (true);

-- Storage bucket untuk gambar.
insert into storage.buckets (id, name, public)
values ('mandala-media', 'mandala-media', true)
on conflict (id) do nothing;

create policy "public view mandala media"
on storage.objects for select
using (bucket_id = 'mandala-media');

create policy "authenticated upload mandala media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'mandala-media');

create policy "authenticated update mandala media"
on storage.objects for update
to authenticated
using (bucket_id = 'mandala-media')
with check (bucket_id = 'mandala-media');

create policy "authenticated delete mandala media"
on storage.objects for delete
to authenticated
using (bucket_id = 'mandala-media');
