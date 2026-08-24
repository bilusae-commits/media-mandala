-- MANDALA CHANNEL — SUPABASE FINAL SCHEMA
-- Role: admin = full control, editor = content management without publishing.
-- Public users only read published content.
--
-- IMPORTANT:
-- User baru TIDAK otomatis menjadi editor. Role awal = pending.
-- Admin harus menetapkan role editor/admin secara eksplisit.

create extension if not exists pgcrypto;

-- COMMON FUNCTIONS
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_editor()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'editor');
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or public.is_editor();
$$;

-- PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'pending',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists role text;
alter table public.profiles alter column role set default 'pending';
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('pending','admin','editor'));

-- Keep existing valid admin/editor roles. Only normalize legacy invalid/empty roles.
update public.profiles set role = 'pending' where role is null or role not in ('pending','admin','editor');

-- CATEGORIES
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique,
  description text, image_url text, sort_order integer not null default 0,
  is_active boolean not null default true, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ARTICLES
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(), title text not null, slug text not null unique,
  excerpt text, content text, cover_image_url text,
  category_id uuid references public.categories(id) on delete set null,
  author_id uuid references public.profiles(id) on delete set null,
  status text not null default 'draft', featured boolean not null default false,
  published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.articles drop constraint if exists articles_status_check;
alter table public.articles add constraint articles_status_check check (status in ('draft','review','published','archived'));

-- VIDEOS
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(), title text not null, slug text unique,
  youtube_url text, youtube_video_id text not null, thumbnail_url text, description text,
  category_id uuid references public.categories(id) on delete set null,
  author_id uuid references public.profiles(id) on delete set null,
  status text not null default 'draft', featured boolean not null default false,
  published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.videos add column if not exists slug text;
alter table public.videos add column if not exists author_id uuid references public.profiles(id) on delete set null;
alter table public.videos drop constraint if exists videos_status_check;
alter table public.videos add constraint videos_status_check check (status in ('draft','review','published','archived'));

-- PLAYLISTS
create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(), title text not null, slug text unique,
  youtube_playlist_id text not null, description text, cover_image_url text,
  category_id uuid references public.categories(id) on delete set null,
  author_id uuid references public.profiles(id) on delete set null,
  status text not null default 'draft', featured boolean not null default false,
  sort_order integer not null default 0, published_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.playlists add column if not exists slug text;
alter table public.playlists add column if not exists author_id uuid references public.profiles(id) on delete set null;
alter table public.playlists drop constraint if exists playlists_status_check;
alter table public.playlists add constraint playlists_status_check check (status in ('draft','review','published','archived'));

-- PODCASTS
create table if not exists public.podcasts (
  id uuid primary key default gen_random_uuid(), title text not null, slug text not null unique,
  description text, cover_image_url text, youtube_url text, youtube_video_id text,
  category_id uuid references public.categories(id) on delete set null,
  author_id uuid references public.profiles(id) on delete set null,
  status text not null default 'draft', featured boolean not null default false,
  published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.podcasts add column if not exists author_id uuid references public.profiles(id) on delete set null;
alter table public.podcasts add column if not exists featured boolean not null default false;
alter table public.podcasts drop constraint if exists podcasts_status_check;
alter table public.podcasts add constraint podcasts_status_check check (status in ('draft','review','published','archived'));

-- MEDIA
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(), file_name text not null, file_url text not null,
  storage_path text, mime_type text, file_size bigint, alt_text text,
  uploaded_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now()
);
alter table public.media add column if not exists storage_path text;
alter table public.media add column if not exists mime_type text;
alter table public.media add column if not exists file_size bigint;

-- INDEXES
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_categories_sort on public.categories(sort_order);
create index if not exists idx_articles_status_published on public.articles(status, published_at desc);
create index if not exists idx_articles_category on public.articles(category_id);
create index if not exists idx_articles_author on public.articles(author_id);
create index if not exists idx_videos_status_published on public.videos(status, published_at desc);
create index if not exists idx_videos_category on public.videos(category_id);
create index if not exists idx_playlists_status_sort on public.playlists(status, sort_order);
create index if not exists idx_playlists_category on public.playlists(category_id);
create index if not exists idx_podcasts_status_published on public.podcasts(status, published_at desc);
create index if not exists idx_podcasts_category on public.podcasts(category_id);
create unique index if not exists idx_videos_slug_unique on public.videos(slug) where slug is not null;
create unique index if not exists idx_playlists_slug_unique on public.playlists(slug) where slug is not null;

-- UPDATED_AT TRIGGERS
 drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists categories_updated_at on public.categories;
create trigger categories_updated_at before update on public.categories for each row execute function public.set_updated_at();
drop trigger if exists articles_updated_at on public.articles;
create trigger articles_updated_at before update on public.articles for each row execute function public.set_updated_at();
drop trigger if exists videos_updated_at on public.videos;
create trigger videos_updated_at before update on public.videos for each row execute function public.set_updated_at();
drop trigger if exists playlists_updated_at on public.playlists;
create trigger playlists_updated_at before update on public.playlists for each row execute function public.set_updated_at();
drop trigger if exists podcasts_updated_at on public.podcasts;
create trigger podcasts_updated_at before update on public.podcasts for each row execute function public.set_updated_at();

