-- MANDALA CHANNEL — SUPABASE FINAL SCHEMA
-- Jalankan SATU FILE ini di Supabase SQL Editor.
-- Desain frontend tidak perlu diubah oleh schema ini.
--
-- Role:
--   admin  = kontrol penuh
--   editor = mengelola konten, tetapi tidak dapat publish / mengelola user & role
-- Public hanya membaca konten published.

create extension if not exists pgcrypto;

-- =========================================================
-- 1. COMMON FUNCTIONS
-- =========================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
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
      and role = 'admin'
  );
$$;

create or replace function public.is_editor()
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
      and role = 'editor'
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or public.is_editor();
$$;

-- =========================================================
-- 2. PROFILES / USERS
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'editor',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Normalisasi role pada database lama.
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin','editor'));

-- =========================================================
-- 3. CATEGORIES / TOPICS
-- =========================================================
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

-- =========================================================
-- 4. ARTICLES
-- =========================================================
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text,
  cover_image_url text,
  category_id uuid references public.categories(id) on delete set null,
  author_id uuid references public.profiles(id) on delete set null,
  status text not null default 'draft',
  featured boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.articles
  drop constraint if exists articles_status_check;

alter table public.articles
  add constraint articles_status_check
  check (status in ('draft','review','published','archived'));

-- =========================================================
-- 5. YOUTUBE VIDEOS
-- =========================================================
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique,
  youtube_url text,
  youtube_video_id text not null,
  thumbnail_url text,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  author_id uuid references public.profiles(id) on delete set null,
  status text not null default 'draft',
  featured boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.videos
  add column if not exists slug text;

alter table public.videos
  add column if not exists author_id uuid references public.profiles(id) on delete set null;

alter table public.videos
  drop constraint if exists videos_status_check;

alter table public.videos
  add constraint videos_status_check
  check (status in ('draft','review','published','archived'));

-- =========================================================
-- 6. YOUTUBE PLAYLISTS
-- =========================================================
create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique,
  youtube_playlist_id text not null,
  description text,
  cover_image_url text,
  category_id uuid references public.categories(id) on delete set null,
  author_id uuid references public.profiles(id) on delete set null,
  status text not null default 'draft',
  featured boolean not null default false,
  sort_order integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.playlists
  add column if not exists slug text;

alter table public.playlists
  add column if not exists author_id uuid references public.profiles(id) on delete set null;

alter table public.playlists
  drop constraint if exists playlists_status_check;

alter table public.playlists
  add constraint playlists_status_check
  check (status in ('draft','review','published','archived'));

-- =========================================================
-- 7. PODCASTS
-- =========================================================
create table if not exists public.podcasts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  cover_image_url text,
  youtube_url text,
  youtube_video_id text,
  category_id uuid references public.categories(id) on delete set null,
  author_id uuid references public.profiles(id) on delete set null,
  status text not null default 'draft',
  featured boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.podcasts
  add column if not exists author_id uuid references public.profiles(id) on delete set null;

alter table public.podcasts
  add column if not exists featured boolean not null default false;

alter table public.podcasts
  drop constraint if exists podcasts_status_check;

alter table public.podcasts
  add constraint podcasts_status_check
  check (status in ('draft','review','published','archived'));

-- =========================================================
-- 8. MEDIA
-- =========================================================
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_url text not null,
  storage_path text,
  mime_type text,
  file_size bigint,
  alt_text text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.media
  add column if not exists storage_path text;

alter table public.media
  add column if not exists mime_type text;

alter table public.media
  add column if not exists file_size bigint;

-- =========================================================
-- 9. INDEXES
-- =========================================================
create index if not exists idx_profiles_role
  on public.profiles(role);

create index if not exists idx_categories_sort
  on public.categories(sort_order);

create index if not exists idx_articles_status_published
  on public.articles(status, published_at desc);

create index if not exists idx_articles_category
  on public.articles(category_id);

create index if not exists idx_articles_author
  on public.articles(author_id);

create index if not exists idx_videos_status_published
  on public.videos(status, published_at desc);

