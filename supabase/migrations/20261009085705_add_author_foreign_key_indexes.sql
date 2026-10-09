-- Performance indexes for foreign-key lookups used by CMS media and content ownership.
create index if not exists idx_media_uploaded_by on public.media (uploaded_by);
create index if not exists idx_playlists_author_id on public.playlists (author_id);
create index if not exists idx_podcasts_author_id on public.podcasts (author_id);
create index if not exists idx_videos_author_id on public.videos (author_id);