-- AUTO PROFILE AFTER SIGNUP
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'pending')
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- PROTECT ROLE CHANGES
create or replace function public.protect_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() and new.role is distinct from old.role then
    new.role := old.role;
  end if;
  return new;
end;
$$;
drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role before update on public.profiles for each row execute function public.protect_profile_role();

-- PROTECT EDITOR FROM PUBLISHING
create or replace function public.protect_editor_content_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_editor() then
    if old.status = 'published' then raise exception 'Editor tidak dapat mengubah konten yang sudah published.'; end if;
    if new.status = 'published' then raise exception 'Editor tidak memiliki hak untuk publish konten.'; end if;
    if new.status not in ('draft','review','archived') then raise exception 'Status konten tidak valid untuk Editor.'; end if;
  end if;
  return new;
end;
$$;
drop trigger if exists protect_editor_articles on public.articles;
create trigger protect_editor_articles before update on public.articles for each row execute function public.protect_editor_content_status();
drop trigger if exists protect_editor_videos on public.videos;
create trigger protect_editor_videos before update on public.videos for each row execute function public.protect_editor_content_status();
drop trigger if exists protect_editor_playlists on public.playlists;
create trigger protect_editor_playlists before update on public.playlists for each row execute function public.protect_editor_content_status();
drop trigger if exists protect_editor_podcasts on public.podcasts;
create trigger protect_editor_podcasts before update on public.podcasts for each row execute function public.protect_editor_content_status();

-- RLS
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.articles enable row level security;
alter table public.videos enable row level security;
alter table public.playlists enable row level security;
alter table public.podcasts enable row level security;
alter table public.media enable row level security;

-- Remove known legacy policies
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname='public' AND tablename IN ('profiles','categories','articles','videos','playlists','podcasts','media') LOOP
    EXECUTE format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- PUBLIC READ
create policy "public read active categories" on public.categories for select to anon, authenticated using (is_active = true);
create policy "public read published articles" on public.articles for select to anon, authenticated using (status = 'published');
create policy "public read published videos" on public.videos for select to anon, authenticated using (status = 'published');
create policy "public read published playlists" on public.playlists for select to anon, authenticated using (status = 'published');
create policy "public read published podcasts" on public.podcasts for select to anon, authenticated using (status = 'published');

-- ADMIN
create policy "admin read profiles" on public.profiles for select to authenticated using (public.is_admin());
create policy "admin manage profiles" on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin manage categories" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin manage articles" on public.articles for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin manage videos" on public.videos for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin manage playlists" on public.playlists for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin manage podcasts" on public.podcasts for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin manage media" on public.media for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- STAFF READ NON-PUBLISHED CONTENT
create policy "staff read categories" on public.categories for select to authenticated using (public.is_staff());
create policy "staff read articles" on public.articles for select to authenticated using (public.is_staff());
create policy "staff read videos" on public.videos for select to authenticated using (public.is_staff());
create policy "staff read playlists" on public.playlists for select to authenticated using (public.is_staff());
create policy "staff read podcasts" on public.podcasts for select to authenticated using (public.is_staff());
create policy "staff read media" on public.media for select to authenticated using (public.is_staff());

-- EDITOR CONTENT MANAGEMENT
create policy "editor insert articles" on public.articles for insert to authenticated with check (public.is_editor() and status in ('draft','review','archived'));
create policy "editor update articles" on public.articles for update to authenticated using (public.is_editor()) with check (public.is_editor() and status in ('draft','review','archived'));
create policy "editor insert videos" on public.videos for insert to authenticated with check (public.is_editor() and status in ('draft','review','archived'));
create policy "editor update videos" on public.videos for update to authenticated using (public.is_editor()) with check (public.is_editor() and status in ('draft','review','archived'));
create policy "editor insert playlists" on public.playlists for insert to authenticated with check (public.is_editor() and status in ('draft','review','archived'));
create policy "editor update playlists" on public.playlists for update to authenticated using (public.is_editor()) with check (public.is_editor() and status in ('draft','review','archived'));
create policy "editor insert podcasts" on public.podcasts for insert to authenticated with check (public.is_editor() and status in ('draft','review','archived'));
create policy "editor update podcasts" on public.podcasts for update to authenticated using (public.is_editor()) with check (public.is_editor() and status in ('draft','review','archived'));
create policy "editor insert media" on public.media for insert to authenticated with check (public.is_editor());
create policy "editor update media" on public.media for update to authenticated using (public.is_editor()) with check (public.is_editor());

-- EDITOR CATEGORY READ-ONLY; category creation remains ADMIN-only.

-- PROFILE SELF READ
create policy "users read own profile" on public.profiles for select to authenticated using (id = auth.uid());

-- GRANTS
revoke all on all tables in schema public from anon;
grant select on public.categories, public.articles, public.videos, public.playlists, public.podcasts to anon;
grant select on public.profiles, public.categories, public.articles, public.videos, public.playlists, public.podcasts, public.media to authenticated;

-- NOTE: Storage bucket policies must be configured separately in Supabase Storage.
-- This schema intentionally does not overwrite storage.objects policies.