create index if not exists idx_videos_category
  on public.videos(category_id);

create index if not exists idx_playlists_status_sort
  on public.playlists(status, sort_order);

create index if not exists idx_playlists_category
  on public.playlists(category_id);

create index if not exists idx_podcasts_status_published
  on public.podcasts(status, published_at desc);

create index if not exists idx_podcasts_category
  on public.podcasts(category_id);

create unique index if not exists idx_videos_slug_unique
  on public.videos(slug)
  where slug is not null;

create unique index if not exists idx_playlists_slug_unique
  on public.playlists(slug)
  where slug is not null;

-- =========================================================
-- 10. UPDATED_AT TRIGGERS
-- =========================================================
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

-- =========================================================
-- 11. AUTO PROFILE AFTER SIGNUP
-- =========================================================
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

-- =========================================================
-- 12. PROTECT ROLE CHANGES
-- =========================================================
-- User biasa/editor tidak dapat menaikkan role dirinya sendiri.
-- Perubahan role hanya boleh dilakukan Admin atau operasi server/SQL yang aman.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and not public.is_admin()
     and new.role is distinct from old.role then
    new.role := old.role;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
before update on public.profiles
for each row execute function public.protect_profile_role();

-- =========================================================
-- 13. PROTECT EDITOR FROM PUBLISHING
-- =========================================================
-- Editor boleh membuat draft/review dan mengedit kontennya.
-- Editor tidak dapat mengubah konten menjadi published atau mengedit
-- konten yang sudah published.
create or replace function public.protect_editor_content_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_editor() then
    if old.status = 'published' then
      raise exception 'Editor tidak dapat mengubah konten yang sudah published.';
    end if;

    if new.status = 'published' then
      raise exception 'Editor tidak memiliki hak untuk publish konten.';
    end if;

    if new.status not in ('draft','review','archived') then
      raise exception 'Status konten tidak valid untuk Editor.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_editor_articles on public.articles;
create trigger protect_editor_articles
before update on public.articles
for each row execute function public.protect_editor_content_status();

drop trigger if exists protect_editor_videos on public.videos;
create trigger protect_editor_videos
before update on public.videos
for each row execute function public.protect_editor_content_status();

drop trigger if exists protect_editor_playlists on public.playlists;
create trigger protect_editor_playlists
before update on public.playlists
for each row execute function public.protect_editor_content_status();

drop trigger if exists protect_editor_podcasts on public.podcasts;
create trigger protect_editor_podcasts
before update on public.podcasts
for each row execute function public.protect_editor_content_status();

-- =========================================================
-- 14. ROW LEVEL SECURITY
-- =========================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.articles enable row level security;
alter table public.videos enable row level security;
alter table public.playlists enable row level security;
alter table public.podcasts enable row level security;
alter table public.media enable row level security;

-- =========================================================
-- 15. DROP OLD POLICIES
-- =========================================================
drop policy if exists "public read active categories" on public.categories;
drop policy if exists "staff manage categories" on public.categories;
drop policy if exists "admin manage categories" on public.categories;

drop policy if exists "public read published articles" on public.articles;
drop policy if exists "staff manage articles" on public.articles;
drop policy if exists "staff read articles" on public.articles;
drop policy if exists "admin manage articles" on public.articles;
drop policy if exists "editor manage articles" on public.articles;

drop policy if exists "public read published videos" on public.videos;
drop policy if exists "staff manage videos" on public.videos;
drop policy if exists "staff read videos" on public.videos;
drop policy if exists "admin manage videos" on public.videos;
drop policy if exists "editor manage videos" on public.videos;

drop policy if exists "public read published playlists" on public.playlists;
drop policy if exists "staff manage playlists" on public.playlists;
drop policy if exists "staff read playlists" on public.playlists;
drop policy if exists "admin manage playlists" on public.playlists;
drop policy if exists "editor manage playlists" on public.playlists;

drop policy if exists "public read published podcasts" on public.podcasts;
drop policy if exists "staff manage podcasts" on public.podcasts;
drop policy if exists "staff read podcasts" on public.podcasts;
drop policy if exists "admin manage podcasts" on public.podcasts;
drop policy if exists "editor manage podcasts" on public.podcasts;

drop policy if exists "staff manage media" on public.media;
drop policy if exists "staff read media" on public.media;
drop policy if exists "admin manage media" on public.media;
drop policy if exists "editor manage media" on public.media;

drop policy if exists "users read own profile" on public.profiles;
drop policy if exists "users update own profile" on public.profiles;
drop policy if exists "admin read profiles" on public.profiles;
drop policy if exists "admin manage profiles" on public.profiles;

-- =========================================================
-- 16. PUBLIC READ POLICIES
-- =========================================================
create policy "public read active categories"
on public.categories for select
to anon, authenticated
using (is_active = true);

create policy "public read published articles"
on public.articles for select
to anon, authenticated
using (status = 'published');

create policy "public read published videos"
on public.videos for select
to anon, authenticated
using (status = 'published');

create policy "public read published playlists"
on public.playlists for select
to anon, authenticated
using (status = 'published');

create policy "public read published podcasts"
on public.podcasts for select
to anon, authenticated
using (status = 'published');

-- =========================================================
-- 17. ADMIN POLICIES
-- =========================================================
create policy "admin read profiles"
on public.profiles for select
to authenticated
using (public.is_admin());

create policy "admin manage profiles"
on public.profiles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admin manage categories"
on public.categories for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admin manage articles"
on public.articles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admin manage videos"
on public.videos for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admin manage playlists"
on public.playlists for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admin manage podcasts"
on public.podcasts for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admin manage media"
on public.media for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- =========================================================
-- 18. EDITOR POLICIES — CONTENT ONLY
-- =========================================================
-- Editor dapat membaca semua data CMS, termasuk draft/review.
create policy "editor read articles"
on public.articles for select
to authenticated
using (public.is_editor());

create policy "editor read videos"
on public.videos for select
to authenticated
using (public.is_editor());

create policy "editor read playlists"
on public.playlists for select
to authenticated
using (public.is_editor());

create policy "editor read podcasts"
on public.podcasts for select
to authenticated
using (public.is_editor());

create policy "editor read media"
on public.media for select
to authenticated
using (public.is_editor());

-- Editor INSERT: hanya draft/review.
create policy "editor insert articles"
on public.articles for insert
to authenticated
with check (
  public.is_editor()
  and status in ('draft','review')
);

create policy "editor insert videos"
on public.videos for insert
to authenticated
with check (
  public.is_editor()
  and status in ('draft','review')
);

create policy "editor insert playlists"
on public.playlists for insert
to authenticated
with check (
  public.is_editor()
  and status in ('draft','review')
);

create policy "editor insert podcasts"
on public.podcasts for insert
to authenticated
with check (
  public.is_editor()
  and status in ('draft','review')
);

create policy "editor insert media"
on public.media for insert
to authenticated
with check (public.is_editor());

-- Editor UPDATE: hanya konten yang belum published.
create policy "editor update articles"
on public.articles for update
to authenticated
using (
  public.is_editor()
  and status <> 'published'
)
with check (
  public.is_editor()
  and status in ('draft','review','archived')
);

create policy "editor update videos"
on public.videos for update
to authenticated
using (
  public.is_editor()
  and status <> 'published'
)
with check (
  public.is_editor()
  and status in ('draft','review','archived')
);

create policy "editor update playlists"
on public.playlists for update
to authenticated
using (
  public.is_editor()
  and status <> 'published'
)
with check (
  public.is_editor()
  and status in ('draft','review','archived')
);

create policy "editor update podcasts"
on public.podcasts for update
to authenticated
using (
  public.is_editor()
  and status <> 'published'
)
with check (
  public.is_editor()
  and status in ('draft','review','archived')
);

create policy "editor update media"
on public.media for update
to authenticated
using (public.is_editor())
with check (public.is_editor());

-- Editor boleh menghapus draft/review, tetapi tidak published.
create policy "editor delete articles"
on public.articles for delete
to authenticated
using (
  public.is_editor()
  and status <> 'published'
);

create policy "editor delete videos"
on public.videos for delete
to authenticated
using (
  public.is_editor()
  and status <> 'published'
);

create policy "editor delete playlists"
on public.playlists for delete
to authenticated
using (
  public.is_editor()
  and status <> 'published'
);

create policy "editor delete podcasts"
on public.podcasts for delete
to authenticated
using (
  public.is_editor()
  and status <> 'published'
);

create policy "editor delete media"
on public.media for delete
to authenticated
using (public.is_editor());

-- =========================================================
-- 19. OWN PROFILE POLICY
-- =========================================================
create policy "users read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "users update own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- =========================================================
-- 20. DEFAULT 9 MANDALA TOPICS
-- =========================================================
insert into public.categories
  (name, slug, description, sort_order, is_active)
values
  (
    'Candika',
    'candika',
    'Sejarah, jejak, pemikiran, dan perjalanan Hindu di Jawa dan Nusantara.',
    1,
    true
  ),
  (
    'Dharma Ajaran',
    'dharma-ajaran',
    'Ajaran, filosofi, nilai, dan pemahaman Dharma dalam kehidupan.',
    2,
    true
  ),
  (
    'Dharmika',
    'dharmika',
    'Kisah perjalanan spiritual dan kehidupan mereka yang menemukan jalan Dharma.',
    3,
    true
  ),
  (
    'Ekonomi Hindu',
    'ekonomi-hindu',
    'Podcast dan cerita mengenai pengusaha serta perkembangan perekonomian Hindu Jawa.',
    4,
    true
  ),
  (
    'Jelajah Nusantara',
    'jelajah-nusantara',
    'Tempat, komunitas, peninggalan, kehidupan, dan jejak Hindu di Nusantara.',
    5,
    true
  ),
  (
    'Kabar Umat',
    'kabar-umat',
    'Kabar, kegiatan, perkembangan, dan cerita umat Hindu di berbagai daerah.',
    6,
    true
  ),
  (
    'Spiritual',
    'spiritual',
    'Upacara, ritual, kegiatan keagamaan, dan kehidupan spiritual Hindu.',
    7,
    true
  ),
  (
    'Tokoh Hindu',
    'tokoh-hindu',
    'Sosok, pemikiran, karya, perjuangan, dan kontribusi tokoh Hindu.',
    8,
    true
  ),
  (
    'Tradisi Budaya',
    'tradisi-budaya',
    'Tradisi, budaya, dan warisan Hindu yang hidup dan berkembang di Nusantara.',
    9,
    true
  )
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

-- =========================================================
-- 21. STORAGE BUCKET
-- =========================================================
-- Bucket publik untuk aset gambar/media yang memang ditampilkan website.
insert into storage.buckets (id, name, public)
values ('mandala-media', 'mandala-media', true)
on conflict (id) do update set public = true;

-- =========================================================
-- 22. STORAGE POLICIES
-- =========================================================
drop policy if exists "public read mandala media" on storage.objects;
drop policy if exists "staff upload mandala media" on storage.objects;
drop policy if exists "staff update mandala media" on storage.objects;
drop policy if exists "staff delete mandala media" on storage.objects;

create policy "public read mandala media"
on storage.objects for select
to public
using (bucket_id = 'mandala-media');

create policy "staff upload mandala media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'mandala-media'
  and public.is_staff()
);

create policy "staff update mandala media"
on storage.objects for update
to authenticated
using (
  bucket_id = 'mandala-media'
  and public.is_staff()
)
with check (
  bucket_id = 'mandala-media'
  and public.is_staff()
);

create policy "staff delete mandala media"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'mandala-media'
  and public.is_staff()
);

-- =========================================================
-- 23. FINAL NOTES
-- =========================================================
-- Setelah schema berhasil dijalankan:
-- 1. Buat user pertama melalui Supabase Authentication.
-- 2. Jadikan user tersebut Admin melalui SQL Editor:
--
--    update public.profiles
--    set role = 'admin'
--    where id = 'UUID_USER_ANDA';
--
-- Jangan masukkan service_role key ke frontend.
-- Publishable/anon key hanya aman digunakan bersama RLS yang benar.
